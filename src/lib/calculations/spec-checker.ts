/**
 * Specification Range Checker Module
 *
 * Compares actual chemical composition against ASTM/SAE standardized tolerance bands.
 */

import { METALLURGY_EPSILON, roundToPrecision } from "./balance";

export type SpecComplianceStatus =
  | "within-spec"
  | "below-spec"
  | "above-spec"
  | "not-specified"
  | "missing-data";

export interface SpecLimit {
  elementSymbol: string;
  minPercent: number | null;
  maxPercent: number | null;
  nominalPercent?: number | null;
  isBalance?: boolean;
}

export interface ElementCheckResult {
  symbol: string;
  actualPercent: number;
  minPercent: number | null;
  maxPercent: number | null;
  nominalPercent: number | null;
  status: SpecComplianceStatus;
  statusMessage: string;
  deviation: number; // Difference from nearest boundary or nominal
  isBalance: boolean;
}

export interface SpecificationEvaluation {
  alloyDesignation?: string;
  totalElementsChecked: number;
  conformingElements: number;
  nonConformingElements: number;
  unspecifiedElements: number;
  isFullyCompliant: boolean;
  hasDeviations: boolean;
  results: ElementCheckResult[];
  summaryMessage: string;
}

/**
 * Check an individual element concentration against a specification boundary.
 *
 * NOTE: A null minPercent implies NO lower bound constraint beyond 0%.
 * A null maxPercent implies NO upper bound constraint beyond remainder.
 * Nominal values provide educational context, never replacing compliance limits.
 */
export function checkElementSpecification(
  symbol: string,
  actualPercent: number,
  spec?: SpecLimit
): ElementCheckResult {
  const roundedActual = roundToPrecision(actualPercent, 4);

  // If no specification entry exists for this element
  if (!spec) {
    return {
      symbol,
      actualPercent: roundedActual,
      minPercent: null,
      maxPercent: null,
      nominalPercent: null,
      status: "not-specified",
      statusMessage: "Not constrained in this alloy specification.",
      deviation: 0,
      isBalance: false,
    };
  }

  const { minPercent, maxPercent, nominalPercent, isBalance = false } = spec;

  // Handle invalid/negative actual values
  if (!Number.isFinite(roundedActual) || roundedActual < 0) {
    return {
      symbol,
      actualPercent: roundedActual,
      minPercent,
      maxPercent,
      nominalPercent: nominalPercent ?? null,
      status: "missing-data",
      statusMessage: "Invalid or negative percentage input.",
      deviation: 0,
      isBalance,
    };
  }

  // Check Below Minimum
  if (minPercent !== null && roundedActual < minPercent - METALLURGY_EPSILON) {
    const dev = roundToPrecision(minPercent - roundedActual, 4);
    return {
      symbol,
      actualPercent: roundedActual,
      minPercent,
      maxPercent,
      nominalPercent: nominalPercent ?? null,
      status: "below-spec",
      statusMessage: `Below minimum (${minPercent}%). Deficient by ${dev}%.`,
      deviation: -dev,
      isBalance,
    };
  }

  // Check Above Maximum
  if (maxPercent !== null && roundedActual > maxPercent + METALLURGY_EPSILON) {
    const dev = roundToPrecision(roundedActual - maxPercent, 4);
    return {
      symbol,
      actualPercent: roundedActual,
      minPercent,
      maxPercent,
      nominalPercent: nominalPercent ?? null,
      status: "above-spec",
      statusMessage: `Exceeds maximum (${maxPercent}%). Surplus of ${dev}%.`,
      deviation: dev,
      isBalance,
    };
  }

  // Within specification limits
  let withinMsg = "Within specification.";
  if (minPercent !== null && maxPercent !== null) {
    withinMsg = `Within range (${minPercent}% – ${maxPercent}%).`;
  } else if (maxPercent !== null) {
    withinMsg = `Within limit (Max ${maxPercent}%).`;
  } else if (minPercent !== null) {
    withinMsg = `Within limit (Min ${minPercent}%).`;
  }

  return {
    symbol,
    actualPercent: roundedActual,
    minPercent,
    maxPercent,
    nominalPercent: nominalPercent ?? null,
    status: "within-spec",
    statusMessage: withinMsg,
    deviation: 0,
    isBalance,
  };
}

/**
 * Evaluates an entire set of chemical composition elements against an alloy's specification list.
 */
export function evaluateAlloySpecification(
  composition: { symbol: string; percent: number }[],
  specifications: SpecLimit[],
  alloyDesignation?: string
): SpecificationEvaluation {
  const results: ElementCheckResult[] = [];
  let conformingCount = 0;
  let nonConformingCount = 0;
  let unspecifiedCount = 0;

  for (const item of composition) {
    const spec = specifications.find(
      (s) => s.elementSymbol.trim().toLowerCase() === item.symbol.trim().toLowerCase()
    );

    const check = checkElementSpecification(item.symbol, item.percent, spec);
    results.push(check);

    if (check.status === "within-spec") {
      conformingCount++;
    } else if (check.status === "below-spec" || check.status === "above-spec") {
      nonConformingCount++;
    } else if (check.status === "not-specified") {
      unspecifiedCount++;
    }
  }

  const isFullyCompliant = nonConformingCount === 0 && conformingCount > 0;
  const hasDeviations = nonConformingCount > 0;

  let summaryMessage = "All evaluated elements satisfy specification boundaries.";
  if (hasDeviations) {
    summaryMessage = `${nonConformingCount} element${nonConformingCount === 1 ? " falls" : "s fall"} outside reference tolerance limits.`;
  } else if (conformingCount === 0 && unspecifiedCount > 0) {
    summaryMessage = "No elements matched reference specification boundaries.";
  }

  return {
    alloyDesignation,
    totalElementsChecked: composition.length,
    conformingElements: conformingCount,
    nonConformingElements: nonConformingCount,
    unspecifiedElements: unspecifiedCount,
    isFullyCompliant,
    hasDeviations,
    results,
    summaryMessage,
  };
}
