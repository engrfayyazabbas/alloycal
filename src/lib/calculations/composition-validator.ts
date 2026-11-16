/**
 * Composition Validation Module
 *
 * Implements rigorous numerical and chemical consistency checks.
 */

import { METALLURGY_EPSILON, roundToPrecision } from "./balance";

export type ValidationStatus = "valid" | "incomplete" | "invalid" | "rounding_difference";

export interface ValidationIssue {
  code:
    | "EMPTY_SYMBOL"
    | "EMPTY_VALUE"
    | "NON_NUMERIC"
    | "NEGATIVE_VALUE"
    | "EXCEEDS_100_PERCENT"
    | "DUPLICATE_ELEMENT"
    | "MISSING_BALANCE"
    | "SUM_EXCEEDS_100"
    | "SUM_BELOW_100_NO_BALANCE"
    | "ROUNDING_DIFFERENCE";
  message: string;
  field?: string;
  severity: "error" | "warning";
}

export interface CompositionValidationResult {
  status: ValidationStatus;
  isValid: boolean;
  issues: ValidationIssue[];
  totalPercentage: number;
  balancePercentage: number;
  hasDuplicates: boolean;
  hasErrors: boolean;
  hasWarnings: boolean;
}

export const ROUNDING_TOLERANCE_PERCENT = 0.05; // 500 ppm tolerance window

/**
 * Validates an array of chemical composition entries.
 *
 * @param elements - The list of entered solute rows
 * @param balanceElement - The designated balance element symbol, or null if direct assay mode
 */
export function validateComposition(
  elements: { symbol: string; percent: unknown; id?: string }[],
  balanceElement?: string | null
): CompositionValidationResult {
  const issues: ValidationIssue[] = [];
  const seenSymbols = new Set<string>();
  let hasDuplicates = false;
  let totalEntered = 0;

  // 1. Check for empty elements collection
  if (!elements || elements.length === 0) {
    issues.push({
      code: "EMPTY_VALUE",
      message: "No chemical elements entered in composition.",
      severity: "warning",
    });
    return {
      status: "incomplete",
      isValid: false,
      issues,
      totalPercentage: 0,
      balancePercentage: 100,
      hasDuplicates: false,
      hasErrors: false,
      hasWarnings: true,
    };
  }

  // 2. Validate individual element entries
  for (let i = 0; i < elements.length; i++) {
    const entry = elements[i];
    const rowField = entry.id || `row-${i}`;

    // Validate chemical symbol
    if (!entry.symbol || typeof entry.symbol !== "string" || entry.symbol.trim() === "") {
      issues.push({
        code: "EMPTY_SYMBOL",
        message: `Element at position ${i + 1} has an empty chemical symbol.`,
        field: rowField,
        severity: "error",
      });
      continue;
    }

    const cleanSymbol = entry.symbol.trim().toUpperCase();

    // Check duplicate symbol
    if (seenSymbols.has(cleanSymbol)) {
      hasDuplicates = true;
      issues.push({
        code: "DUPLICATE_ELEMENT",
        message: `Duplicate element '${entry.symbol}' detected. Each element must appear only once.`,
        field: rowField,
        severity: "error",
      });
    } else {
      seenSymbols.add(cleanSymbol);
    }

    // Validate percentage value
    if (entry.percent === null || entry.percent === undefined || entry.percent === "") {
      issues.push({
        code: "EMPTY_VALUE",
        message: `Percentage for '${entry.symbol}' is empty.`,
        field: rowField,
        severity: "warning",
      });
      continue;
    }

    const num = Number(entry.percent);

    if (isNaN(num) || !Number.isFinite(num)) {
      issues.push({
        code: "NON_NUMERIC",
        message: `Invalid non-numeric value for element '${entry.symbol}'.`,
        field: rowField,
        severity: "error",
      });
      continue;
    }

    if (num < 0) {
      issues.push({
        code: "NEGATIVE_VALUE",
        message: `Percentage for element '${entry.symbol}' cannot be negative (${num}%).`,
        field: rowField,
        severity: "error",
      });
      continue;
    }

    if (num > 100) {
      issues.push({
        code: "EXCEEDS_100_PERCENT",
        message: `Percentage for element '${entry.symbol}' cannot exceed 100% (${num}%).`,
        field: rowField,
        severity: "error",
      });
      continue;
    }

    totalEntered += num;
  }

  const roundedTotal = roundToPrecision(totalEntered, 4);

  // 3. Balance & Totality Validation
  const hasDesignatedBalance = Boolean(balanceElement && balanceElement.trim() !== "");
  let calculatedBalance = 0;

  if (hasDesignatedBalance) {
    calculatedBalance = roundToPrecision(100 - roundedTotal, 4);

    if (roundedTotal > 100 + METALLURGY_EPSILON) {
      issues.push({
        code: "SUM_EXCEEDS_100",
        message: `The entered alloying elements total ${roundedTotal.toFixed(2)}%, exceeding 100%. Review the composition values.`,
        severity: "error",
      });
    }
  } else {
    // If no balance element is designated, all elements must sum to 100%
    const difference = Math.abs(roundedTotal - 100);

    if (difference > METALLURGY_EPSILON) {
      if (difference <= ROUNDING_TOLERANCE_PERCENT) {
        issues.push({
          code: "ROUNDING_DIFFERENCE",
          message: `Composition total is ${roundedTotal.toFixed(2)}% (slight rounding difference of ${difference.toFixed(3)}%).`,
          severity: "warning",
        });
      } else if (roundedTotal > 100) {
        issues.push({
          code: "SUM_EXCEEDS_100",
          message: `Composition total of ${roundedTotal.toFixed(2)}% exceeds 100% without a designated balance element.`,
          severity: "error",
        });
      } else {
        issues.push({
          code: "SUM_BELOW_100_NO_BALANCE",
          message: `Composition total is only ${roundedTotal.toFixed(2)}% (100% required when no balance element is chosen).`,
          severity: "error",
        });
      }
    }
  }

  const hasErrors = issues.some((i) => i.severity === "error");
  const hasWarnings = issues.some((i) => i.severity === "warning");

  let status: ValidationStatus = "valid";
  if (hasErrors) {
    status = "invalid";
  } else if (issues.some((i) => i.code === "ROUNDING_DIFFERENCE")) {
    status = "rounding_difference";
  } else if (issues.some((i) => i.code === "EMPTY_VALUE")) {
    status = "incomplete";
  }

  return {
    status,
    isValid: !hasErrors && status !== "incomplete",
    issues,
    totalPercentage: roundedTotal,
    balancePercentage: hasDesignatedBalance ? Math.max(0, calculatedBalance) : 0,
    hasDuplicates,
    hasErrors,
    hasWarnings,
  };
}
