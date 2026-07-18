"use client";

import { formatCurrency } from "@/lib/format";
import type { ReportSummary } from "@/lib/orderReport";

function Card({
  label,
  value,
  tone = "text-navy",
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}

export default function PartnerReportSummary({ summary }: { summary: ReportSummary }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <Card label="Нийт захиалга" value={String(summary.total)} />
      <Card label="Хүргэгдсэн" value={String(summary.delivered)} tone="text-green-600" />
      <Card label="Амжилтгүй" value={String(summary.failed)} tone="text-red-600" />
      <Card label="Цуцлагдсан" value={String(summary.cancelled)} tone="text-slate-500" />
      <Card
        label="Нийт барааны үнэ"
        value={formatCurrency(summary.goodsTotal)}
        tone="text-brand"
      />
    </div>
  );
}
