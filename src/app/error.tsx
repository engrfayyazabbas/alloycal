"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected errors for inspection
    console.error("AlloyCal runtime error:", error);
  }, [error]);

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-4 p-6 rounded-lg border border-slate-200 bg-white shadow-xs">
        <div className="mx-auto size-12 rounded-full bg-red-50 flex items-center justify-center text-red-600">
          <AlertTriangle className="size-6" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Calculation or Render Error
        </h1>
        <p className="text-sm text-slate-500 leading-relaxed">
          An unexpected error occurred while processing metallurgy data. You can attempt to re-render the view or reset current inputs.
        </p>
        <div className="pt-2">
          <Button
            onClick={() => reset()}
            className="inline-flex items-center gap-2"
          >
            <RotateCcw className="size-4" />
            Try again
          </Button>
        </div>
      </div>
    </div>
  );
}
