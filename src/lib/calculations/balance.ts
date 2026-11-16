/**
 * Balance Element Calculation Module
 *
 * Implements mass balance calculation for metallurgical systems:
 * Balance element (wt.%) = 100 - Sum of all other solutes (wt.%)
 */

export interface ElementInput {
  symbol: string;
  percent: number;
}

export interface BalanceCalculationResult {
  balanceElement: string;
  totalSolutes: number;
  balancePercent: number;
  rawBalancePercent: number;
  isValid: boolean;
  isExact100: boolean;
  isNegative: boolean;
  isExceeded: boolean;
  errorMessage?: string;
}

/**
 * Standard metallurgical numerical tolerance to prevent floating-point artifacts.
 * e.g., 0.1 + 0.2 = 0.30000000000000004 in IEEE-754.
 */
export const METALLURGY_EPSILON = 1e-5;

/**
 * Robust rounder to fixed decimal places that avoids floating-point representations.
 */
export function roundToPrecision(val: number, decimals: number = 4): number {
  if (!Number.isFinite(val)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round((val + Number.EPSILON) * factor) / factor;
}

/**
 * Calculate the balance element percentage from an array of solute elements.
 *
 * @param solutes - Array of elements and their mass percentages
 * @param balanceElementSymbol - The chemical symbol of the matrix solvent element (e.g., 'Al', 'Cu')
 * @returns BalanceCalculationResult with validated numbers and flags
 */
export function calculateBalance(
  solutes: ElementInput[],
  balanceElementSymbol: string
): BalanceCalculationResult {
  const cleanBalanceSymbol = (balanceElementSymbol || "").trim();

  // Filter out any solute entry that matches the balance element to prevent double-counting
  const validSolutes = solutes.filter((s) => {
    if (!s || typeof s.symbol !== "string") return false;
    const isBalance = s.symbol.trim().toLowerCase() === cleanBalanceSymbol.toLowerCase();
    return !isBalance;
  });

  // Sum solute percentages with safety guards against non-numeric or negative values
  let soluteSum = 0;
  for (const item of validSolutes) {
    const val = Number(item.percent);
    if (Number.isFinite(val) && val > 0) {
      soluteSum += val;
    }
  }

  // Calculate raw and stabilized balance values
  const roundedSoluteSum = roundToPrecision(soluteSum, 4);
  const rawBalance = 100 - roundedSoluteSum;
  const roundedBalance = roundToPrecision(rawBalance, 4);

  const isExact100 = Math.abs(roundedSoluteSum - 100) < METALLURGY_EPSILON;
  const isNegative = roundedBalance < -METALLURGY_EPSILON;
  const isExceeded = roundedSoluteSum > 100 + METALLURGY_EPSILON;

  let errorMessage: string | undefined;
  if (isExceeded) {
    errorMessage = `The entered alloying elements total ${roundedSoluteSum.toFixed(2)}%, exceeding 100%. Review the composition values.`;
  } else if (isNegative) {
    errorMessage = "The entered alloying elements leave no valid balance for the selected base element.";
  }

  return {
    balanceElement: cleanBalanceSymbol,
    totalSolutes: roundedSoluteSum,
    balancePercent: Math.max(0, roundedBalance),
    rawBalancePercent: roundedBalance,
    isValid: !isExceeded && !isNegative,
    isExact100,
    isNegative,
    isExceeded,
    errorMessage,
  };
}
