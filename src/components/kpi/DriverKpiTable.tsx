"use client";

import { downloadCSV } from "@/lib/reports";
import { KPI_CSV_HEADERS, kpiToCsvRows } from "@/lib/kpi";
import { formatCurrency } from "@/lib/format";
import type { DriverKpi } from "@/types";

interface Props {
  kpis: DriverKpi[];
  month: string;
}

function rateTone(rate: number): string {
  if (rate >= 90) return "bg-green-50 text-green-700";
  if (rate >= 70) return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-red-600";
}

export default function DriverKpiTable({ kpis, month }: Props) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h3 className="text-sm font-bold text-navy">Жолоочдын KPI</h3>
        <button
          onClick={() =>
            downloadCSV(`driver-kpi-${month}.csv`, KPI_CSV_HEADERS, kpiToCsvRows(kpis))
          }
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-navy transition hover:bg-slate-50"
        >
          ⬇ CSV
        </button>
      </div>
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
            <th className="px-4 py-3 font-medium">Жолооч</th>
            <th className="px-4 py-3 font-medium">Хүргэсэн</th>
            <th className="px-4 py-3 font-medium">Амжилтгүй</th>
            <th className="px-4 py-3 font-medium">Амжилт %</th>
            <th className="px-4 py-3 font-medium">Цалин</th>
            <th className="px-4 py-3 font-medium">Bonus</th>
          </tr>
        </thead>
        <tbody>
          {kpis.map((k) => (
            <tr key={k.driverId} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
              <td className="px-4 py-3 font-medium text-navy">{k.driverName}</td>
              <td className="px-4 py-3 text-slate-600">{k.totalDelivered}</td>
              <td className="px-4 py-3 text-slate-600">{k.totalFailed}</td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${rateTone(k.successRate)}`}>
                  {k.successRate}%
                </span>
              </td>
              <td className="px-4 py-3 font-semibold text-navy">
                {formatCurrency(k.calculatedSalary)}
              </td>
              <td className="px-4 py-3 text-slate-600">
                {k.bonus > 0 ? (
                  <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand-dark">
                    +{formatCurrency(k.bonus)}
                  </span>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
