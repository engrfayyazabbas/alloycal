"use client";

import { useState, useMemo } from "react";
import { BASE_METALS, REFERENCE_ALLOYS, COMMON_ELEMENTS } from "@/lib/data/reference-alloys";
import {
  calculateBalance,
  evaluateAlloySpecification,
  validateComposition,
  checkElementSpecification,
  type SpecLimit,
} from "@/lib/calculations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EducationalCallout } from "@/components/educational/educational-callout";
import {
  Plus,
  Trash2,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  AlertCircle,
  Scale,
  ShieldCheck,
} from "lucide-react";

interface FormRow {
  id: string;
  symbol: string;
  rawInput: string;
}

export function CompositionForm() {
  const [selectedMetalId, setSelectedMetalId] = useState<string>("al");
  const [selectedAlloyId, setSelectedAlloyId] = useState<string>("al-6061");

  // Initial 6061 nominal rows
  const [rows, setRows] = useState<FormRow[]>([
    { id: "row-1", symbol: "Mg", rawInput: "1.00" },
    { id: "row-2", symbol: "Si", rawInput: "0.60" },
    { id: "row-3", symbol: "Cu", rawInput: "0.28" },
    { id: "row-4", symbol: "Cr", rawInput: "0.20" },
    { id: "row-5", symbol: "Fe", rawInput: "0.35" },
  ]);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [newElementSymbol, setNewElementSymbol] = useState("Mn");

  const baseMetal = useMemo(
    () => BASE_METALS.find((m) => m.id === selectedMetalId) || BASE_METALS[0],
    [selectedMetalId]
  );

  const activeAlloy = useMemo(
    () => REFERENCE_ALLOYS.find((a) => a.id === selectedAlloyId),
    [selectedAlloyId]
  );

  const availableAlloys = useMemo(
    () => REFERENCE_ALLOYS.filter((a) => a.baseMetalId === selectedMetalId),
    [selectedMetalId]
  );

  // Parse numerical solute inputs for calculation
  const parsedSolutes = useMemo(() => {
    return rows.map((r) => {
      const num = parseFloat(r.rawInput);
      return {
        id: r.id,
        symbol: r.symbol,
        percent: isNaN(num) ? 0 : num,
      };
    });
  }, [rows]);

  // Balance element calculation
  const balanceResult = useMemo(() => {
    return calculateBalance(parsedSolutes, baseMetal.symbol);
  }, [parsedSolutes, baseMetal.symbol]);

  // Composition validation
  const validationReport = useMemo(() => {
    return validateComposition(
      rows.map((r) => ({
        id: r.id,
        symbol: r.symbol,
        percent: r.rawInput,
      })),
      baseMetal.symbol
    );
  }, [rows, baseMetal.symbol]);

  // Full alloy specification comparison (including the balance element)
  const specEvaluation = useMemo(() => {
    if (!activeAlloy) return null;

    const fullComposition = [
      ...parsedSolutes,
      {
        symbol: baseMetal.symbol,
        percent: balanceResult.balancePercent,
      },
    ];

    const specs: SpecLimit[] = activeAlloy.specifications.map((s) => ({
      elementSymbol: s.elementSymbol,
      minPercent: s.minPercent,
      maxPercent: s.maxPercent,
      nominalPercent: s.nominalPercent,
      isBalance: s.isBalance,
    }));

    return evaluateAlloySpecification(fullComposition, specs, activeAlloy.designation);
  }, [activeAlloy, parsedSolutes, baseMetal.symbol, balanceResult.balancePercent]);

  // Handle switching target alloy specification
  const handleAlloyChange = (alloyId: string) => {
    setSelectedAlloyId(alloyId);
    if (alloyId === "custom") {
      setRows([
        { id: "custom-1", symbol: "Cu", rawInput: "2.00" },
        { id: "custom-2", symbol: "Zn", rawInput: "1.50" },
      ]);
      return;
    }

    const alloy = REFERENCE_ALLOYS.find((a) => a.id === alloyId);
    if (alloy) {
      const nonBalance = alloy.specifications
        .filter((s) => !s.isBalance)
        .map((s, index) => ({
          id: `spec-${s.id}-${index}`,
          symbol: s.elementSymbol,
          rawInput: (s.nominalPercent ?? s.minPercent ?? 0.5).toFixed(2),
        }));
      setRows(nonBalance);
    }
  };

  // Handle switching base metal
  const handleBaseMetalChange = (metalId: string) => {
    setSelectedMetalId(metalId);
    const metalAlloys = REFERENCE_ALLOYS.filter((a) => a.baseMetalId === metalId);
    if (metalAlloys.length > 0) {
      handleAlloyChange(metalAlloys[0].id);
    } else {
      setSelectedAlloyId("custom");
      setRows([]);
    }
  };

  // Add an element row with duplicate prevention
  const handleAddElement = () => {
    if (!newElementSymbol) return;
    const exists = rows.some(
      (r) => r.symbol.toUpperCase() === newElementSymbol.toUpperCase()
    );
    if (exists || newElementSymbol.toUpperCase() === baseMetal.symbol.toUpperCase()) {
      return;
    }

    setRows((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        symbol: newElementSymbol,
        rawInput: "0.10",
      },
    ]);
  };

  // Update row percentage string safely
  const handlePercentChange = (id: string, val: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, rawInput: val } : r))
    );
  };

  // Remove an element row
  const handleRemoveRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  // Reset to active alloy defaults
  const handleReset = () => {
    handleAlloyChange(selectedAlloyId);
  };

  // Get active spec boundaries for a single element
  const getRowSpecStatus = (symbol: string, actual: number) => {
    if (!activeAlloy) return null;
    const spec = activeAlloy.specifications.find(
      (s) => s.elementSymbol.toUpperCase() === symbol.toUpperCase()
    );
    return checkElementSpecification(symbol, actual, spec);
  };

  // List of elements eligible to be added (excluding already entered and the base metal)
  const availableElementsToAdd = useMemo(() => {
    return COMMON_ELEMENTS.filter(
      (el) =>
        el.symbol.toUpperCase() !== baseMetal.symbol.toUpperCase() &&
        !rows.some((r) => r.symbol.toUpperCase() === el.symbol.toUpperCase())
    );
  }, [baseMetal.symbol, rows]);

  return (
    <div className="space-y-6">
      {/* STEP 1 & 2: Base Metal Matrix & Reference Specification Selection */}
      <section className="bg-slate-50 border border-slate-200 rounded-lg p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Step 1: Base Metal */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Step 1 — Select Base Metal
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {BASE_METALS.map((metal) => {
                const isSelected = selectedMetalId === metal.id;
                return (
                  <button
                    key={metal.id}
                    type="button"
                    onClick={() => handleBaseMetalChange(metal.id)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-md border text-left transition-all ${
                      isSelected
                        ? "bg-white border-primary shadow-xs ring-1 ring-primary/40 text-primary"
                        : "bg-white/80 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-white"
                    }`}
                  >
                    <span className="font-mono font-bold text-base">{metal.symbol}</span>
                    <span className="text-[11px] font-medium text-slate-600">{metal.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Specification Target */}
          <div>
            <label htmlFor="alloy-select" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Step 2 — Select Reference Specification
            </label>
            <div className="flex gap-2">
              <select
                id="alloy-select"
                value={selectedAlloyId}
                onChange={(e) => handleAlloyChange(e.target.value)}
                className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {availableAlloys.map((alloy) => (
                  <option key={alloy.id} value={alloy.id}>
                    {alloy.commonName}
                  </option>
                ))}
                <option value="custom">Custom Educational Alloy</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                title="Reset values to nominal reference specification"
                className="shrink-0 text-xs text-slate-600 h-9"
              >
                <RotateCcw className="size-3.5 mr-1" />
                Reset
              </Button>
            </div>
            <p className="mt-1.5 text-[11px] text-slate-500 leading-relaxed">
              {activeAlloy?.educationalNotes || "Custom alloy workspace without fixed reference bounds."}
            </p>
          </div>
        </div>
      </section>

      {/* STEP 3: Chemical Composition Input Table */}
      <section className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-xs">
        <div className="border-b border-slate-200 bg-slate-50/70 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Step 3 — Enter Chemical Composition (Weight %)
            </h2>
            <p className="text-xs text-slate-500">
              Enter individual solute percentages. The balance element calculates automatically.
            </p>
          </div>

          {/* Add Element Controls */}
          {availableElementsToAdd.length > 0 && (
            <div className="flex items-center gap-2">
              <select
                value={newElementSymbol}
                onChange={(e) => setNewElementSymbol(e.target.value)}
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 shadow-xs focus:border-primary focus:outline-none"
                aria-label="Select element to add"
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
                onClick={handleAddElement}
                className="text-xs h-7.5"
              >
                <Plus className="size-3.5 mr-1" />
                Add Element
              </Button>
            </div>
          )}
        </div>

        {/* Input Elements Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="py-2.5 px-4 font-semibold w-28">Element</th>
                <th className="py-2.5 px-4 font-semibold w-40">Composition (wt.%)</th>
                <th className="py-2.5 px-4 font-semibold">Reference Specification</th>
                <th className="py-2.5 px-4 font-semibold w-52">Status</th>
                <th className="py-2.5 px-3 text-right font-semibold w-16">Remove</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => {
                const elInfo = COMMON_ELEMENTS.find((e) => e.symbol === row.symbol);
                const numVal = parseFloat(row.rawInput);
                const isNumeric = !isNaN(numVal) && Number.isFinite(numVal);
                const specCheck = isNumeric ? getRowSpecStatus(row.symbol, numVal) : null;

                // Check row-level validation issues
                const rowIssue = validationReport.issues.find(
                  (i) => i.field === row.id
                );

                return (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Element Column */}
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {row.symbol}
                        </span>
                        <span className="text-slate-500 text-[11px] hidden sm:inline">
                          {elInfo?.name}
                        </span>
                      </div>
                    </td>

                    {/* Composition wt.% Column */}
                    <td className="py-2.5 px-4">
                      <div className="relative flex items-center max-w-[130px]">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={row.rawInput}
                          onChange={(e) => handlePercentChange(row.id, e.target.value)}
                          className={`h-8 text-xs font-mono pr-6 ${
                            rowIssue ? "border-red-400 focus-visible:ring-red-400" : ""
                          }`}
                        />
                        <span className="absolute right-2 text-slate-400 font-mono text-xs pointer-events-none">
                          %
                        </span>
                      </div>
                    </td>

                    {/* Specification Limit Column */}
                    <td className="py-2.5 px-4 text-slate-600 font-mono text-[11px]">
                      {activeAlloy?.specifications.find(
                        (s) => s.elementSymbol.toUpperCase() === row.symbol.toUpperCase()
                      ) ? (
                        (() => {
                          const s = activeAlloy.specifications.find(
                            (spec) => spec.elementSymbol.toUpperCase() === row.symbol.toUpperCase()
                          )!;
                          const minStr = s.minPercent !== null ? `${s.minPercent.toFixed(2)}%` : "0.00%";
                          const maxStr = s.maxPercent !== null ? `${s.maxPercent.toFixed(2)}%` : "Remainder";
                          const nomStr = s.nominalPercent !== null ? ` (Nom: ${s.nominalPercent.toFixed(2)}%)` : "";
                          return `${minStr} – ${maxStr}${nomStr}`;
                        })()
                      ) : (
                        <span className="text-slate-400 italic">Not constrained in spec</span>
                      )}
                    </td>

                    {/* Status Column */}
                    <td className="py-2.5 px-4">
                      {rowIssue ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                          <AlertCircle className="size-3 shrink-0" />
                          {rowIssue.message}
                        </span>
                      ) : specCheck ? (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${
                            specCheck.status === "within-spec"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : specCheck.status === "above-spec"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : specCheck.status === "below-spec"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {specCheck.statusMessage}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>

                    {/* Remove Column */}
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(row.id)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                        title={`Remove ${row.symbol}`}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* STEP 4: Balance Element Section */}
      <section className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Step 4 — Calculated Matrix Balance
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xl sm:text-2xl font-bold text-slate-900">
                {baseMetal.name} ({baseMetal.symbol}) Balance:
              </span>
              <span
                className={`font-mono text-xl sm:text-2xl font-bold ${
                  balanceResult.isNegative || balanceResult.isExceeded
                    ? "text-red-600"
                    : "text-primary"
                }`}
              >
                {balanceResult.isNegative || balanceResult.isExceeded
                  ? "0.00 wt.%"
                  : `${balanceResult.balancePercent.toFixed(2)} wt.%`}
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Calculated by mass difference: 100% − ({balanceResult.totalSolutes.toFixed(2)}% solutes) ={" "}
              {balanceResult.balancePercent.toFixed(2)}% {baseMetal.name}.
            </p>
          </div>

          <div className="shrink-0">
            {balanceResult.isExceeded ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-red-100 text-red-700 text-xs font-semibold border border-red-200">
                <AlertTriangle className="size-4" />
                Negative Balance
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200">
                <CheckCircle2 className="size-4" />
                100.00% Mass Conserved
              </span>
            )}
          </div>
        </div>
      </section>

      {/* STEP 5: Overall Composition Results & Compliance Status */}
      <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Step 5 — Composition Result & Compliance Status
            </h3>
            <p className="text-xs text-slate-500">
              Consolidated evaluation of chemical mass totality and reference limit compliance.
            </p>
          </div>
          <Scale className="size-4 text-slate-400" />
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-md bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-slate-500">Total Solute Additions:</span>
            <div className="text-base font-mono font-bold text-slate-900">
              {balanceResult.totalSolutes.toFixed(2)} wt.%
            </div>
          </div>

          <div className="p-3 rounded-md bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-slate-500">{baseMetal.name} Matrix Balance:</span>
            <div className="text-base font-mono font-bold text-primary">
              {balanceResult.balancePercent.toFixed(2)} wt.%
            </div>
          </div>

          <div className="p-3 rounded-md bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-slate-500">Overall Mass Sum:</span>
            <div
              className={`text-base font-mono font-bold ${
                balanceResult.isExceeded ? "text-red-600" : "text-emerald-700"
              }`}
            >
              {(balanceResult.totalSolutes + (balanceResult.isExceeded ? 0 : balanceResult.balancePercent)).toFixed(2)} wt.%
            </div>
          </div>
        </div>

        {/* Dynamic Educational Status Feedback */}
        <div className="space-y-2 pt-1">
          {balanceResult.isExceeded ? (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-800">
              <AlertTriangle className="size-4 shrink-0 mt-0.5 text-red-600" />
              <div>
                <strong className="font-semibold">Composition Exceeds 100%:</strong>{" "}
                The entered alloying elements total {balanceResult.totalSolutes.toFixed(2)}%, leaving no valid balance for {baseMetal.name}. Review and reduce input percentages.
              </div>
            </div>
          ) : specEvaluation && specEvaluation.hasDeviations ? (
            <div className="p-3 rounded-md bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
              <AlertCircle className="size-4 shrink-0 mt-0.5 text-amber-600" />
              <div>
                <strong className="font-semibold">Specification Deviations Detected:</strong>{" "}
                {specEvaluation.summaryMessage} Check element compliance tags above.
              </div>
            </div>
          ) : specEvaluation && specEvaluation.isFullyCompliant ? (
            <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-900">
              <ShieldCheck className="size-4 shrink-0 mt-0.5 text-emerald-700" />
              <div>
                <strong className="font-semibold">Specification Conformance Confirmed:</strong>{" "}
                The entered composition satisfies all available percentage and reference-range checks for {activeAlloy?.commonName}.
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-md bg-blue-50 border border-blue-200 flex items-start gap-2.5 text-xs text-slate-800">
              <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-primary" />
              <div>
                <strong className="font-semibold">Composition Valid:</strong>{" "}
                Solute additions are mathematically sound and conserve total mass.
              </div>
            </div>
          )}
        </div>

        {/* Advanced Settings & Notes Collapsible */}
        <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowAdvanced((prev) => !prev)}
            className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 font-medium"
          >
            <span>Educational & Advanced Metallurgy Explanations</span>
            {showAdvanced ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </button>
        </div>

        {showAdvanced && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs space-y-3">
            <h4 className="font-semibold text-slate-800 flex items-center gap-1.5">
              <HelpCircle className="size-4 text-primary" />
              Metallurgical Principles & Calculation Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-600">
              <div className="p-2.5 rounded bg-white border border-slate-200 space-y-1">
                <span className="font-medium text-slate-900">Why calculate the Balance element?</span>
                <p className="text-[11px] leading-relaxed">
                  In spectrometry assays (OES/XRF), individual alloying additions and tramp impurities are measured. The solvent host element ({baseMetal.name}) is calculated by mass difference to enforce 100.00% mass conservation.
                </p>
              </div>
              <div className="p-2.5 rounded bg-white border border-slate-200 space-y-1">
                <span className="font-medium text-slate-900">Tolerances & Specification Limits</span>
                <p className="text-[11px] leading-relaxed">
                  Standard specifications (like ASTM B209 for 6061) dictate minimums to ensure hardening phase formation (e.g. Mg2Si precipitates) and maximums to avert brittle intermetallics.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Educational Callout */}
      <EducationalCallout title="Understanding Solute Limits in Solid Solutions" variant="info">
        Alloying elements enter the solvent lattice either substitutionally (replacing base metal atoms) or interstitially (fitting into voids). Exceeding maximum specification thresholds often leads to the formation of brittle secondary intermetallics or hot cracking during solidification.
      </EducationalCallout>
    </div>
  );
}
