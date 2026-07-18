"use client";

import { formatCurrency } from "@/lib/format";
import type { ReportSummary } from "@/lib/adminCompanyReport";

interface Props {
  summary: ReportSummary;
  companyName: string;
  start: string;
  end: string;
}

function Cell({ label, value, tone = "text-navy" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`truncate text-sm font-bold ${tone}`}>{value}</p>
    </div>
  );
}

// Нэг compact мөр — олон том card ашиглахгүй.
export default function AdminCompanyReportSummary({
  summary,
  companyName,
  start,
  end,
}: Props) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:grid-cols-4 lg:grid-cols-7">
      <Cell label="Байгууллага" value={companyName || "—"} />
      <Cell label="Хугацаа" value={`${start} — ${end}`} />
      <Cell label="Нийт захиалга" value={String(summary.total)} />
      <Cell label="Хүргэгдсэн" value={String(summary.delivered)} tone="text-green-600" />
      <Cell label="Амжилтгүй" value={String(summary.failed)} tone="text-red-600" />
      <Cell label="Цуцлагдсан" value={String(summary.cancelled)} tone="text-slate-500" />
      <Cell
        label="Нийт барааны үнэ"
        value={formatCurrency(summary.goodsTotal)}
        tone="text-brand"
      />
    </div>
  );
}
