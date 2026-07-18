"use client";

import type { DailyDeliveryPoint } from "@/lib/kpi";

// Хамаарал ашиглахгүй — энгийн CSS bar chart (өдрийн хүргэлт).
export default function DailyDeliveryChart({
  title,
  points,
}: {
  title: string;
  points: DailyDeliveryPoint[];
}) {
  const max = Math.max(1, ...points.map((p) => p.deliveries));
  const total = points.reduce((s, p) => s + p.deliveries, 0);
  // 30 хоног дээр бүх labels харуулбал шахагдана — алгасч харуулна.
  const labelEvery = points.length > 14 ? Math.ceil(points.length / 10) : 1;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-bold text-navy">{title}</h3>
        <span className="text-xs text-slate-500">Нийт {total}</span>
      </div>
      <div className="mt-3 flex h-32 items-end gap-1">
        {points.map((p, i) => (
          <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1">
            <span className="text-[9px] font-medium text-slate-400">
              {p.deliveries > 0 ? p.deliveries : ""}
            </span>
            <div
              className="w-full rounded-t bg-brand/80"
              style={{ height: `${(p.deliveries / max) * 100}%`, minHeight: p.deliveries > 0 ? 4 : 1 }}
              title={`${p.label}: ${p.deliveries}`}
            />
            <span className="h-3 text-[8px] text-slate-400">
              {i % labelEvery === 0 ? p.label : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
