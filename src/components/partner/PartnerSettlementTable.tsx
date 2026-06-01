"use client";

import Badge from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  SETTLEMENT_STATUS_LABELS,
  type Settlement,
  type SettlementStatus,
} from "@/types";

const STATUS_TONE: Record<SettlementStatus, "slate" | "blue" | "green"> = {
  draft: "slate",
  confirmed: "blue",
  paid: "green",
};

export default function PartnerSettlementTable({
  settlements,
}: {
  settlements: Settlement[];
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
            <th className="px-4 py-3 font-medium">Хугацаа</th>
            <th className="px-4 py-3 font-medium">Хүргэлт</th>
            <th className="px-4 py-3 font-medium">COD</th>
            <th className="px-4 py-3 font-medium">Төлсөн</th>
            <th className="px-4 py-3 font-medium">Үлдэгдэл</th>
            <th className="px-4 py-3 font-medium">Статус</th>
          </tr>
        </thead>
        <tbody>
          {settlements.map((s) => (
            <tr key={s.id} className="border-b border-slate-100 last:border-0">
              <td className="px-4 py-3 text-xs text-slate-500">
                {formatDate(s.periodStart)} – {formatDate(s.periodEnd)}
              </td>
              <td className="px-4 py-3 text-slate-600">{formatCurrency(s.deliveryFeeTotal)}</td>
              <td className="px-4 py-3 text-slate-600">{formatCurrency(s.codTotal)}</td>
              <td className="px-4 py-3 text-slate-600">{formatCurrency(s.paidAmount)}</td>
              <td className="px-4 py-3 font-semibold text-navy">
                {formatCurrency(s.balanceAmount)}
              </td>
              <td className="px-4 py-3">
                <Badge tone={STATUS_TONE[s.status]}>
                  {SETTLEMENT_STATUS_LABELS[s.status]}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
