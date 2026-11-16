import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { REFERENCE_ALLOYS, BASE_METALS, COMMON_ELEMENTS } from "@/lib/data/reference-alloys";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EducationalCallout } from "@/components/educational/educational-callout";
import { ArrowLeft, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return REFERENCE_ALLOYS.map((alloy) => ({
    slug: alloy.id,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const alloy = REFERENCE_ALLOYS.find((a) => a.id === slug);
  if (!alloy) return { title: "Alloy Not Found" };

  return {
    title: `${alloy.designation} Specification | Material Library`,
    description: `Chemical composition limits, tolerances, and metallurgy notes for ${alloy.commonName}.`,
  };
}

export default async function AlloyDetailPage({ params }: Props) {
  const { slug } = await params;
  const alloy = REFERENCE_ALLOYS.find((a) => a.id === slug);

  if (!alloy) {
    notFound();
  }

  const baseMetal = BASE_METALS.find((m) => m.id === alloy.baseMetalId);
  const isMaster = alloy.alloyType === "master";

  return (
    <div className="flex-1 bg-white py-8 sm:py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Navigation Breadcrumb / Back */}
        <div className="flex items-center justify-between">
          <Link
            href="/library"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "text-xs text-slate-600 inline-flex items-center gap-1.5"
            )}
          >
            <ArrowLeft className="size-3.5" />
            Back to Material Library
          </Link>
          <Link
            href="/composition-checker"
            className={cn(
              buttonVariants({ size: "sm" }),
              "text-xs inline-flex items-center gap-1.5"
            )}
          >
            <Calculator className="size-3.5" />
            Open in Composition Checker
          </Link>
        </div>

        {/* Specification Header Card */}
        <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-900">
              {alloy.designation}
            </span>
            <Badge
              variant="outline"
              className={
                isMaster
                  ? "bg-amber-50 text-amber-800 border-amber-200"
                  : "bg-blue-50 text-blue-800 border-blue-200"
              }
            >
              {isMaster ? "Master Alloy" : "Standard Specification"}
            </Badge>
            <span className="text-xs text-slate-500 font-mono">
              Base Matrix: {baseMetal?.name} ({baseMetal?.symbol})
            </span>
            {alloy.densityGPerCm3 && (
              <span className="text-xs text-slate-500 font-mono">
                Density: {alloy.densityGPerCm3} g/cm&sup3;
              </span>
            )}
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {alloy.commonName}
            </h1>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              {alloy.educationalNotes}
            </p>
          </div>
        </div>

        {/* Specification Range Table */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Chemical Specification Limits (Weight %)</h2>
            <p className="text-xs text-slate-500">
              Standard tolerance ranges defining acceptable chemical variance for this alloy.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 overflow-hidden bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Element</th>
                    <th className="py-2.5 px-4">Min %</th>
                    <th className="py-2.5 px-4">Max %</th>
                    <th className="py-2.5 px-4">Nominal Target %</th>
                    <th className="py-2.5 px-4">Metallurgical Role & Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {alloy.specifications.map((spec) => {
                    const elInfo = COMMON_ELEMENTS.find((e) => e.symbol === spec.elementSymbol);

                    return (
                      <tr
                        key={spec.id}
                        className={spec.isBalance ? "bg-blue-50/40 font-semibold" : "hover:bg-slate-50/50"}
                      >
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {spec.elementSymbol}
                            </span>
                            <span className="font-sans text-slate-600 text-[11px] hidden sm:inline">
                              {elInfo?.name ?? spec.elementSymbol}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-slate-700">
                          {spec.isBalance ? "Remainder" : spec.minPercent !== null ? `${spec.minPercent.toFixed(2)}%` : "0.00%"}
                        </td>
                        <td className="py-2.5 px-4 text-slate-700">
                          {spec.isBalance ? "Remainder" : spec.maxPercent !== null ? `${spec.maxPercent.toFixed(2)}%` : "Remainder"}
                        </td>
                        <td className="py-2.5 px-4 text-primary font-bold">
                          {spec.nominalPercent !== null ? `${spec.nominalPercent.toFixed(2)}%` : "—"}
                        </td>
                        <td className="py-2.5 px-4 font-sans text-slate-600 text-[11px]">
                          {spec.educationalImpact || elInfo?.educationalRole || "Alloying addition"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Educational Callout */}
        <EducationalCallout title="Understanding Specification Ranges" variant="info">
          In commercial metallurgy, rigid single-value composition targets are impossible to achieve uniformly during large-scale casting. ASTM and SAE standards establish acceptable min-max bands to absorb raw material variations while guaranteeing mechanical and corrosion performance.
        </EducationalCallout>
      </div>
    </div>
  );
}
