import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft, FileQuestion } from "lucide-react";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="mx-auto size-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
          <FileQuestion className="size-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Page Not Found
        </h1>
        <p className="text-sm text-slate-500 leading-relaxed">
          The requested specification, alloy, or educational route could not be found. Check the URL or return to the overview.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "inline-flex items-center gap-2"
            )}
          >
            <ArrowLeft className="size-4" />
            Return to Overview
          </Link>
        </div>
      </div>
    </div>
  );
}
