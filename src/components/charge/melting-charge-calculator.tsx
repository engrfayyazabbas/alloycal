"use client";

import { useState, useMemo } from "react";
import { BASE_METALS, REFERENCE_ALLOYS, COMMON_ELEMENTS } from "@/lib/data/reference-alloys";
import { COMMON_MASTER_ALLOYS } from "@/lib/data/master-alloys";
import {
  calculateMeltingCharge,
  suggestMasterAlloys,
  calculateBalance,
} from "@/lib/calculations";
import { MasterAlloy, ChargeCalculationResult } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EducationalCallout } from "@/components/educational/educational-callout";
import {
  Flame,
  Plus,
  Trash2,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Sliders,
  Layers,
  Info,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface SoluteRow {
  id: string;
  symbol: string;
  rawPercent: string;
}

export function MeltingChargeCalculator() {
  // Step A: Base Metal & Purity
  const [selectedMetalId, setSelectedMetalId] = useState<string>("al");
  const [basePurity, setBasePurity] = useState<string>("99.70");

  // Step B: Target Composition
  const [targetPresetId, setTargetPresetId] = useState<string>("al-6061");
  const [soluteRows, setSoluteRows] = useState<SoluteRow[]>([
    { id: "row-1", symbol: "Mg", rawPercent: "1.00" },
    { id: "row-2", symbol: "Si", rawPercent: "0.60" },
    { id: "row-3", symbol: "Cu", rawPercent: "0.28" },
    { id: "row-4", symbol: "Cr", rawPercent: "0.20" },
    { id: "row-5", symbol: "Fe", rawPercent: "0.35" },
  ]);
  const [newSoluteSymbol, setNewSoluteSymbol] = useState<string>("Mn");

  // Step C: Master Alloys Selection
  const [masterAlloyMode, setMasterAlloyMode] = useState<"auto" | "manual">("auto");
  const [masterAlloysDatabase, setMasterAlloysDatabase] = useState<MasterAlloy[]>(COMMON_MASTER_ALLOYS);
  const [selectedMasterAlloyIds, setSelectedMasterAlloyIds] = useState<string[]>([
    "al-si50",
    "al-cu50",
    "al-mg50",
    "al-cr20",
    "al-fe20",
  ]);

  // Step D: Batch Weight
  const [batchWeightGrams, setBatchWeightGrams] = useState<number>(1000);
  const [customWeightInput, setCustomWeightInput] = useState<string>("1000");

  // Advanced toggles
  const [showMasterAlloyEditor, setShowMasterAlloyEditor] = useState<boolean>(false);
  const [newCustomName, setNewCustomName] = useState<string>("");
  const [newCustomCode, setNewCustomCode] = useState<string>("");
  const [newCustomElement, setNewCustomElement] = useState<string>("Si");
  const [newCustomPercent, setNewCustomPercent] = useState<string>("50");

  const baseMetal = useMemo(
    () => BASE_METALS.find((m) => m.id === selectedMetalId) || BASE_METALS[0],
    [selectedMetalId]
  );

  const availableReferenceAlloys = useMemo(
    () => REFERENCE_ALLOYS.filter((a) => a.baseMetalId === selectedMetalId),
    [selectedMetalId]
  );

  const availableMasterAlloys = useMemo(
    () => masterAlloysDatabase.filter((m) => m.baseMetalId === selectedMetalId),
    [masterAlloysDatabase, selectedMetalId]
  );

  // Parse numerical target solutes
  const parsedTargetSolutes = useMemo(() => {
    return soluteRows
      .map((r) => {
        const num = parseFloat(r.rawPercent);
        return {
          symbol: r.symbol,
          percent: isNaN(num) ? 0 : Math.max(0, num),
        };
      })
      .filter((s) => s.symbol.toUpperCase() !== baseMetal.symbol.toUpperCase());
  }, [soluteRows, baseMetal.symbol]);

  // Matrix balance calculation for target
  const balanceInfo = useMemo(() => {
    return calculateBalance(parsedTargetSolutes, baseMetal.symbol);
  }, [parsedTargetSolutes, baseMetal.symbol]);

  // Automatic suggestions
  const suggestions = useMemo(() => {
    return suggestMasterAlloys(selectedMetalId, parsedTargetSolutes, masterAlloysDatabase);
  }, [selectedMetalId, parsedTargetSolutes, masterAlloysDatabase]);

  // Selected master alloy objects
  const activeMasterAlloys = useMemo(() => {
    return masterAlloysDatabase.filter((m) =>
      selectedMasterAlloyIds.includes(m.id)
    );
  }, [masterAlloysDatabase, selectedMasterAlloyIds]);

  // Run the Melting Charge Solver
  const calculationResult: ChargeCalculationResult = useMemo(() => {
    const purityNum = parseFloat(basePurity);
    const validPurity = isNaN(purityNum) ? 99.7 : Math.min(100, Math.max(80, purityNum));

    return calculateMeltingCharge({
      baseMetalSymbol: baseMetal.symbol,
      baseMetalName: baseMetal.name,
      baseMetalPurity: validPurity,
      targetSolutes: parsedTargetSolutes,
      selectedMasterAlloys: activeMasterAlloys,
      batchWeightGrams: batchWeightGrams,
    });
  }, [baseMetal, basePurity, parsedTargetSolutes, activeMasterAlloys, batchWeightGrams]);

  // Apply automatic suggestions
  const handleApplySuggestions = () => {
    const suggestedIds = suggestions.map((s) => s.suggestedMasterAlloy.id);
    setSelectedMasterAlloyIds(suggestedIds);
  };

  // Base metal switch
  const handleBaseMetalChange = (metalId: string) => {
    setSelectedMetalId(metalId);
    const metal = BASE_METALS.find((m) => m.id === metalId);
    if (metal) {
      setBasePurity(metal.standardPurity.toFixed(2));
    }

    const availableAlloys = REFERENCE_ALLOYS.filter((a) => a.baseMetalId === metalId);
    if (availableAlloys.length > 0) {
      handleTargetPresetChange(availableAlloys[0].id);
    } else {
      setTargetPresetId("custom");
      setSoluteRows([]);
      setSelectedMasterAlloyIds([]);
    }
  };

  // Preset switch
  const handleTargetPresetChange = (presetId: string) => {
    setTargetPresetId(presetId);
    if (presetId === "custom") {
      setSoluteRows([
        { id: "c-1", symbol: "Cu", rawPercent: "2.00" },
        { id: "c-2", symbol: "Zn", rawPercent: "1.50" },
      ]);
      return;
    }

    const alloy = REFERENCE_ALLOYS.find((a) => a.id === presetId);
    if (alloy) {
      const rows = alloy.specifications
        .filter((s) => !s.isBalance)
        .map((s, index) => ({
          id: `preset-${s.id}-${index}`,
          symbol: s.elementSymbol,
          rawPercent: (s.nominalPercent ?? s.minPercent ?? 0.5).toFixed(2),
        }));
      setSoluteRows(rows);

      // Auto-populate relevant master alloys for standard presets
      const suggested = suggestMasterAlloys(
        alloy.baseMetalId,
        rows.map((r) => ({ symbol: r.symbol, percent: parseFloat(r.rawPercent) || 0 })),
        masterAlloysDatabase
      );
      setSelectedMasterAlloyIds(suggested.map((s) => s.suggestedMasterAlloy.id));
    }
  };

  // Solute table controls
  const handlePercentChange = (id: string, val: string) => {
    setSoluteRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, rawPercent: val } : r))
    );
  };

  const handleRemoveSolute = (id: string) => {
    setSoluteRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleAddSolute = () => {
    if (!newSoluteSymbol) return;
    const exists = soluteRows.some(
      (r) => r.symbol.toUpperCase() === newSoluteSymbol.toUpperCase()
    );
    if (exists || newSoluteSymbol.toUpperCase() === baseMetal.symbol.toUpperCase()) {
      return;
    }

    setSoluteRows((prev) => [
      ...prev,
      {
        id: `solute-${Date.now()}`,
        symbol: newSoluteSymbol,
        rawPercent: "0.20",
      },
    ]);
  };

  // Master alloy manual checkbox toggle
  const handleToggleMasterAlloy = (id: string) => {
    setSelectedMasterAlloyIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Batch weight preset handlers
  const handleBatchPreset = (grams: number) => {
    setBatchWeightGrams(grams);
    setCustomWeightInput(grams.toString());
  };

  const handleCustomWeightChange = (val: string) => {
    setCustomWeightInput(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      setBatchWeightGrams(num);
    }
  };

  // Add custom master alloy
  const handleAddCustomMasterAlloy = () => {
    if (!newCustomName || !newCustomCode || !newCustomElement) return;
    const pct = parseFloat(newCustomPercent) || 50;

    const newAlloy: MasterAlloy = {
      id: `custom-${Date.now()}`,
      name: newCustomName,
      code: newCustomCode,
      baseMetalId: selectedMetalId,
      balanceElement: baseMetal.symbol,
      balancePercent: Math.max(0, 100 - pct),
      elements: [{ symbol: newCustomElement, percent: pct }],
      description: "User-defined custom master alloy.",
      isCustom: true,
    };

    setMasterAlloysDatabase((prev) => [...prev, newAlloy]);
    setSelectedMasterAlloyIds((prev) => [...prev, newAlloy.id]);
    setNewCustomName("");
    setNewCustomCode("");
  };

  // Reset to default
  const handleReset = () => {
    handleTargetPresetChange(targetPresetId);
    setBatchWeightGrams(1000);
    setCustomWeightInput("1000");
  };

  // Available elements to add
  const availableElementsToAdd = useMemo(() => {
    return COMMON_ELEMENTS.filter(
      (el) =>
        el.symbol.toUpperCase() !== baseMetal.symbol.toUpperCase() &&
        !soluteRows.some((r) => r.symbol.toUpperCase() === el.symbol.toUpperCase())
    );
  }, [baseMetal.symbol, soluteRows]);

  return (
    <div className="space-y-8">
      {/* SECTION A: Base Metal Selection & Reference Purity */}
      <section className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-5 items-center justify-center rounded-full bg-primary text-white text-[11px] font-bold">
                1
              </span>
              <h2 className="text-sm font-semibold text-slate-900">
                Base Metal Selection & Purity
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Select the primary host metal and specify its commercial or laboratory assay purity.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="text-xs text-slate-600 h-8 self-start sm:self-auto"
          >
            <RotateCcw className="size-3.5 mr-1" />
            Reset Calculator
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Base Metal Picker */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Primary Solvent Metal
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {BASE_METALS.map((metal) => {
                const isSelected = selectedMetalId === metal.id;
                return (
                  <button
                    key={metal.id}
                    type="button"
                    onClick={() => handleBaseMetalChange(metal.id)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-md border text-center transition-all ${
                      isSelected
                        ? "bg-blue-50/80 border-primary shadow-xs ring-1 ring-primary/40 text-primary font-semibold"
                        : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span className="font-mono font-bold text-lg">{metal.symbol}</span>
                    <span className="text-[11px] text-slate-600 truncate w-full">{metal.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Purity Input */}
          <div className="bg-slate-50 border border-slate-200 rounded-md p-3 space-y-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Base Metal Purity (wt.%)
            </label>
            <div className="relative flex items-center">
              <Input
                type="number"
                step="0.01"
                min="80"
                max="100"
                value={basePurity}
                onChange={(e) => setBasePurity(e.target.value)}
                className="h-8 text-xs font-mono font-semibold pr-7 bg-white"
              />
              <span className="absolute right-2.5 text-slate-400 font-mono text-xs pointer-events-none">
                %
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Standard commercial purity: <strong>&ge;{baseMetal.standardPurity}%</strong>. Remaining fraction represents natural trace elements.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION B: Target Composition Input */}
      <section className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-5 items-center justify-center rounded-full bg-primary text-white text-[11px] font-bold">
                2
              </span>
              <h2 className="text-sm font-semibold text-slate-900">
                Target Alloy Composition
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Specify required chemical concentration (weight %) for each alloying element.
            </p>
          </div>

          {/* Preset Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium shrink-0">Specification:</span>
            <select
              value={targetPresetId}
              onChange={(e) => handleTargetPresetChange(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 shadow-xs focus:border-primary focus:outline-none"
              aria-label="Target specification preset"
            >
              {availableReferenceAlloys.map((alloy) => (
                <option key={alloy.id} value={alloy.id}>
                  {alloy.commonName}
                </option>
              ))}
              <option value="custom">Custom Recipe</option>
            </select>
          </div>
        </div>

        {/* Dynamic Solute Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-md">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-2 px-4 w-32">Element</th>
                <th className="py-2 px-4 w-40">Target wt.%</th>
                <th className="py-2 px-4">Role / Purpose</th>
                <th className="py-2 px-3 text-right w-16">Remove</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {soluteRows.map((row) => {
                const elInfo = COMMON_ELEMENTS.find((e) => e.symbol === row.symbol);
                return (
                  <tr key={row.id} className="hover:bg-slate-50/50">
                    <td className="py-2 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {row.symbol}
                        </span>
                        <span className="text-slate-500 text-[11px] hidden sm:inline">
                          {elInfo?.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-4">
                      <div className="relative flex items-center max-w-[120px]">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={row.rawPercent}
                          onChange={(e) => handlePercentChange(row.id, e.target.value)}
                          className="h-8 text-xs font-mono pr-6"
                        />
                        <span className="absolute right-2 text-slate-400 font-mono text-xs pointer-events-none">
                          %
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-4 text-slate-600 text-[11px]">
                      {elInfo?.educationalRole || "Alloying addition"}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveSolute(row.id)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                        title={`Remove ${row.symbol}`}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {/* Automatic Calculated Balance Row */}
              <tr className="bg-blue-50/50 font-medium border-t-2 border-slate-200">
                <td className="py-2.5 px-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-primary bg-blue-100/80 px-2 py-0.5 rounded border border-blue-200">
                      {baseMetal.symbol}
                    </span>
                    <span className="text-slate-800 text-xs font-semibold">
                      {baseMetal.name} (Calculated Matrix Balance)
                    </span>
                  </div>
                </td>
                <td className="py-2.5 px-4 font-mono font-bold text-sm text-primary">
                  {balanceInfo.isExceeded ? (
                    <span className="text-red-600">0.00%</span>
                  ) : (
                    `${balanceInfo.balancePercent.toFixed(2)}%`
                  )}
                </td>
                <td className="py-2.5 px-4 text-slate-600 text-[11px]" colSpan={2}>
                  {balanceInfo.isExceeded ? (
                    <span className="text-red-600 font-semibold inline-flex items-center gap-1">
                      <AlertTriangle className="size-3" />
                      Solutes exceed 100%!
                    </span>
                  ) : (
                    <span>Mass conservation balance element</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Add Element Bar */}
        {availableElementsToAdd.length > 0 && (
          <div className="flex items-center gap-2 pt-1">
            <select
              value={newSoluteSymbol}
              onChange={(e) => setNewSoluteSymbol(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 shadow-xs focus:border-primary focus:outline-none"
              aria-label="Add solute element"
            >
              {availableElementsToAdd.map((el) => (
                <option key={el.symbol} value={el.symbol}>
                  {el.symbol} — {el.name}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddSolute}
              className="text-xs h-7.5"
            >
              <Plus className="size-3.5 mr-1" />
              Add Element
            </Button>
          </div>
        )}
      </section>

      {/* SECTION C: Master Alloy Selection */}
      <section className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-5 items-center justify-center rounded-full bg-primary text-white text-[11px] font-bold">
                3
              </span>
              <h2 className="text-sm font-semibold text-slate-900">
                Master Alloy Selection
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose concentrated master alloys and pure elements used to introduce alloying elements into the melt.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setMasterAlloyMode("auto")}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                masterAlloyMode === "auto"
                  ? "bg-white text-primary shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sparkles className="size-3.5 inline mr-1" />
              Automatic Suggestion
            </button>
            <button
              type="button"
              onClick={() => setMasterAlloyMode("manual")}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                masterAlloyMode === "manual"
                  ? "bg-white text-primary shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sliders className="size-3.5 inline mr-1" />
              Manual Selection
            </button>
          </div>
        </div>

        {/* Automatic Suggestion Mode */}
        {masterAlloyMode === "auto" && (
          <div className="space-y-3">
            <div className="bg-blue-50/60 border border-blue-200 rounded-md p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                  Suggested Charge Materials
                </span>
                <p className="text-xs text-slate-600">
                  Detected {suggestions.length} alloying solute{suggestions.length === 1 ? "" : "s"}. Review the recommended vehicle alloys below:
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={handleApplySuggestions}
                className="text-xs font-semibold shrink-0"
              >
                <Check className="size-3.5 mr-1.5" />
                Confirm & Apply Suggestions
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {suggestions.map((sug) => {
                const isSelected = selectedMasterAlloyIds.includes(sug.suggestedMasterAlloy.id);
                return (
                  <div
                    key={sug.suggestedMasterAlloy.id}
                    onClick={() => handleToggleMasterAlloy(sug.suggestedMasterAlloy.id)}
                    className={`p-3 rounded-md border text-left cursor-pointer transition-all ${
                      isSelected
                        ? "bg-white border-primary shadow-xs ring-1 ring-primary/40"
                        : "bg-slate-50/70 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {sug.suggestedMasterAlloy.code}
                      </span>
                      {isSelected ? (
                        <span className="text-emerald-700 text-[11px] font-semibold flex items-center gap-1">
                          <CheckCircle2 className="size-3.5" />
                          Selected
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Click to add</span>
                      )}
                    </div>
                    <div className="text-xs font-semibold text-slate-800 truncate">
                      {sug.suggestedMasterAlloy.name}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                      {sug.reason}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Manual Selection Mode */}
        {masterAlloyMode === "manual" && (
          <div className="space-y-3">
            <div className="text-xs text-slate-500">
              Select or deselect master alloys from the database for {baseMetal.name}:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto p-1 border border-slate-200 rounded-md">
              {availableMasterAlloys.map((alloy) => {
                const isChecked = selectedMasterAlloyIds.includes(alloy.id);
                return (
                  <label
                    key={alloy.id}
                    className={`flex items-start gap-2.5 p-2.5 rounded border cursor-pointer transition-all ${
                      isChecked
                        ? "bg-blue-50/60 border-primary shadow-xs"
                        : "bg-white border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleMasterAlloy(alloy.id)}
                      className="mt-0.5 size-4 rounded border-slate-300 text-primary focus:ring-primary"
                    />
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-slate-900">
                          {alloy.code}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500">
                          {alloy.elements.map((e) => `${e.percent}% ${e.symbol}`).join(", ")}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 truncate">{alloy.name}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Add Custom Master Alloy Toggle */}
        <div className="pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowMasterAlloyEditor((prev) => !prev)}
            className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1"
          >
            <span>{showMasterAlloyEditor ? "Hide" : "+ Add or Customize a Master Alloy"}</span>
            {showMasterAlloyEditor ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </button>

          {showMasterAlloyEditor && (
            <div className="mt-3 p-3.5 bg-slate-50 border border-slate-200 rounded-md space-y-3 text-xs">
              <h4 className="font-semibold text-slate-800">Create Custom Master Alloy</h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">Full Name</label>
                  <Input
                    placeholder="e.g. Al-Scandium 2%"
                    value={newCustomName}
                    onChange={(e) => setNewCustomName(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">Code / Designation</label>
                  <Input
                    placeholder="e.g. AlSc2"
                    value={newCustomCode}
                    onChange={(e) => setNewCustomCode(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">Active Element</label>
                  <select
                    value={newCustomElement}
                    onChange={(e) => setNewCustomElement(e.target.value)}
                    className="w-full h-8 rounded border border-slate-300 px-2 text-xs"
                  >
                    {COMMON_ELEMENTS.map((el) => (
                      <option key={el.symbol} value={el.symbol}>
                        {el.symbol} ({el.name})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">Concentration (%)</label>
                  <Input
                    type="number"
                    value={newCustomPercent}
                    onChange={(e) => setNewCustomPercent(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={handleAddCustomMasterAlloy}
                className="text-xs h-7.5"
              >
                Save Custom Master Alloy
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* SECTION D: Batch Weight Selection */}
      <section className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-5 items-center justify-center rounded-full bg-primary text-white text-[11px] font-bold">
                4
              </span>
              <h2 className="text-sm font-semibold text-slate-900">
                Target Melt Batch Weight
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Specify crucible charge weight. Standard default is 1000 grams (1.0 kg).
            </p>
          </div>
          <Scale className="size-4 text-slate-400 hidden sm:block" />
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-medium text-slate-700">Quick Presets:</span>
          {[
            { label: "500 g", value: 500 },
            { label: "1000 g (1 kg)", value: 1000 },
            { label: "5000 g (5 kg)", value: 5000 },
            { label: "10,000 g (10 kg)", value: 10000 },
          ].map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => handleBatchPreset(preset.value)}
              className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors border ${
                batchWeightGrams === preset.value
                  ? "bg-primary text-white border-primary font-bold shadow-xs"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {preset.label}
            </button>
          ))}

          <div className="relative flex items-center max-w-[150px] ml-auto">
            <Input
              type="number"
              min="1"
              step="10"
              value={customWeightInput}
              onChange={(e) => handleCustomWeightChange(e.target.value)}
              className="h-8 text-xs font-mono pr-7 bg-white"
              aria-label="Custom batch weight in grams"
            />
            <span className="absolute right-2 text-slate-400 font-mono text-xs pointer-events-none">
              g
            </span>
          </div>
        </div>
      </section>

      {/* SECTION E & F: Calculation Results & Professional Melting Recipe */}
      <section className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded bg-primary text-white flex items-center justify-center">
              <Flame className="size-3.5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Calculated Melting Recipe & Charge Breakdown
              </h2>
              <p className="text-xs text-slate-500">
                Batch Weight: <strong>{batchWeightGrams.toFixed(1)} g</strong> ({ (batchWeightGrams / 1000).toFixed(2) } kg)
              </p>
            </div>
          </div>

          {calculationResult.isFeasible ? (
            <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold text-xs">
              <CheckCircle2 className="size-3.5 mr-1 text-emerald-700" />
              Charge Feasible & Conserved
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-red-50 text-red-800 border-red-300 font-semibold text-xs">
              <AlertTriangle className="size-3.5 mr-1 text-red-600" />
              Infeasible Recipe
            </Badge>
          )}
        </div>

        {/* INFEASIBLE WARNING BANNER */}
        {!calculationResult.isFeasible && (
          <div className="rounded-lg border border-red-200 bg-red-50/80 p-4 space-y-2 text-xs text-red-900">
            <div className="flex items-center gap-2 font-bold text-red-800">
              <AlertTriangle className="size-4 shrink-0 text-red-600" />
              Calculation Limitations & Infeasibility Notice
            </div>
            <p className="leading-relaxed">
              {calculationResult.infeasibleReason ||
                "The target composition cannot be physically melted using the current master alloy selections."}
            </p>
            <ul className="list-disc pl-5 space-y-1 text-red-800 text-[11px]">
              <li>Check if total alloying solutes exceed 100% in Section 2.</li>
              <li>Verify that you have not selected redundant master alloys for the same element.</li>
              <li>Ensure base metal purity does not contain impurities higher than the target specification.</li>
            </ul>
          </div>
        )}

        {/* FEASIBLE MELTING RECIPE TABLE */}
        {calculationResult.isFeasible && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                1. Crucible Charge Additions
              </h3>
              <div className="overflow-x-auto border border-slate-200 rounded-md">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                    <tr>
                      <th className="py-2.5 px-4">Material</th>
                      <th className="py-2.5 px-4">Code / Purity</th>
                      <th className="py-2.5 px-4 text-right">Required Weight</th>
                      <th className="py-2.5 px-4 text-right">% of Charge</th>
                      <th className="py-2.5 px-4">Composition Summary</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {calculationResult.additions.map((item) => (
                      <tr
                        key={item.materialId}
                        className={item.materialType === "base_metal" ? "bg-blue-50/30 font-semibold" : "hover:bg-slate-50/50"}
                      >
                        <td className="py-2.5 px-4 font-sans font-medium text-slate-900">
                          {item.materialName}
                        </td>
                        <td className="py-2.5 px-4 text-slate-600">
                          {item.materialCode}
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-slate-900 text-sm">
                          {item.weightGrams.toFixed(2)} g
                        </td>
                        <td className="py-2.5 px-4 text-right text-slate-700">
                          {item.percentageOfCharge.toFixed(2)}%
                        </td>
                        <td className="py-2.5 px-4 font-sans text-slate-600 text-[11px]">
                          {item.compositionSummary}
                        </td>
                      </tr>
                    ))}
                    {/* Total Row */}
                    <tr className="bg-slate-100/80 font-bold border-t-2 border-slate-300 text-slate-900 text-sm">
                      <td className="py-3 px-4 font-sans">
                        Total Charge Weight
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-normal text-xs font-sans">
                        100.00% Conserved
                      </td>
                      <td className="py-3 px-4 text-right text-primary text-base">
                        {calculationResult.totalChargeWeightGrams.toFixed(2)} g
                      </td>
                      <td className="py-3 px-4 text-right">
                        100.00%
                      </td>
                      <td className="py-3 px-4 text-emerald-700 text-xs font-sans">
                        &Delta; Mass: {calculationResult.massBalanceDifferenceGrams.toFixed(3)} g
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Target vs. Calculated Composition Verification */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                2. Target vs. Calculated Final Composition
              </h3>
              <div className="overflow-x-auto border border-slate-200 rounded-md">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold font-sans">
                    <tr>
                      <th className="py-2.5 px-4">Element</th>
                      <th className="py-2.5 px-4 text-right">Target wt.%</th>
                      <th className="py-2.5 px-4 text-right">Calculated wt.%</th>
                      <th className="py-2.5 px-4 text-right">Deviation</th>
                      <th className="py-2.5 px-4 text-right">Total Mass (g)</th>
                      <th className="py-2.5 px-4">Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {calculationResult.elementResults.map((el) => {
                      const isBase = el.symbol === baseMetal.symbol.toUpperCase();
                      return (
                        <tr key={el.symbol} className={isBase ? "bg-slate-50 font-bold" : "hover:bg-slate-50/50"}>
                          <td className="py-2 px-4 font-bold text-slate-900">
                            {el.symbol} {isBase && <span className="font-sans text-[11px] font-normal text-slate-500">(Matrix)</span>}
                          </td>
                          <td className="py-2 px-4 text-right text-slate-600">
                            {el.targetPercent.toFixed(2)}%
                          </td>
                          <td className="py-2 px-4 text-right font-bold text-slate-900">
                            {el.calculatedPercent.toFixed(2)}%
                          </td>
                          <td
                            className={`py-2 px-4 text-right font-medium ${
                              Math.abs(el.deviationPercent) > 0.05
                                ? "text-amber-700"
                                : "text-emerald-700"
                            }`}
                          >
                            {el.deviationPercent >= 0 ? `+${el.deviationPercent.toFixed(3)}%` : `${el.deviationPercent.toFixed(3)}%`}
                          </td>
                          <td className="py-2 px-4 text-right text-slate-700">
                            {el.totalWeightGrams.toFixed(2)} g
                          </td>
                          <td className="py-2 px-4 font-sans">
                            {el.status === "exact" ? (
                              <span className="text-[11px] text-emerald-700 font-medium">Exact match</span>
                            ) : el.status === "acceptable" ? (
                              <span className="text-[11px] text-slate-600">&plusmn;0.01% standard rounding</span>
                            ) : (
                              <span className="text-[11px] text-amber-700 font-semibold">Unmatched deviation</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Warnings and Assumptions */}
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <Info className="size-4 text-primary" />
                Metallurgical Assumptions & Physical Verification
              </div>
              <ul className="list-disc pl-5 space-y-1 text-[11px]">
                {calculationResult.assumptions.map((asm, idx) => (
                  <li key={idx}>{asm}</li>
                ))}
              </ul>
              {calculationResult.warnings.length > 0 && (
                <div className="pt-2 border-t border-slate-200 space-y-1">
                  {calculationResult.warnings.map((w, idx) => (
                    <p key={idx} className="text-amber-700 font-medium text-[11px] flex items-center gap-1">
                      <AlertTriangle className="size-3 shrink-0" />
                      {w}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Educational Footer Note */}
      <EducationalCallout title="Simultaneous Mass-Balance Metallurgy Principle" variant="info">
        In foundry metallurgy, master alloys do not merely introduce solute atoms; their carrier matrix also supplies host base metal. AlloyCal solves this simultaneous mass balance so that both solute targets and total batch weight are satisfied exactly in one pass.
      </EducationalCallout>
    </div>
  );
}
