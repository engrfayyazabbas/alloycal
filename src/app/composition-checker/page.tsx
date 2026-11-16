import type { Metadata } from "next";
import { CompositionForm } from "@/components/composition/composition-form";
import { Calculator } from "lucide-react";

export const metadata: Metadata = {
  title: "Composition Checker",
  description:
    "Analyze alloy chemical compositions, compute matrix balance percentages, and verify elements against standardized tolerances.",
};

export default function CompositionCheckerPage() {
  return (
    <div className="flex-1 bg-white py-8 sm:py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Header Header */}
        <div className="border-b border-slate-200 pb-5">
          <div className="flex items-center gap-2.5 text-primary mb-1.5">
            <Calculator className="size-5" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Interactive Metallurgy Module
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Composition Checker
          </h1>
          <p className="mt-1 text-sm text-slate-600 max-w-3xl leading-relaxed">
            Enter chemical solute percentages to evaluate alloy compositions, monitor the solvent matrix balance in real time, and compare against reference specification thresholds.
          </p>
        </div>

        {/* Composition Workspace */}
        <CompositionForm />
      </div>
    </div>
  );
}
