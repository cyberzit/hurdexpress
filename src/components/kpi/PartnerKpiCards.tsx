"use client";

import { formatCurrency } from "@/lib/format";
import { topCompanies } from "@/lib/partnerKpi";
import type { PartnerKpi } from "@/types";

// Top 5 байгууллага (захиалгын тоогоор).
export default function PartnerKpiCards({ kpis }: { kpis: PartnerKpi[] }) {
  const top = topCompanies(kpis, 5);
  if (top.length === 0) return null;

  return (
    <div>
      <h3 className="mb-3 text-sm font-bold text-navy">🏆 Топ 5 харилцагч</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {top.map((k, i) => (
          <div key={k.companyId} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand-dark">
                {i + 1}
              </span>
              <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
                {k.successRate}%
              </span>
            </div>
            <p className="mt-2 truncate text-sm font-bold text-navy" title={k.companyName}>
              {k.companyName}
            </p>
            <p className="mt-1 text-xs text-slate-500">{k.totalOrders} захиалга</p>
            <p className="text-xs text-slate-500">COD: {formatCurrency(k.codTotal)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
