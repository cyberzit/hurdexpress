"use client";

// Маршрутын товч статистик карт.
interface Props {
  total: number;
  withLocation: number;
  withoutLocation: number;
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="flex-1 rounded-xl border border-slate-100 bg-white px-3 py-2.5 text-center shadow-sm">
      <p className={`text-xl font-bold ${tone}`}>{value}</p>
      <p className="mt-0.5 text-xs text-slate-500">{label}</p>
    </div>
  );
}

export default function RouteSummary({ total, withLocation, withoutLocation }: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-navy">📍 Өнөөдрийн маршрут</p>
      <div className="mt-3 flex gap-2">
        <Stat label="Нийт захиалга" value={total} tone="text-navy" />
        <Stat label="Байршилтай" value={withLocation} tone="text-green-600" />
        <Stat label="Байршилгүй" value={withoutLocation} tone="text-amber-600" />
      </div>
    </div>
  );
}
