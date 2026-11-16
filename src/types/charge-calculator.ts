/**
 * Charge Calculator Domain Types for AlloyCal
 */

export interface MasterAlloyElement {
  symbol: string;
  percent: number;
}

export interface MasterAlloy {
  id: string;
  name: string;
  code: string;
  baseMetalId: string;
  elements: MasterAlloyElement[];
  balanceElement: string;
  balancePercent: number;
  description: string;
  isCustom?: boolean;
}

export interface MaterialAddition {
  materialId: string;
  materialName: string;
  materialCode: string;
  materialType: "base_metal" | "master_alloy" | "pure_element";
  weightGrams: number;
  percentageOfCharge: number;
  compositionSummary: string;
  elementsContributed: { symbol: string; weightGrams: number }[];
}

export interface CalculatedElementResult {
  symbol: string;
  targetPercent: number;
  calculatedPercent: number;
  deviationPercent: number;
  totalWeightGrams: number;
  status: "exact" | "acceptable" | "deviating";
}

export interface ChargeCalculationResult {
  isFeasible: boolean;
  batchWeightGrams: number;
  baseMetalWeightGrams: number;
  additions: MaterialAddition[];
  totalChargeWeightGrams: number;
  elementResults: CalculatedElementResult[];
  massBalanceVerified: boolean;
  massBalanceDifferenceGrams: number;
  warnings: string[];
  assumptions: string[];
  infeasibleReason?: string;
  solverType: "direct" | "linear_system" | "none";
}

export interface MasterAlloySuggestion {
  elementSymbol: string;
  suggestedMasterAlloy: MasterAlloy;
  reason: string;
  targetPercent: number;
  isSelected: boolean;
}
