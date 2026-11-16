import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { MetallurgyPrincipleCard } from "@/components/educational/metallurgy-principle-card";
import { Atom, Scale, Sliders, ShieldAlert, BookOpen, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "About",
  description:
    "Educational background, metallurgy concepts, and academic scope of the AlloyCal composition analysis platform.",
};

export default function AboutPage() {
  return (
    <div className="flex-1 bg-white py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-10">
        {/* Header */}
        <div className="border-b border-slate-200 pb-5">
          <div className="flex items-center gap-2 text-primary mb-1.5">
            <BookOpen className="size-5" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Academic Background & Scope
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            About AlloyCal
          </h1>
          <p className="mt-2 text-sm text-slate-600 max-w-2xl leading-relaxed">
            AlloyCal is an educational learning tool designed for materials science students, metallurgical technicians, and engineering educators to explore the foundations of chemical composition balancing and specification standards.
          </p>
        </div>

        {/* Core Metallurgy Concepts */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Core Metallurgical Principles</h2>
            <p className="text-xs text-slate-500">
              Fundamental concepts taught through AlloyCal interactive modules.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MetallurgyPrincipleCard
              title="Matrix Element & Balance Calculation"
              subtitle="The 100% Mass Balance Constraint"
              icon={Scale}
              description="In any alloy system, the primary solvent element forms the crystalline matrix. In quantitative chemical assays, alloying elements and impurities are measured directly, and the base element is calculated by difference so the total summation equals exactly 100.00%."
              keyPoints={[
                "Balance % = 100% - Total of all solutes and impurities",
                "Solute summation exceeding 100% indicates measurement or input error",
                "Standard primary metal purity sets baseline matrix expectations",
              ]}
            />

            <MetallurgyPrincipleCard
              title="Specification Tolerances & Limits"
              subtitle="ASTM / SAE Standards Compliance"
              icon={Sliders}
              description="Engineering alloys are not defined by rigid singular numbers, but by min-max composition windows. These tolerances account for raw material natural variations, volatilization during melting, and segregation during solidification."
              keyPoints={[
                "Minimum limits ensure adequate precipitation hardening or solid-solution strengthening",
                "Maximum limits prevent embrittlement, hot tearing, and excessive intermetallic phases",
                "Residual and tramp elements are capped strictly to protect ductility",
              ]}
            />

            <MetallurgyPrincipleCard
              title="Solute Solution Mechanisms"
              subtitle="Substitutional vs Interstitial Solid Solutions"
              icon={Atom}
              description="Added elements integrate into the solvent lattice either substitutionally (replacing host atoms when atomic radii are similar) or interstitially (occupying voids between larger atoms). Exceeding solid solubility limits produces second-phase precipitates."
              keyPoints={[
                "Governed by the Hume-Rothery rules of solubility",
                "Precipitates (e.g. Mg2Si, Al2Cu) pin dislocation motion and harden the metal",
                "Excessive additions degrade corrosion resistance and toughness",
              ]}
            />

            <MetallurgyPrincipleCard
              title="Master Alloys & Modifiers"
              subtitle="Foundry Additions & Grain Refiners"
              icon={BookOpen}
              description="Master alloys (such as AlSr10 or AlTi5B1) are pre-alloyed concentrates. They allow precise introduction of elements with high melting points, high vapor pressures, or very low target concentrations (parts-per-million) without burning or segregation."
              keyPoints={[
                "Ensures rapid and homogeneous dissolution into the melt",
                "Prevents oxidation losses associated with pure elemental additions",
                "Used for grain refinement and eutectic phase modification",
              ]}
            />
          </div>
        </section>

        {/* Clear Educational Disclaimer */}
        <section className="rounded-lg border border-amber-200 bg-amber-50/70 p-5 space-y-3">
          <div className="flex items-center gap-2.5 text-amber-800">
            <ShieldAlert className="size-5 shrink-0" />
            <h3 className="font-semibold text-sm">Educational Scope & Non-Industrial Notice</h3>
          </div>
          <div className="text-xs text-amber-900/80 leading-relaxed space-y-2">
            <p>
              AlloyCal is engineered solely as an academic and visual instructional simulator. It demonstrates mass balance mathematics and ASTM chemical limit comparisons.
            </p>
            <p>
              It <strong>does not</strong> provide furnace charge-weight recipes, melting sequence guidelines, fluxing or degassing instructions, casting safety protocols, or scrap charge optimization. Never use this software as a production foundry control tool.
            </p>
          </div>
        </section>

        {/* Action Call */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-200">
          <span className="text-xs text-slate-500">
            Ready to test chemical compositions?
          </span>
          <Link
            href="/composition-checker"
            className={cn(
              buttonVariants({ size: "sm" }),
              "inline-flex items-center gap-1.5 text-xs"
            )}
          >
            Open Composition Checker
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
