import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Flame,
  Calculator,
  BookOpen,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <div className="flex flex-col flex-1">
      {/* Hero Section */}
      <section className="border-b border-slate-200 bg-linear-to-b from-slate-50/60 to-white py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-primary text-xs font-medium">
            <span className="size-2 rounded-full bg-primary" />
            Educational Metallurgy &amp; Material Science
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
            Alloy Composition &amp; Charge Calculator
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            An educational tool for exploring chemical compositions, calculating
            melting charges and checking alloy specifications against industry
            standards.
          </p>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/charge-calculator"
              className={cn(
                buttonVariants({ size: "lg" }),
                "w-full sm:w-auto text-sm font-semibold shadow-xs inline-flex items-center gap-2"
              )}
            >
              Open Charge Calculator
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/composition-checker"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "w-full sm:w-auto text-sm text-slate-700"
              )}
            >
              Composition Checker
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Introduction: 3 Concise Sections */}
      <section className="py-12 sm:py-16 max-w-5xl mx-auto px-4 sm:px-6 w-full">
        <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Core Modules
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            From composition analysis to melting charge recipes — engineered for
            learning and practical reference.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Module 1: Charge Calculator */}
          <Card className="border-slate-200 shadow-none hover:border-slate-300 transition-colors">
            <CardHeader className="pb-3">
              <div className="size-10 rounded-md bg-blue-50 border border-blue-200 flex items-center justify-center text-primary mb-2">
                <Flame className="size-5" />
              </div>
              <CardTitle className="text-base font-semibold text-slate-900">
                1. Charge Calculator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <p className="text-xs text-slate-600 leading-relaxed">
                Calculate precise furnace charge recipes using simultaneous
                mass-balance equations.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Select base metals and master alloys.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Solve multi-component charge balances.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>View deviation analysis and recipes.</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Module 2: Composition Checker */}
          <Card className="border-slate-200 shadow-none hover:border-slate-300 transition-colors">
            <CardHeader className="pb-3">
              <div className="size-10 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-primary mb-2">
                <Calculator className="size-5" />
              </div>
              <CardTitle className="text-base font-semibold text-slate-900">
                2. Composition Checker
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <p className="text-xs text-slate-600 leading-relaxed">
                Interactive tool for real-time elemental calculations and
                specification checking.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Enter chemical compositions.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Validate against ASTM specifications.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Auto-calculate balance elements.</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Module 3: Material Library */}
          <Card className="border-slate-200 shadow-none hover:border-slate-300 transition-colors">
            <CardHeader className="pb-3">
              <div className="size-10 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-primary mb-2">
                <BookOpen className="size-5" />
              </div>
              <CardTitle className="text-base font-semibold text-slate-900">
                3. Material Library
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <p className="text-xs text-slate-600 leading-relaxed">
                Structured reference catalog of industrial base metals and
                standard alloys.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Explore base metals and alloys.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>View nominal compositions.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Reference specification limits.</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Academic Principles Strip */}
        <div className="mt-12 rounded-lg border border-slate-200 bg-slate-50/70 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="size-5 text-emerald-700 shrink-0" />
            <div className="text-xs text-slate-600">
              <strong className="text-slate-900 font-semibold">
                Educational Quality Standard:
              </strong>{" "}
              All baseline specifications adhere to ASTM / SAE international
              standards for materials science teaching.
            </div>
          </div>
          <Link
            href="/about"
            className="text-xs font-semibold text-primary hover:underline shrink-0"
          >
            Learn about metallurgy principles &rarr;
          </Link>
        </div>
      </section>
    </div>
  );
}
