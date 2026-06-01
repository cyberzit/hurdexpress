"use client";

import { downloadCSV } from "@/lib/reports";
import { PARTNER_KPI_CSV_HEADERS, partnerKpiToCsvRows } from "@/lib/partnerKpi";
import { formatCurrency } from "@/lib/format";
import type { PartnerKpi } from "@/types";

interface Props {
  kpis: PartnerKpi[];
  month: string;
}

function rateTone(rate: number): string {
  if (rate >= 90) return "bg-green-50 text-green-700";
  if (rate >= 70) return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-red-600";
}

export default function PartnerKpiTable({ kpis, month }: Props) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h3 className="text-sm font-bold text-navy">Харилцагчдын KPI</h3>
        <button
          onClick={() =>
            downloadCSV(
              `partner-kpi-${month}.csv`,
              PARTNER_KPI_CSV_HEADERS,
              partnerKpiToCsvRows(kpis),
            )
          }
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-navy transition hover:bg-slate-50"
        >
          ⬇ CSV
        </button>
      </div>
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
            <th className="px-4 py-3 font-medium">Байгууллага</th>
            <th className="px-4 py-3 font-medium">Нийт</th>
            <th className="px-4 py-3 font-medium">Хүргэсэн</th>
            <th className="px-4 py-3 font-medium">Амжилтгүй</th>
            <th className="px-4 py-3 font-medium">Цуцлагдсан</th>
            <th className="px-4 py-3 font-medium">Амжилт %</th>
            <th className="px-4 py-3 font-medium">Хүргэлт</th>
            <th className="px-4 py-3 font-medium">COD</th>
            <th className="px-4 py-3 font-medium">Дундаж COD</th>
          </tr>
        </thead>
        <tbody>
          {kpis.map((k) => (
            <tr key={k.companyId} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
              <td className="px-4 py-3 font-medium text-navy">{k.companyName}</td>
              <td className="px-4 py-3 text-slate-600">{k.totalOrders}</td>
              <td className="px-4 py-3 text-slate-600">{k.deliveredOrders}</td>
              <td className="px-4 py-3 text-slate-600">{k.failedOrders}</td>
              <td className="px-4 py-3 text-slate-600">{k.cancelledOrders}</td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${rateTone(k.successRate)}`}>
                  {k.successRate}%
                </span>
              </td>
              <td className="px-4 py-3 text-slate-600">{formatCurrency(k.deliveryFeeTotal)}</td>
              <td className="px-4 py-3 text-slate-600">{formatCurrency(k.codTotal)}</td>
              <td className="px-4 py-3 text-slate-600">{formatCurrency(k.averageCodAmount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
