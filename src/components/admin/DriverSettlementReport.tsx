"use client";

import { useMemo } from "react";
import { downloadCSV } from "@/lib/reports";
import { formatCurrency, formatDate } from "@/lib/format";
import { DRIVER_SETTLEMENT_STATUS_LABELS, type DriverSettlement } from "@/types";

interface SummaryRow {
  driverName: string;
  days: number;
  codCollected: number;
  handedAmount: number;
  difference: number;
}

function buildSummary(items: DriverSettlement[]): SummaryRow[] {
  const map = new Map<string, SummaryRow>();
  for (const s of items) {
    const row =
      map.get(s.driverId) ??
      {
        driverName: s.driverName || "—",
        days: 0,
        codCollected: 0,
        handedAmount: 0,
        difference: 0,
      };
    row.days++;
    row.codCollected += s.codCollected;
    row.handedAmount += s.handedAmount;
    row.difference += s.differenceAmount;
    map.set(s.driverId, row);
  }
  return [...map.values()].sort((a, b) => b.codCollected - a.codCollected);
}

export default function DriverSettlementReport({
  settlements,
}: {
  settlements: DriverSettlement[];
}) {
  const summary = useMemo(() => buildSummary(settlements), [settlements]);
  const diffs = useMemo(
    () => settlements.filter((s) => s.differenceAmount !== 0),
    [settlements],
  );

  if (settlements.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
        Энэ хугацаанд жолоочийн тооцоо алга.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Driver settlement summary */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h3 className="text-sm font-bold text-navy">Жолоочийн тооцооны нэгтгэл</h3>
          <button
            onClick={() =>
              downloadCSV(
                "driver-settlements.csv",
                ["Жолооч", "Өдөр", "COD", "Тушаасан", "Зөрүү"],
                summary.map((r) => [
                  r.driverName,
                  r.days,
                  r.codCollected,
                  r.handedAmount,
                  r.difference,
                ]),
              )
            }
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-navy transition hover:bg-slate-50"
          >
            ⬇ CSV
          </button>
        </div>
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3 font-medium">Жолооч</th>
              <th className="px-4 py-3 font-medium">Өдөр</th>
              <th className="px-4 py-3 font-medium">COD нийт</th>
              <th className="px-4 py-3 font-medium">Тушаасан</th>
              <th className="px-4 py-3 font-medium">Зөрүү</th>
            </tr>
          </thead>
          <tbody>
            {summary.map((r) => (
              <tr key={r.driverName} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 font-medium text-navy">{r.driverName}</td>
                <td className="px-4 py-3 text-slate-600">{r.days}</td>
                <td className="px-4 py-3 text-slate-600">{formatCurrency(r.codCollected)}</td>
                <td className="px-4 py-3 text-slate-600">{formatCurrency(r.handedAmount)}</td>
                <td className={`px-4 py-3 font-semibold ${r.difference === 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatCurrency(r.difference)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* COD difference report */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h3 className="text-sm font-bold text-navy">
            COD зөрүүний тайлан{" "}
            <span className="font-normal text-slate-400">({diffs.length})</span>
          </h3>
        </div>
        {diffs.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-green-600">
            ✓ Зөрүү илрээгүй — бүх тооцоо тэнцсэн.
          </p>
        ) : (
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3 font-medium">Жолооч</th>
                <th className="px-4 py-3 font-medium">Огноо</th>
                <th className="px-4 py-3 font-medium">COD</th>
                <th className="px-4 py-3 font-medium">Тушаасан</th>
                <th className="px-4 py-3 font-medium">Зөрүү</th>
                <th className="px-4 py-3 font-medium">Статус</th>
              </tr>
            </thead>
            <tbody>
              {diffs.map((s) => (
                <tr key={s.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-navy">{s.driverName}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(s.date)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatCurrency(s.codCollected)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatCurrency(s.handedAmount)}</td>
                  <td className="px-4 py-3 font-semibold text-red-600">
                    {formatCurrency(s.differenceAmount)}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {DRIVER_SETTLEMENT_STATUS_LABELS[s.status]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
