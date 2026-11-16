import type { Metadata } from "next";
import Link from "next/link";
import { BASE_METALS, REFERENCE_ALLOYS } from "@/lib/data/reference-alloys";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { BookOpen, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Material Library",
  description:
    "Explore reference chemical compositions for standard industrial alloys and master alloys across aluminium, copper, iron, and titanium systems.",
};

export default function MaterialLibraryPage() {
  return (
    <div className="flex-1 bg-white py-8 sm:py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-10">
        {/* Page Header */}
        <div className="border-b border-slate-200 pb-5">
          <div className="flex items-center gap-2.5 text-primary mb-1.5">
            <BookOpen className="size-5" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Reference Catalog
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Material Library
          </h1>
          <p className="mt-1 text-sm text-slate-600 max-w-3xl leading-relaxed">
            Reference database of base metals, commercial wrought alloys, and foundry master alloys. Inspect nominal chemical limits and educational descriptions for key engineering systems.
          </p>
        </div>

        {/* Section 1: Base Metals Reference */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">1. Base Metal Systems</h2>
              <p className="text-xs text-slate-500">
                Primary solvent elements and baseline commercial purity references.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {BASE_METALS.map((metal) => (
              <Card key={metal.id} className="border-slate-200 shadow-none hover:border-slate-300 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xl font-bold text-primary bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {metal.symbol}
                    </span>
                    <Badge variant="outline" className="text-[11px] font-mono">
                      &gt;={metal.standardPurity}% Pure
                    </Badge>
                  </div>
                  <CardTitle className="text-sm font-semibold text-slate-900 mt-2">
                    {metal.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-0 text-xs">
                  <p className="text-slate-600 line-clamp-3 leading-relaxed">
                    {metal.description}
                  </p>
                  <div className="border-t border-slate-100 pt-2 flex justify-between text-[11px] text-slate-500 font-mono">
                    <span>Tm: {metal.meltingPointCelsius}&deg;C</span>
                    <span>&rho;: {metal.densityGPerCm3} g/cm&sup3;</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Section 2: Reference Alloys Catalog */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">2. Reference Alloys & Specifications</h2>
              <p className="text-xs text-slate-500">
                Commercial specifications and master alloy modifiers. Select an alloy to inspect detailed elemental tolerance tables.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {REFERENCE_ALLOYS.map((alloy) => {
              const base = BASE_METALS.find((m) => m.id === alloy.baseMetalId);
              const isMaster = alloy.alloyType === "master";

              return (
                <Card
                  key={alloy.id}
                  className="border-slate-200 shadow-none hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800">
                            {alloy.designation}
                          </span>
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded font-medium border ${
                              isMaster
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : "bg-blue-50 text-blue-800 border-blue-200"
                            }`}
                          >
                            {isMaster ? "Master Alloy" : "Standard Alloy"}
                          </span>
                        </div>
                        <CardTitle className="text-base font-semibold text-slate-900">
                          {alloy.commonName}
                        </CardTitle>
                      </div>
                      <span className="text-xs font-mono text-slate-500 shrink-0">
                        Matrix: {base?.symbol}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 pt-0">
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {alloy.educationalNotes}
                    </p>

                    {/* Quick Elements Preview */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {alloy.specifications
                        .filter((s) => !s.isBalance)
                        .slice(0, 5)
                        .map((s) => (
                          <span
                            key={s.id}
                            className="font-mono text-[11px] bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-slate-700"
                          >
                            {s.elementSymbol}: {s.nominalPercent ?? `${s.minPercent}-${s.maxPercent}`}%
                          </span>
                        ))}
                      {alloy.specifications.filter((s) => !s.isBalance).length > 5 && (
                        <span className="text-[11px] text-slate-400 self-center">
                          +{alloy.specifications.filter((s) => !s.isBalance).length - 5} more
                        </span>
                      )}
                    </div>

                    <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                      <Link
                        href={`/library/${alloy.id}`}
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                          "text-xs inline-flex items-center gap-1.5"
                        )}
                      >
                        View Specification
                        <ArrowRight className="size-3.5" />
                      </Link>
                      <Link
                        href="/composition-checker"
                        className={cn(
                          buttonVariants({ variant: "ghost", size: "sm" }),
                          "text-xs text-primary hover:text-primary"
                        )}
                      >
                        Test in Checker
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
