import type { ReactNode } from "react";

type Accent = "navy" | "orange" | "green" | "amber" | "blue" | "slate";

const ACCENTS: Record<Accent, string> = {
  navy: "bg-navy/10 text-navy",
  orange: "bg-brand/10 text-brand-dark",
  green: "bg-green-100 text-green-700",
  amber: "bg-amber-100 text-amber-700",
  blue: "bg-blue-100 text-blue-700",
  slate: "bg-slate-100 text-slate-600",
};

export interface StatCardProps {
  title: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  accent?: Accent;
}

export default function StatCard({
  title,
  value,
  hint,
  icon,
  accent = "navy",
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        {icon && (
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg ${ACCENTS[accent]}`}
          >
            {icon}
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-bold text-navy">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
