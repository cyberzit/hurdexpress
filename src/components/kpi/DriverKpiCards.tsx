"use client";

import { formatCurrency } from "@/lib/format";
import type { KpiHighlights } from "@/lib/kpi";

interface Props {
  highlights: KpiHighlights;
}

function Card({
  icon,
  label,
  name,
  value,
  tone,
}: {
  icon: string;
  label: string;
  name?: string;
  value?: string;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
      <p className="mt-2 truncate text-base font-bold text-navy">{name ?? "—"}</p>
      {value && <p className={`text-sm font-semibold ${tone}`}>{value}</p>}
    </div>
  );
}

export default function DriverKpiCards({ highlights }: Props) {
  const { topDriver, mostDeliveries, bestSuccess, worstDifference } = highlights;
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Card
        icon="🏆"
        label="Шилдэг жолооч"
        name={topDriver?.driverName}
        value={topDriver ? formatCurrency(topDriver.calculatedSalary) : undefined}
        tone="text-brand"
      />
      <Card
        icon="📦"
        label="Хамгийн олон хүргэлт"
        name={mostDeliveries?.driverName}
        value={mostDeliveries ? `${mostDeliveries.totalDelivered} хүргэлт` : undefined}
        tone="text-navy"
      />
      <Card
        icon="🎯"
        label="Хамгийн өндөр амжилт"
        name={bestSuccess?.driverName}
        value={bestSuccess ? `${bestSuccess.successRate}%` : undefined}
        tone="text-green-600"
      />
      <Card
        icon="⚠️"
        label="COD зөрүүтэй"
        name={worstDifference?.driverName}
        value={worstDifference ? formatCurrency(worstDifference.codDifference) : "Зөрүүгүй"}
        tone="text-red-600"
      />
    </div>
  );
}
