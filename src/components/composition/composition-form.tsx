"use client";

import { useState, useId } from "react";
import { BASE_METALS, REFERENCE_ALLOYS, COMMON_ELEMENTS } from "@/lib/data/reference-alloys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EducationalCallout } from "@/components/educational/educational-callout";
import { Plus, Trash2, RotateCcw, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, HelpCircle } from "lucide-react";

interface ElementRow {
  id: string;
  symbol: string;
  percent: number;
}

export function CompositionForm() {
  const [selectedMetalId, setSelectedMetalId] = useState<string>("al");
  const [selectedAlloyId, setSelectedAlloyId] = useState<string>("al-6061");
  const [rows, setRows] = useState<ElementRow[]>([
    { id: "row-1", symbol: "Mg", percent: 1.0 },
    { id: "row-2", symbol: "Si", percent: 0.6 },
    { id: "row-3", symbol: "Cu", percent: 0.28 },
    { id: "row-4", symbol: "Cr", percent: 0.2 },
    { id: "row-5", symbol: "Fe", percent: 0.35 },
  ]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [newElementSymbol, setNewElementSymbol] = useState("Mn");

  const baseMetal = BASE_METALS.find((m) => m.id === selectedMetalId) || BASE_METALS[0];
  const activeAlloy = REFERENCE_ALLOYS.find((a) => a.id === selectedAlloyId);

  // Available alloys for the currently selected base metal
  const availableAlloys = REFERENCE_ALLOYS.filter(
    (a) => a.baseMetalId === selectedMetalId
  );

  // Solute sum calculation
  const totalSolute = rows.reduce((acc, row) => acc + (Number(row.percent) || 0), 0);
  const balancePercent = Math.max(0, 100 - totalSolute);
  const isOver100 = totalSolute > 100;

  // Handle loading a predefined alloy
  const handleAlloyChange = (alloyId: string) => {
    setSelectedAlloyId(alloyId);
    if (alloyId === "custom") {
      setRows([
        { id: "row-custom-1", symbol: "Cu", percent: 2.0 },
        { id: "row-custom-2", symbol: "Zn", percent: 1.5 },
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
          percent: s.nominalPercent ?? s.minPercent ?? 0.5,
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

  // Add an element row
  const handleAddElement = () => {
    if (!newElementSymbol) return;
    const exists = rows.some((r) => r.symbol === newElementSymbol);
    if (exists) return;

    setRows((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        symbol: newElementSymbol,
        percent: 0.1,
      },
    ]);
  };

  // Update row percentage
  const handlePercentChange = (id: string, val: string) => {
    const num = parseFloat(val);
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, percent: isNaN(num) ? 0 : num } : r))
    );
  };

  // Remove row
  const handleRemoveRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  // Reset to active alloy defaults
  const handleReset = () => {
    handleAlloyChange(selectedAlloyId);
  };

  // Check element against active alloy spec
  const getSpecStatus = (symbol: string, actual: number) => {
    if (!activeAlloy) return null;
    const spec = activeAlloy.specifications.find((s) => s.elementSymbol === symbol);
    if (!spec) return { status: "unspecified", label: "Not in standard spec" };

    if (spec.minPercent !== null && actual < spec.minPercent) {
      return { status: "below", label: `Below min (${spec.minPercent}%)` };
    }
    if (spec.maxPercent !== null && actual > spec.maxPercent) {
      return { status: "above", label: `Exceeds max (${spec.maxPercent}%)` };
    }
    return {
      status: "within",
      label: `Within spec (${spec.minPercent ?? 0}% - ${spec.maxPercent ?? 100}%)`,
    };
  };

  return (
    <div className="space-y-6">
      {/* Step 1: Base Metal & Reference Selection Bar */}
      <section className="bg-slate-50 border border-slate-200 rounded-lg p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Base Metal Choice */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              1. Base Metal Matrix
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

          {/* Reference Specification Choice */}
          <div>
            <label htmlFor="alloy-select" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              2. Reference Specification Target
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
            <p className="mt-1.5 text-[11px] text-slate-500">
              {activeAlloy?.educationalNotes || "Custom experimental composition without fixed bounds."}
            </p>
          </div>
        </div>
      </section>

      {/* Step 2: Composition Input Table & Live Balance */}
      <section className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-xs">
        <div className="border-b border-slate-200 bg-slate-50/70 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Chemical Composition (Weight %)</h2>
            <p className="text-xs text-slate-500">
              Specify solute percentages. The balance element calculates automatically.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={newElementSymbol}
              onChange={(e) => setNewElementSymbol(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 shadow-xs focus:border-primary focus:outline-none"
              aria-label="Select element to add"
            >
              {COMMON_ELEMENTS.filter(
                (el) => el.symbol !== baseMetal.symbol && !rows.some((r) => r.symbol === el.symbol)
              ).map((el) => (
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
        </div>

        {/* Input Elements Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="py-2.5 px-4 font-semibold w-24">Element</th>
                <th className="py-2.5 px-4 font-semibold w-40">Solute Mass %</th>
                <th className="py-2.5 px-4 font-semibold">Specification Limit</th>
                <th className="py-2.5 px-4 font-semibold w-48">Compliance Status</th>
                <th className="py-2.5 px-3 text-right font-semibold w-16">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => {
                const elInfo = COMMON_ELEMENTS.find((e) => e.symbol === row.symbol);
                const specStatus = getSpecStatus(row.symbol, row.percent);

                return (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
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
                          value={row.percent}
                          onChange={(e) => handlePercentChange(row.id, e.target.value)}
                          className="h-8 text-xs font-mono pr-6"
                        />
                        <span className="absolute right-2 text-slate-400 font-mono text-xs pointer-events-none">
                          %
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-4 text-slate-600 font-mono text-[11px]">
                      {activeAlloy?.specifications.find((s) => s.elementSymbol === row.symbol) ? (
                        (() => {
                          const s = activeAlloy.specifications.find((spec) => spec.elementSymbol === row.symbol)!;
                          return `${s.minPercent ?? "0.00"}% – ${s.maxPercent ?? "Max"}% (Nom: ${s.nominalPercent ?? "—"}%)`;
                        })()
                      ) : (
                        <span className="text-slate-400 italic">No limit specified</span>
                      )}
                    </td>
                    <td className="py-2 px-4">
                      {specStatus && (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${
                            specStatus.status === "within"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : specStatus.status === "above"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : specStatus.status === "below"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {specStatus.label}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right">
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

              {/* Automatic Balance Row */}
              <tr className="bg-blue-50/40 font-medium border-t-2 border-slate-200">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-primary bg-blue-100/80 px-2 py-0.5 rounded border border-blue-200">
                      {baseMetal.symbol}
                    </span>
                    <span className="text-slate-700 text-xs font-semibold">
                      {baseMetal.name} (Balance Matrix)
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 font-mono font-bold text-sm text-primary">
                  {isOver100 ? (
                    <span className="text-red-600">0.00%</span>
                  ) : (
                    `${balancePercent.toFixed(2)}%`
                  )}
                </td>
                <td className="py-3 px-4 text-slate-600 text-[11px]">
                  Reference purity: &gt;={baseMetal.standardPurity}%
                </td>
                <td className="py-3 px-4" colSpan={2}>
                  {isOver100 ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                      <AlertTriangle className="size-3" />
                      Solutes exceed 100%
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      <CheckCircle2 className="size-3" />
                      Calculated by difference
                    </span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Calculation Summary Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-slate-500">Total Solutes: </span>
              <strong className="font-mono text-slate-900">{totalSolute.toFixed(2)}%</strong>
            </div>
            <div>
              <span className="text-slate-500">Balance ({baseMetal.symbol}): </span>
              <strong className="font-mono text-primary">{balancePercent.toFixed(2)}%</strong>
            </div>
            <div>
              <span className="text-slate-500">Overall Sum: </span>
              <strong className={`font-mono ${isOver100 ? "text-red-600 font-bold" : "text-emerald-700"}`}>
                {(totalSolute + (isOver100 ? 0 : balancePercent)).toFixed(2)}%
              </strong>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced((prev) => !prev)}
            className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium"
          >
            <span>Educational & Advanced Explanations</span>
            {showAdvanced ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </button>
        </div>

        {/* Advanced Settings & Notes Collapsible */}
        {showAdvanced && (
          <div className="p-4 bg-white border-t border-slate-200 text-xs space-y-3">
            <h4 className="font-semibold text-slate-800 flex items-center gap-1.5">
              <HelpCircle className="size-4 text-primary" />
              Metallurgical Calculation Notes
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-600">
              <div className="p-2.5 rounded bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-medium text-slate-900">Why calculate the Balance element?</span>
                <p className="text-[11px] leading-relaxed">
                  In optical emission spectroscopy (OES) and X-ray fluorescence (XRF), trace and alloying additions are quantified first. The primary solvent element (here {baseMetal.name}) constitutes the remainder of the 100% mass balance.
                </p>
              </div>
              <div className="p-2.5 rounded bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-medium text-slate-900">Tolerances & Specification Limits</span>
                <p className="text-[11px] leading-relaxed">
                  Standard specifications (like ASTM B209 for 6061) dictate minimums to guarantee mechanical precipitation and maximums to avert embrittlement and hot tearing during casting.
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
