/**
 * Metallurgical Melting Charge Calculator Engine
 *
 * Implements simultaneous mass-balance equations for multi-component alloy melting charges:
 * w_0 + sum(w_j) = W_batch
 * sum(A_{k, j} * w_j) + q_{0, k} * w_0 = c_k * W_batch
 */

import {
  MasterAlloy,
  ChargeCalculationResult,
  MaterialAddition,
  CalculatedElementResult,
  MasterAlloySuggestion,
} from "@/types";
import { COMMON_MASTER_ALLOYS } from "@/lib/data/master-alloys";
import { roundToPrecision, METALLURGY_EPSILON } from "./balance";

export interface ChargeSolverInput {
  baseMetalSymbol: string;
  baseMetalName: string;
  baseMetalPurity: number; // e.g. 99.7%
  baseMetalImpurities?: { symbol: string; percent: number }[];
  targetSolutes: { symbol: string; percent: number }[];
  selectedMasterAlloys: MasterAlloy[];
  batchWeightGrams: number;
}

/**
 * Solves a square linear system M * w = b using Gaussian elimination with partial pivoting.
 */
function solveLinearSystem(matrix: number[][], vector: number[]): number[] | null {
  const n = vector.length;
  // Deep clone
  const A = matrix.map((row) => [...row]);
  const b = [...vector];

  for (let i = 0; i < n; i++) {
    // Pivot selection
    let maxRow = i;
    let maxVal = Math.abs(A[i][i]);
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(A[k][i]) > maxVal) {
        maxVal = Math.abs(A[k][i]);
        maxRow = k;
      }
    }

    if (maxVal < 1e-9) {
      // Singular or near-singular matrix (linearly dependent master alloys)
      return null;
    }

    // Swap rows
    if (maxRow !== i) {
      const tempRow = A[i];
      A[i] = A[maxRow];
      A[maxRow] = tempRow;
      const tempB = b[i];
      b[i] = b[maxRow];
      b[maxRow] = tempB;
    }

    // Eliminate below
    for (let k = i + 1; k < n; k++) {
      const factor = A[k][i] / A[i][i];
      for (let j = i; j < n; j++) {
        A[k][j] -= factor * A[i][j];
      }
      b[k] -= factor * b[i];
    }
  }

  // Back substitution
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = 0;
    for (let j = i + 1; j < n; j++) {
      sum += A[i][j] * x[j];
    }
    x[i] = (b[i] - sum) / A[i][i];
  }

  return x;
}

/**
 * Calculates the exact theoretical weights of all charge materials.
 */
export function calculateMeltingCharge(input: ChargeSolverInput): ChargeCalculationResult {
  const {
    baseMetalSymbol,
    baseMetalName,
    baseMetalPurity,
    baseMetalImpurities = [],
    targetSolutes,
    selectedMasterAlloys,
    batchWeightGrams,
  } = input;

  const W = Math.max(0.1, batchWeightGrams);
  const warnings: string[] = [];
  const assumptions: string[] = [
    "Theoretical charge calculation assumes 100% melting recovery without oxidation, volatilization, or slag/dross losses.",
    "Assumes complete, homogeneous thermal dissolution of all master alloys into the liquid melt.",
    `Base metal ${baseMetalName} purity is rated at ${baseMetalPurity.toFixed(2)} wt.%.`,
  ];

  // Base metal impurity map
  const baseImpurityFractionMap = new Map<string, number>();
  for (const imp of baseMetalImpurities) {
    baseImpurityFractionMap.set(imp.symbol.toUpperCase(), imp.percent / 100);
  }

  // Active target solutes with positive percentage
  const activeSolutes = targetSolutes.filter(
    (s) => s.percent > 0 && s.symbol.toUpperCase() !== baseMetalSymbol.toUpperCase()
  );

  // If no master alloys and no solutes, charge is 100% base metal
  if (activeSolutes.length === 0 && selectedMasterAlloys.length === 0) {
    return {
      isFeasible: true,
      batchWeightGrams: W,
      baseMetalWeightGrams: W,
      additions: [
        {
          materialId: "base-metal",
          materialName: `${baseMetalName} (${baseMetalSymbol})`,
          materialCode: `${baseMetalSymbol}-${baseMetalPurity}%`,
          materialType: "base_metal",
          weightGrams: roundToPrecision(W, 2),
          percentageOfCharge: 100.0,
          compositionSummary: `${baseMetalPurity.toFixed(2)}% ${baseMetalSymbol}`,
          elementsContributed: [{ symbol: baseMetalSymbol, weightGrams: W }],
        },
      ],
      totalChargeWeightGrams: roundToPrecision(W, 2),
      elementResults: [
        {
          symbol: baseMetalSymbol,
          targetPercent: 100.0,
          calculatedPercent: 100.0,
          deviationPercent: 0.0,
          totalWeightGrams: W,
          status: "exact",
        },
      ],
      massBalanceVerified: true,
      massBalanceDifferenceGrams: 0.0,
      warnings,
      assumptions,
      solverType: "direct",
    };
  }

  // Match solutes with master alloys
  // Check if we can solve using decoupled direct formulation or simultaneous linear system
  const numSolutes = activeSolutes.length;
  const numAlloys = selectedMasterAlloys.length;

  let alloyWeights: number[] = [];
  let solverType: "direct" | "linear_system" | "none" = "direct";

  // Check if each master alloy supplies exactly one target element (diagonal-dominant/decoupled)
  const isDecoupled = selectedMasterAlloys.every((ma) => {
    const matchingSolutes = activeSolutes.filter((s) =>
      ma.elements.some((el) => el.symbol.toUpperCase() === s.symbol.toUpperCase())
    );
    return matchingSolutes.length <= 1;
  });

  if (isDecoupled && numSolutes === numAlloys) {
    // Decoupled direct solution
    solverType = "direct";
    alloyWeights = selectedMasterAlloys.map((ma) => {
      // Find the primary target element this master alloy contributes
      const targetElement = activeSolutes.find((s) =>
        ma.elements.some((el) => el.symbol.toUpperCase() === s.symbol.toUpperCase())
      );

      if (!targetElement) return 0;

      const maEl = ma.elements.find(
        (el) => el.symbol.toUpperCase() === targetElement.symbol.toUpperCase()
      )!;
      const A_kj = maEl.percent / 100;
      const q_0k = baseImpurityFractionMap.get(targetElement.symbol.toUpperCase()) || 0;
      const c_k = targetElement.percent / 100;

      // w_j = (c_k - q_0k) * W / (A_kj - q_0k)
      const denom = A_kj - q_0k;
      if (Math.abs(denom) < 1e-6) return 0;

      return ((c_k - q_0k) * W) / denom;
    });
  } else if (numSolutes === numAlloys && numSolutes > 0) {
    // Simultaneous Linear System: M * w = b
    solverType = "linear_system";
    const matrix: number[][] = [];
    const vector: number[] = [];

    for (let k = 0; k < numSolutes; k++) {
      const targetEl = activeSolutes[k];
      const q_0k = baseImpurityFractionMap.get(targetEl.symbol.toUpperCase()) || 0;
      const c_k = targetEl.percent / 100;

      vector.push((c_k - q_0k) * W);

      const row: number[] = [];
      for (let j = 0; j < numAlloys; j++) {
        const ma = selectedMasterAlloys[j];
        const maEl = ma.elements.find(
          (el) => el.symbol.toUpperCase() === targetEl.symbol.toUpperCase()
        );
        const A_kj = maEl ? maEl.percent / 100 : 0;
        row.push(A_kj - q_0k);
      }
      matrix.push(row);
    }

    const sol = solveLinearSystem(matrix, vector);
    if (!sol) {
      return {
        isFeasible: false,
        batchWeightGrams: W,
        baseMetalWeightGrams: 0,
        additions: [],
        totalChargeWeightGrams: 0,
        elementResults: [],
        massBalanceVerified: false,
        massBalanceDifferenceGrams: 0,
        warnings: [
          "Linear system is singular or under-determined: Selected master alloys have overlapping elemental compositions that cannot be uniquely resolved.",
        ],
        assumptions,
        infeasibleReason:
          "The selected combination of master alloys has linearly dependent compositions. Select master alloys with distinct primary elements.",
        solverType: "linear_system",
      };
    }
    alloyWeights = sol;
  } else {
    // Over-determined or under-determined (e.g. 3 solutes, 2 master alloys or 1 solute, 2 master alloys)
    // Approximate / solve for matching elements
    solverType = "direct";
    alloyWeights = selectedMasterAlloys.map((ma) => {
      // Find the primary element in this master alloy
      const primaryEl = [...ma.elements].sort((a, b) => b.percent - a.percent)[0];
      if (!primaryEl) return 0;

      const target = activeSolutes.find(
        (s) => s.symbol.toUpperCase() === primaryEl.symbol.toUpperCase()
      );
      if (!target) return 0;

      const A_kj = primaryEl.percent / 100;
      const q_0k = baseImpurityFractionMap.get(target.symbol.toUpperCase()) || 0;
      const c_k = target.percent / 100;

      return ((c_k - q_0k) * W) / Math.max(1e-4, A_kj - q_0k);
    });

    if (numAlloys < numSolutes) {
      warnings.push(
        `Under-supplied recipe: Only ${numAlloys} master alloy${numAlloys === 1 ? "" : "s"} selected for ${numSolutes} target solute elements. Unmatched elements will be deficient.`
      );
    } else if (numAlloys > numSolutes) {
      warnings.push(
        `Over-supplied recipe: ${numAlloys} master alloys selected for ${numSolutes} solutes. Redundant master alloys may cause calculation ambiguity.`
      );
    }
  }

  // Check feasibility: negative weights
  for (let j = 0; j < alloyWeights.length; j++) {
    const w = alloyWeights[j];
    if (w < -METALLURGY_EPSILON) {
      const ma = selectedMasterAlloys[j];
      return {
        isFeasible: false,
        batchWeightGrams: W,
        baseMetalWeightGrams: 0,
        additions: [],
        totalChargeWeightGrams: 0,
        elementResults: [],
        massBalanceVerified: false,
        massBalanceDifferenceGrams: 0,
        warnings: [
          `Infeasible negative addition: ${ma.name} (${ma.code}) calculated weight is ${w.toFixed(2)} g.`,
        ],
        assumptions,
        infeasibleReason: `Target composition requires negative addition of ${ma.name} (${w.toFixed(2)} g). A master alloy introduces excessive amounts of an overlapping element, or base metal impurities already exceed the target concentration.`,
        solverType,
      };
    }
  }

  // Calculate base metal weight
  const sumMasterAlloys = alloyWeights.reduce((acc, w) => acc + Math.max(0, w), 0);
  const baseMetalWeight = W - sumMasterAlloys;

  if (baseMetalWeight < -METALLURGY_EPSILON) {
    return {
      isFeasible: false,
      batchWeightGrams: W,
      baseMetalWeightGrams: 0,
      additions: [],
      totalChargeWeightGrams: 0,
      elementResults: [],
      massBalanceVerified: false,
      massBalanceDifferenceGrams: 0,
      warnings: [
        `Infeasible charge weight: Total master alloys (${sumMasterAlloys.toFixed(2)} g) exceed the total batch weight (${W.toFixed(2)} g).`,
      ],
      assumptions,
      infeasibleReason: `The combined master alloy additions (${sumMasterAlloys.toFixed(2)} g) exceed the requested batch weight (${W.toFixed(2)} g), leaving no room for base metal ${baseMetalName}.`,
      solverType,
    };
  }

  const safeBaseMetalWeight = Math.max(0, baseMetalWeight);

  // Construct Material Additions Table
  const additions: MaterialAddition[] = [];

  // 1. Base Metal Entry
  const baseElementsContributed: { symbol: string; weightGrams: number }[] = [
    {
      symbol: baseMetalSymbol,
      weightGrams: safeBaseMetalWeight * (baseMetalPurity / 100),
    },
  ];
  for (const imp of baseMetalImpurities) {
    baseElementsContributed.push({
      symbol: imp.symbol,
      weightGrams: safeBaseMetalWeight * (imp.percent / 100),
    });
  }

  additions.push({
    materialId: "base-metal",
    materialName: `Base ${baseMetalName}`,
    materialCode: `${baseMetalSymbol}-${baseMetalPurity}%`,
    materialType: "base_metal",
    weightGrams: roundToPrecision(safeBaseMetalWeight, 2),
    percentageOfCharge: roundToPrecision((safeBaseMetalWeight / W) * 100, 2),
    compositionSummary: `${baseMetalPurity.toFixed(2)}% ${baseMetalSymbol}`,
    elementsContributed: baseElementsContributed,
  });

  // 2. Master Alloy Entries
  for (let j = 0; j < selectedMasterAlloys.length; j++) {
    const ma = selectedMasterAlloys[j];
    const w = Math.max(0, alloyWeights[j]);

    const compSummary = [
      ...ma.elements.map((el) => `${el.percent}% ${el.symbol}`),
      `${ma.balancePercent}% ${ma.balanceElement}`,
    ].join(", ");

    const contributed: { symbol: string; weightGrams: number }[] = ma.elements.map(
      (el) => ({
        symbol: el.symbol,
        weightGrams: w * (el.percent / 100),
      })
    );
    contributed.push({
      symbol: ma.balanceElement,
      weightGrams: w * (ma.balancePercent / 100),
    });

    additions.push({
      materialId: ma.id,
      materialName: ma.name,
      materialCode: ma.code,
      materialType: ma.elements.length === 1 && ma.elements[0].percent >= 99.0 ? "pure_element" : "master_alloy",
      weightGrams: roundToPrecision(w, 2),
      percentageOfCharge: roundToPrecision((w / W) * 100, 2),
      compositionSummary: compSummary,
      elementsContributed: contributed,
    });
  }

  // Calculate Predicted Final Alloy Composition
  const elementMassTotals = new Map<string, number>();

  for (const add of additions) {
    for (const ec of add.elementsContributed) {
      const sym = ec.symbol.toUpperCase();
      elementMassTotals.set(sym, (elementMassTotals.get(sym) || 0) + ec.weightGrams);
    }
  }

  // Build Element Results (Target vs Calculated)
  const allElementsSet = new Set<string>();
  for (const s of targetSolutes) allElementsSet.add(s.symbol.toUpperCase());
  allElementsSet.add(baseMetalSymbol.toUpperCase());
  for (const [sym] of elementMassTotals) allElementsSet.add(sym);

  const elementResults: CalculatedElementResult[] = [];

  for (const sym of allElementsSet) {
    const totalMassGrams = elementMassTotals.get(sym) || 0;
    const calculatedPercent = roundToPrecision((totalMassGrams / W) * 100, 3);

    // Find target
    let targetPercent = 0;
    if (sym === baseMetalSymbol.toUpperCase()) {
      const sumOtherTargets = targetSolutes
        .filter((s) => s.symbol.toUpperCase() !== baseMetalSymbol.toUpperCase())
        .reduce((acc, s) => acc + s.percent, 0);
      targetPercent = Math.max(0, 100 - sumOtherTargets);
    } else {
      const t = targetSolutes.find((s) => s.symbol.toUpperCase() === sym);
      targetPercent = t ? t.percent : 0;
    }

    const dev = roundToPrecision(calculatedPercent - targetPercent, 3);
    const absDev = Math.abs(dev);

    let status: "exact" | "acceptable" | "deviating" = "exact";
    if (absDev > 0.05) {
      status = "deviating";
    } else if (absDev > 0.005) {
      status = "acceptable";
    }

    elementResults.push({
      symbol: sym,
      targetPercent: roundToPrecision(targetPercent, 2),
      calculatedPercent,
      deviationPercent: dev,
      totalWeightGrams: roundToPrecision(totalMassGrams, 2),
      status,
    });
  }

  // Sort element results: Base metal first, then highest target percent
  elementResults.sort((a, b) => {
    if (a.symbol === baseMetalSymbol.toUpperCase()) return -1;
    if (b.symbol === baseMetalSymbol.toUpperCase()) return 1;
    return b.targetPercent - a.targetPercent;
  });

  // Verify total charge weight & mass balance
  const totalChargeWeight = roundToPrecision(
    additions.reduce((acc, a) => acc + a.weightGrams, 0),
    2
  );
  const diff = Math.abs(totalChargeWeight - W);
  const massBalanceVerified = diff < 0.05;

  return {
    isFeasible: true,
    batchWeightGrams: W,
    baseMetalWeightGrams: roundToPrecision(safeBaseMetalWeight, 2),
    additions,
    totalChargeWeightGrams: totalChargeWeight,
    elementResults,
    massBalanceVerified,
    massBalanceDifferenceGrams: roundToPrecision(diff, 3),
    warnings,
    assumptions,
    solverType,
  };
}

/**
 * Suggests standard master alloys based on target alloy solute elements.
 */
export function suggestMasterAlloys(
  baseMetalId: string,
  targetSolutes: { symbol: string; percent: number }[],
  availableAlloys: MasterAlloy[] = COMMON_MASTER_ALLOYS
): MasterAlloySuggestion[] {
  const suggestions: MasterAlloySuggestion[] = [];

  const baseAlloys = availableAlloys.filter(
    (ma) => ma.baseMetalId.toLowerCase() === baseMetalId.toLowerCase()
  );

  for (const solute of targetSolutes) {
    if (solute.percent <= 0) continue;

    // Find master alloys containing this element
    const matching = baseAlloys.filter((ma) =>
      ma.elements.some(
        (el) => el.symbol.toUpperCase() === solute.symbol.toUpperCase()
      )
    );

    if (matching.length === 0) continue;

    // Pick highest concentration of the element to minimize master alloy bulk
    matching.sort((a, b) => {
      const elA = a.elements.find(
        (el) => el.symbol.toUpperCase() === solute.symbol.toUpperCase()
      )!.percent;
      const elB = b.elements.find(
        (el) => el.symbol.toUpperCase() === solute.symbol.toUpperCase()
      )!.percent;
      return elB - elA;
    });

    const best = matching[0];
    const elInMa = best.elements.find(
      (el) => el.symbol.toUpperCase() === solute.symbol.toUpperCase()
    )!;

    suggestions.push({
      elementSymbol: solute.symbol,
      suggestedMasterAlloy: best,
      targetPercent: solute.percent,
      reason: `Standard vehicle for ${solute.symbol} addition (${elInMa.percent}% ${solute.symbol}).`,
      isSelected: true,
    });
  }

  return suggestions;
}
