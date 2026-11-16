import { Suspense } from "react";
import Link from "next/link";
import { Layers } from "lucide-react";
import { NavLinks } from "./nav-links";
import { MobileNav } from "./mobile-nav";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="max-w-6xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
        {/* Brand Logo & Name */}
        <Link
          href="/"
          className="flex items-center gap-2.5 font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md p-1"
          aria-label="AlloyCal Homepage"
        >
          <div className="flex size-7 items-center justify-center rounded bg-primary text-white shadow-xs">
            <Layers className="size-4" aria-hidden="true" />
          </div>
          <span className="font-semibold text-base tracking-tight text-slate-900">
            Alloy<span className="text-primary font-bold">Cal</span>
          </span>
          <span className="hidden sm:inline-block text-[11px] font-medium tracking-wide uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
            Edu
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-2">
          <Suspense fallback={<div className="h-8 w-64 bg-slate-100/50 rounded animate-pulse" />}>
            <NavLinks />
          </Suspense>
        </div>

        {/* Mobile Navigation */}
        <Suspense fallback={<div className="size-8 rounded bg-slate-100/50 animate-pulse md:hidden" />}>
          <MobileNav />
        </Suspense>
      </div>
    </header>
  );
}
