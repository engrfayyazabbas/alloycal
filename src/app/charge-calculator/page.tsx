import type { Metadata } from "next";
import { MeltingChargeCalculator } from "@/components/charge/melting-charge-calculator";
import { Flame } from "lucide-react";

export const metadata: Metadata = {
  title: "Melting Charge Calculator",
  description:
    "Calculate precise furnace charge recipes, master alloy weights, and base metal requirements using simultaneous mass-balance equations.",
};

export default function ChargeCalculatorPage() {
  return (
    <div className="flex-1 bg-white py-8 sm:py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Page Header */}
        <div className="border-b border-slate-200 pb-5">
          <div className="flex items-center gap-2.5 text-primary mb-1.5">
            <Flame className="size-5" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Crucible & Furnace Charge Optimization
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Melting Charge Calculator
          </h1>
          <p className="mt-1 text-sm text-slate-600 max-w-3xl leading-relaxed">
            Determine the exact theoretical mass of base metal and master alloys required to synthesize target alloy specifications. Solves simultaneous mass conservation balances accounting for multi-component carriers and raw material purity.
          </p>
        </div>

        {/* Charge Calculator Component */}
        <MeltingChargeCalculator />
      </div>
    </div>
  );
}
