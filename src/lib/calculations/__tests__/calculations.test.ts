import { describe, it, expect } from "vitest";
import {
  calculateBalance,
  roundToPrecision,
  METALLURGY_EPSILON,
} from "../balance";
import {
  checkElementSpecification,
  evaluateAlloySpecification,
  type SpecLimit,
} from "../spec-checker";
import {
  validateComposition,
  ROUNDING_TOLERANCE_PERCENT,
} from "../composition-validator";

describe("Balance-Element Calculation Module", () => {
  it("calculates normal decimal solute additions accurately", () => {
    // Al-Si-Mg typical: Si = 10.0%, Mg = 0.5%, Cu = 1.0% -> Al = 88.50%
    const solutes = [
      { symbol: "Si", percent: 10.0 },
      { symbol: "Mg", percent: 0.5 },
      { symbol: "Cu", percent: 1.0 },
    ];
    const result = calculateBalance(solutes, "Al");

    expect(result.isValid).toBe(true);
    expect(result.totalSolutes).toBe(11.5);
    expect(result.balancePercent).toBe(88.5);
    expect(result.isNegative).toBe(false);
    expect(result.isExceeded).toBe(false);
  });

  it("handles IEEE-754 floating-point edge cases without precision artifacts", () => {
    // 0.1 + 0.2 normally equals 0.30000000000000004 in raw JS
    const solutes = [
      { symbol: "Fe", percent: 0.1 },
      { symbol: "Mn", percent: 0.2 },
    ];
    const result = calculateBalance(solutes, "Al");

    expect(result.totalSolutes).toBe(0.3);
    expect(result.balancePercent).toBe(99.7);
  });

  it("handles zero-percent additions without distortion", () => {
    const solutes = [
      { symbol: "Si", percent: 0.0 },
      { symbol: "Cu", percent: 2.5 },
    ];
    const result = calculateBalance(solutes, "Al");

    expect(result.totalSolutes).toBe(2.5);
    expect(result.balancePercent).toBe(97.5);
  });

  it("handles exactly 100% total composition correctly", () => {
    const solutes = [
      { symbol: "Zn", percent: 60.0 },
      { symbol: "Sn", percent: 40.0 },
    ];
    const result = calculateBalance(solutes, "Cu");

    expect(result.isValid).toBe(true);
    expect(result.totalSolutes).toBe(100.0);
    expect(result.balancePercent).toBe(0.0);
    expect(result.isExact100).toBe(true);
    expect(result.isNegative).toBe(false);
  });

  it("rejects negative balance and reports informative error when sum > 100%", () => {
    const solutes = [
      { symbol: "Cu", percent: 70.0 },
      { symbol: "Zn", percent: 35.0 },
    ];
    const result = calculateBalance(solutes, "Al");

    expect(result.isValid).toBe(false);
    expect(result.isExceeded).toBe(true);
    expect(result.isNegative).toBe(true);
    expect(result.balancePercent).toBe(0.0);
    expect(result.rawBalancePercent).toBe(-5.0);
    expect(result.errorMessage).toContain("exceeding 100%");
  });

  it("handles empty solute list cleanly, defaulting balance to 100%", () => {
    const result = calculateBalance([], "Fe");

    expect(result.isValid).toBe(true);
    expect(result.totalSolutes).toBe(0);
    expect(result.balancePercent).toBe(100);
  });

  it("does not count the balance element twice if present in solute list", () => {
    const solutes = [
      { symbol: "Al", percent: 90.0 }, // Balance element accidentally included
      { symbol: "Mg", percent: 1.0 },
      { symbol: "Si", percent: 0.6 },
    ];
    const result = calculateBalance(solutes, "Al");

    expect(result.totalSolutes).toBe(1.6);
    expect(result.balancePercent).toBe(98.4);
  });
});

describe("Composition Validation Module", () => {
  it("validates a sound alloy composition", () => {
    const elements = [
      { symbol: "Mg", percent: 1.0 },
      { symbol: "Si", percent: 0.6 },
    ];
    const report = validateComposition(elements, "Al");

    expect(report.isValid).toBe(true);
    expect(report.status).toBe("valid");
    expect(report.hasErrors).toBe(false);
    expect(report.totalPercentage).toBe(1.6);
    expect(report.balancePercentage).toBe(98.4);
  });

  it("detects and rejects duplicate elements", () => {
    const elements = [
      { symbol: "Cu", percent: 1.5 },
      { symbol: "cu", percent: 2.0 }, // duplicate case-insensitive
    ];
    const report = validateComposition(elements, "Al");

    expect(report.isValid).toBe(false);
    expect(report.hasDuplicates).toBe(true);
    expect(report.issues.some((i) => i.code === "DUPLICATE_ELEMENT")).toBe(true);
  });

  it("rejects negative percentages", () => {
    const elements = [{ symbol: "Mg", percent: -0.5 }];
    const report = validateComposition(elements, "Al");

    expect(report.isValid).toBe(false);
    expect(report.issues.some((i) => i.code === "NEGATIVE_VALUE")).toBe(true);
  });

  it("rejects percentages exceeding 100%", () => {
    const elements = [{ symbol: "Mg", percent: 105.0 }];
    const report = validateComposition(elements, "Al");

    expect(report.isValid).toBe(false);
    expect(report.issues.some((i) => i.code === "EXCEEDS_100_PERCENT")).toBe(true);
  });

  it("detects non-numeric values", () => {
    const elements = [{ symbol: "Mg", percent: "invalid-number" }];
    const report = validateComposition(elements, "Al");

    expect(report.isValid).toBe(false);
    expect(report.issues.some((i) => i.code === "NON_NUMERIC")).toBe(true);
  });

  it("flags empty values as incomplete", () => {
    const elements = [{ symbol: "Mg", percent: "" }];
    const report = validateComposition(elements, "Al");

    expect(report.status).toBe("incomplete");
    expect(report.issues.some((i) => i.code === "EMPTY_VALUE")).toBe(true);
  });

  it("distinguishes rounding differences when no balance element is designated", () => {
    // 99.98% total (within 0.05% tolerance)
    const elements = [
      { symbol: "Cu", percent: 70.0 },
      { symbol: "Zn", percent: 29.98 },
    ];
    const report = validateComposition(elements, null);

    expect(report.status).toBe("rounding_difference");
    expect(report.hasWarnings).toBe(true);
    expect(report.issues.some((i) => i.code === "ROUNDING_DIFFERENCE")).toBe(true);
  });

  it("flags severe deficiency when no balance element is designated and sum < 99.95%", () => {
    const elements = [
      { symbol: "Cu", percent: 70.0 },
      { symbol: "Zn", percent: 20.0 }, // total = 90%
    ];
    const report = validateComposition(elements, null);

    expect(report.isValid).toBe(false);
    expect(report.issues.some((i) => i.code === "SUM_BELOW_100_NO_BALANCE")).toBe(true);
  });
});

describe("Specification Range Checker Module", () => {
  const mockSpecs: SpecLimit[] = [
    {
      elementSymbol: "Mg",
      minPercent: 0.8,
      maxPercent: 1.2,
      nominalPercent: 1.0,
    },
    {
      elementSymbol: "Si",
      minPercent: 0.4,
      maxPercent: 0.8,
      nominalPercent: 0.6,
    },
    {
      elementSymbol: "Fe",
      minPercent: null, // No minimum, only maximum limit
      maxPercent: 0.7,
      nominalPercent: 0.35,
    },
    {
      elementSymbol: "Ti",
      minPercent: 0.05,
      maxPercent: null, // Minimum required, no upper limit
      nominalPercent: 0.1,
    },
  ];

  it("identifies an element within spec limits", () => {
    const result = checkElementSpecification("Mg", 1.0, mockSpecs[0]);

    expect(result.status).toBe("within-spec");
    expect(result.deviation).toBe(0);
  });

  it("identifies element below minimum boundary", () => {
    const result = checkElementSpecification("Mg", 0.6, mockSpecs[0]);

    expect(result.status).toBe("below-spec");
    expect(result.deviation).toBe(-0.2);
    expect(result.statusMessage).toContain("Below minimum");
  });

  it("identifies element above maximum boundary", () => {
    const result = checkElementSpecification("Mg", 1.4, mockSpecs[0]);

    expect(result.status).toBe("above-spec");
    expect(result.deviation).toBe(0.2);
    expect(result.statusMessage).toContain("Exceeds maximum");
  });

  it("handles exact boundary values correctly (inclusive min and max)", () => {
    const atMin = checkElementSpecification("Mg", 0.8, mockSpecs[0]);
    const atMax = checkElementSpecification("Mg", 1.2, mockSpecs[0]);

    expect(atMin.status).toBe("within-spec");
    expect(atMax.status).toBe("within-spec");
  });

  it("correctly evaluates element with missing minimum (null)", () => {
    // Fe has min = null, max = 0.7
    const zeroFe = checkElementSpecification("Fe", 0.0, mockSpecs[2]);
    const normalFe = checkElementSpecification("Fe", 0.35, mockSpecs[2]);
    const excessFe = checkElementSpecification("Fe", 0.85, mockSpecs[2]);

    expect(zeroFe.status).toBe("within-spec");
    expect(normalFe.status).toBe("within-spec");
    expect(excessFe.status).toBe("above-spec");
  });

  it("correctly evaluates element with missing maximum (null)", () => {
    // Ti has min = 0.05, max = null
    const deficientTi = checkElementSpecification("Ti", 0.02, mockSpecs[3]);
    const normalTi = checkElementSpecification("Ti", 0.2, mockSpecs[3]);

    expect(deficientTi.status).toBe("below-spec");
    expect(normalTi.status).toBe("within-spec");
  });

  it("marks unlisted element as not-specified", () => {
    const result = checkElementSpecification("Pb", 0.05, undefined);

    expect(result.status).toBe("not-specified");
    expect(result.statusMessage).toContain("Not constrained");
  });

  it("evaluates a full alloy composition set and summarizes compliance", () => {
    const composition = [
      { symbol: "Mg", percent: 1.0 }, // within
      { symbol: "Si", percent: 0.6 }, // within
      { symbol: "Fe", percent: 0.9 }, // above max (0.7)
      { symbol: "Zr", percent: 0.05 }, // not specified
    ];

    const evaluation = evaluateAlloySpecification(composition, mockSpecs, "6061");

    expect(evaluation.totalElementsChecked).toBe(4);
    expect(evaluation.conformingElements).toBe(2);
    expect(evaluation.nonConformingElements).toBe(1);
    expect(evaluation.unspecifiedElements).toBe(1);
    expect(evaluation.isFullyCompliant).toBe(false);
    expect(evaluation.hasDeviations).toBe(true);
    expect(evaluation.summaryMessage).toContain("1 element falls outside");
  });
});
