"use client";

import { formatCurrency } from "@/lib/format";
import type { PartnerTrendPoint } from "@/lib/partnerKpi";

// Хамаарал ашиглахгүй — энгийн CSS bar chart-ууд.
export default function PartnerTrendChart({ points }: { points: PartnerTrendPoint[] }) {
  const maxOrders = Math.max(1, ...points.map((p) => p.total));
  const maxCod = Math.max(1, ...points.map((p) => p.codTotal));

  return (
    <div className="space-y-4">
      {/* Захиалгын трэнд + delivered vs failed */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-navy">Захиалгын трэнд</h3>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-sm bg-navy" /> Нийт
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-sm bg-green-500" /> Хүргэсэн
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-sm bg-red-400" /> Амжилтгүй
            </span>
          </div>
        </div>
        <div className="mt-4 flex items-end justify-between gap-2" style={{ height: 160 }}>
          {points.map((p) => (
            <div key={p.month} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex h-full w-full items-end justify-center gap-0.5">
                <div
                  className="w-1/4 rounded-t bg-navy"
                  style={{ height: `${(p.total / maxOrders) * 100}%` }}
                  title={`Нийт: ${p.total}`}
                />
                <div
                  className="w-1/4 rounded-t bg-green-500"
                  style={{ height: `${(p.delivered / maxOrders) * 100}%` }}
                  title={`Хүргэсэн: ${p.delivered}`}
                />
                <div
                  className="w-1/4 rounded-t bg-red-400"
                  style={{ height: `${(p.failed / maxOrders) * 100}%` }}
                  title={`Амжилтгүй: ${p.failed}`}
                />
              </div>
              <span className="text-[10px] text-slate-400">{p.month.slice(5)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* COD трэнд */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-bold text-navy">COD трэнд</h3>
        <div className="mt-4 flex items-end justify-between gap-2" style={{ height: 130 }}>
          {points.map((p) => (
            <div key={p.month} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex h-full w-full items-end justify-center">
                <div
                  className="w-1/2 rounded-t bg-brand"
                  style={{ height: `${(p.codTotal / maxCod) * 100}%` }}
                  title={formatCurrency(p.codTotal)}
                />
              </div>
              <span className="text-[10px] text-slate-400">{p.month.slice(5)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
