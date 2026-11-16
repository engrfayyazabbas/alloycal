import { describe, it, expect } from "vitest";
import {
  calculateMeltingCharge,
  suggestMasterAlloys,
  ChargeSolverInput,
} from "../charge-solver";
import { COMMON_MASTER_ALLOYS } from "@/lib/data/master-alloys";

describe("Melting Charge Calculator Engine", () => {
  const alSi50 = COMMON_MASTER_ALLOYS.find((m) => m.id === "al-si50")!;
  const alCu50 = COMMON_MASTER_ALLOYS.find((m) => m.id === "al-cu50")!;
  const alMg50 = COMMON_MASTER_ALLOYS.find((m) => m.id === "al-mg50")!;
  const alCr20 = COMMON_MASTER_ALLOYS.find((m) => m.id === "al-cr20")!;

  it("calculates exact melting recipe for standard Al-Si-Mg alloy with 1000g batch", () => {
    // 1000g batch of Al alloy with 1.0% Mg, 0.6% Si
    // AlMg50 (50% Mg): needs 10g Mg -> 20g AlMg50
    // AlSi50 (50% Si): needs 6g Si -> 12g AlSi50
    // Base Al: 1000 - 20 - 12 = 968g
    const input: ChargeSolverInput = {
      baseMetalSymbol: "Al",
      baseMetalName: "Aluminium",
      baseMetalPurity: 99.7,
      targetSolutes: [
        { symbol: "Mg", percent: 1.0 },
        { symbol: "Si", percent: 0.6 },
      ],
      selectedMasterAlloys: [alMg50, alSi50],
      batchWeightGrams: 1000,
    };

    const result = calculateMeltingCharge(input);

    expect(result.isFeasible).toBe(true);
    expect(result.batchWeightGrams).toBe(1000);
    expect(result.totalChargeWeightGrams).toBe(1000);
    expect(result.massBalanceVerified).toBe(true);

    const alMgAddition = result.additions.find((a) => a.materialCode === "AlMg50");
    const alSiAddition = result.additions.find((a) => a.materialCode === "AlSi50");
    const baseAddition = result.additions.find((a) => a.materialType === "base_metal");

    expect(alMgAddition?.weightGrams).toBeCloseTo(20.0, 1);
    expect(alSiAddition?.weightGrams).toBeCloseTo(12.0, 1);
    expect(baseAddition?.weightGrams).toBeCloseTo(968.0, 1);

    // Verify calculated final composition
    const mgResult = result.elementResults.find((e) => e.symbol === "MG");
    const siResult = result.elementResults.find((e) => e.symbol === "SI");
    expect(mgResult?.calculatedPercent).toBeCloseTo(1.0, 2);
    expect(siResult?.calculatedPercent).toBeCloseTo(0.6, 2);
  });

  it("scales all charge weights proportionally for custom batch sizes (e.g. 5000g)", () => {
    const input: ChargeSolverInput = {
      baseMetalSymbol: "Al",
      baseMetalName: "Aluminium",
      baseMetalPurity: 99.7,
      targetSolutes: [
        { symbol: "Cu", percent: 2.0 }, // 100g Cu in 5000g batch -> 200g AlCu50
      ],
      selectedMasterAlloys: [alCu50],
      batchWeightGrams: 5000,
    };

    const result = calculateMeltingCharge(input);

    expect(result.isFeasible).toBe(true);
    expect(result.batchWeightGrams).toBe(5000);
    expect(result.totalChargeWeightGrams).toBe(5000);

    const cuAddition = result.additions.find((a) => a.materialCode === "AlCu50");
    const baseAddition = result.additions.find((a) => a.materialType === "base_metal");

    expect(cuAddition?.weightGrams).toBeCloseTo(200.0, 1);
    expect(baseAddition?.weightGrams).toBeCloseTo(4800.0, 1);
  });

  it("detects infeasible charge if master alloys exceed total batch weight", () => {
    // Target 60% Si in 1000g batch using AlSi50 (50% Si)
    // 60% Si would require 1200g of AlSi50 for a 1000g batch!
    const input: ChargeSolverInput = {
      baseMetalSymbol: "Al",
      baseMetalName: "Aluminium",
      baseMetalPurity: 99.7,
      targetSolutes: [{ symbol: "Si", percent: 60.0 }],
      selectedMasterAlloys: [alSi50],
      batchWeightGrams: 1000,
    };

    const result = calculateMeltingCharge(input);

    expect(result.isFeasible).toBe(false);
    expect(result.infeasibleReason).toContain("exceed");
  });

  it("suggests appropriate standard master alloys based on target elements", () => {
    const targetSolutes = [
      { symbol: "Si", percent: 7.0 },
      { symbol: "Cu", percent: 3.5 },
      { symbol: "Mg", percent: 0.35 },
    ];

    const suggestions = suggestMasterAlloys("al", targetSolutes);

    expect(suggestions.length).toBe(3);
    expect(suggestions.some((s) => s.suggestedMasterAlloy.code === "AlSi50")).toBe(true);
    expect(suggestions.some((s) => s.suggestedMasterAlloy.code === "AlCu50")).toBe(true);
    expect(
      suggestions.some(
        (s) =>
          s.suggestedMasterAlloy.code === "AlMg50" ||
          s.suggestedMasterAlloy.code === "Pure-Mg"
      )
    ).toBe(true);
  });
});
