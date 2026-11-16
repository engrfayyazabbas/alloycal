import { Info, AlertCircle, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface EducationalCalloutProps {
  title: string;
  children: React.ReactNode;
  variant?: "info" | "tip" | "warning";
  className?: string;
}

export function EducationalCallout({
  title,
  children,
  variant = "info",
  className,
}: EducationalCalloutProps) {
  const icons = {
    info: <Info className="size-4 text-blue-700 shrink-0 mt-0.5" />,
    tip: <Lightbulb className="size-4 text-amber-600 shrink-0 mt-0.5" />,
    warning: <AlertCircle className="size-4 text-red-600 shrink-0 mt-0.5" />,
  };

  const styles = {
    info: "bg-blue-50/70 border-blue-200 text-slate-800",
    tip: "bg-amber-50/70 border-amber-200 text-slate-800",
    warning: "bg-red-50/70 border-red-200 text-slate-800",
  };

  return (
    <aside
      className={cn(
        "rounded-md border p-3 text-xs leading-relaxed flex items-start gap-2.5",
        styles[variant],
        className
      )}
      aria-label={`Educational Note: ${title}`}
    >
      {icons[variant]}
      <div className="space-y-1">
        <h4 className="font-semibold text-slate-900 tracking-tight">{title}</h4>
        <div className="text-slate-600">{children}</div>
      </div>
    </aside>
  );
}
