import Link from "next/link";
import { Layers } from "lucide-react";
import { NAV_ITEMS, APP_CONFIG } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-50/60 text-slate-600 text-sm">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-slate-200">
          <div className="space-y-2 max-w-sm">
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <div className="flex size-6 items-center justify-center rounded bg-primary text-white">
                <Layers className="size-3.5" aria-hidden="true" />
              </div>
              <span className="font-semibold text-base tracking-tight text-slate-900">
                Alloy<span className="text-primary font-bold">Cal</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {APP_CONFIG.shortDescription}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-8">
            <div>
              <h4 className="text-xs font-semibold text-slate-900 tracking-wider uppercase mb-2">
                Navigation
              </h4>
              <ul className="space-y-1.5 text-xs">
                <li>
                  <Link href="/" className="hover:text-primary transition-colors">
                    Overview
                  </Link>
                </li>
                {NAV_ITEMS.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="hover:text-primary transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-900 tracking-wider uppercase mb-2">
                Educational Scope
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-500">
                <li>Composition balancing</li>
                <li>Base metal tolerances</li>
                <li>ASTM / SAE reference ranges</li>
                <li>Master alloy nominals</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Educational Disclaimer & Copyright */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>
            <strong className="font-medium text-slate-700">Educational Notice:</strong> AlloyCal is strictly intended for educational and academic study. It does not provide foundry melting instructions or commercial charge-weight calculations.
          </p>
          <p className="shrink-0">
            &copy; {APP_CONFIG.currentYear} AlloyCal. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
