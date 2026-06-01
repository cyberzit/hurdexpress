"use client";

import { formatCurrency } from "@/lib/format";
import type { MonthlyTrendPoint } from "@/lib/kpi";

// Хамаарал ашиглахгүй — энгийн CSS bar chart (deliveries + salary).
export default function MonthlyTrendChart({ points }: { points: MonthlyTrendPoint[] }) {
  const maxDeliveries = Math.max(1, ...points.map((p) => p.deliveries));
  const maxSalary = Math.max(1, ...points.map((p) => p.salary));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-navy">Сарын трэнд</h3>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-navy" /> Хүргэлт
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-sm bg-brand" /> Цалин
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between gap-2" style={{ height: 160 }}>
        {points.map((p) => (
          <div key={p.month} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-full w-full items-end justify-center gap-1">
              <div
                className="w-1/3 rounded-t bg-navy transition-all"
                style={{ height: `${(p.deliveries / maxDeliveries) * 100}%` }}
                title={`${p.deliveries} хүргэлт`}
              />
              <div
                className="w-1/3 rounded-t bg-brand transition-all"
                style={{ height: `${(p.salary / maxSalary) * 100}%` }}
                title={formatCurrency(p.salary)}
              />
            </div>
            <span className="text-[10px] text-slate-400">{p.month.slice(5)}</span>
            <span className="text-[11px] font-semibold text-navy">{p.deliveries}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
