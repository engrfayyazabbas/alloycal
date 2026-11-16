/**
 * Metallurgy Domain Types for AlloyCal
 */

export interface BaseMetal {
  id: string;
  symbol: string;
  name: string;
  standardPurity: number; // e.g., 99.7% for technical pure Al
  densityGPerCm3?: number;
  meltingPointCelsius?: number;
  description: string;
}

export interface ChemicalElement {
  symbol: string;
  name: string;
  atomicNumber: number;
  atomicWeight: number;
  category?: string;
  educationalRole?: string;
}

export interface SpecificationRange {
  id: string;
  alloyId: string;
  elementSymbol: string;
  minPercent: number | null;
  maxPercent: number | null;
  nominalPercent: number | null;
  isBalance: boolean;
  educationalImpact?: string;
}

export type AlloyType = 'standard' | 'master';

export interface Alloy {
  id: string;
  baseMetalId: string;
  designation: string; // e.g. "6061", "C36000", "AlSr10"
  commonName: string;
  alloyType: AlloyType;
  balanceElement: string;
  educationalNotes: string;
  densityGPerCm3?: number;
  specifications: SpecificationRange[];
}

export interface CompositionEntry {
  id: string;
  elementSymbol: string;
  percent: number;
}

export interface SpecCheckComparison {
  elementSymbol: string;
  actualPercent: number;
  minPercent: number | null;
  maxPercent: number | null;
  status: 'within-spec' | 'below-spec' | 'above-spec' | 'unspecified';
}

export interface CompositionAnalysis {
  isValid: boolean;
  totalNonBalance: number;
  balancePercent: number;
  balanceElement: string;
  comparisons?: SpecCheckComparison[];
  notes: string[];
}
