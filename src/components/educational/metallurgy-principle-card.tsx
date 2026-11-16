import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetallurgyPrincipleCardProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  description: string;
  keyPoints?: string[];
  className?: string;
}

export function MetallurgyPrincipleCard({
  title,
  subtitle,
  icon: Icon,
  description,
  keyPoints,
  className,
}: MetallurgyPrincipleCardProps) {
  return (
    <Card className={cn("border-slate-200 shadow-none hover:border-slate-300 transition-colors", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-primary">
            <Icon className="size-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold text-slate-900">{title}</CardTitle>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-1">
        <p className="text-xs text-slate-600 leading-relaxed">{description}</p>
        {keyPoints && keyPoints.length > 0 && (
          <ul className="space-y-1 text-xs text-slate-600 border-t border-slate-100 pt-2">
            {keyPoints.map((point, index) => (
              <li key={index} className="flex items-start gap-1.5">
                <span className="text-primary font-bold mt-0.5">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
