"use client";

import { useEffect, useMemo, useState } from "react";
import MonthlyTrendChart from "@/components/kpi/MonthlyTrendChart";
import DailyDeliveryChart from "@/components/kpi/DailyDeliveryChart";
import LoadingState from "@/components/ui/LoadingState";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeOrdersByDriver } from "@/lib/firebase/orders";
import { subscribeDriverSettlementsByDriver } from "@/lib/firebase/driverSettlement";
import { subscribeSettings, DEFAULT_SETTINGS } from "@/lib/settings";
import {
  buildDailyDeliveries,
  buildDayKpi,
  buildDriverKpis,
  buildMonthlyTrend,
  currentMonthKey,
  monthRange,
  recentDaysFromNow,
  recentMonthsFromNow,
  todayRangeNow,
} from "@/lib/kpi";
import { formatCurrency } from "@/lib/format";
import { ORDER_STATUS_LABELS, type DriverSettlement, type GeneralSettings, type Order, type OrderStatus } from "@/types";

// Жолоочийн пайплайны статусууд (count cards).
const PIPELINE: OrderStatus[] = ["assigned", "picked_up", "on_the_way", "delivered", "failed"];
const STATUS_TONE: Partial<Record<OrderStatus, string>> = {
  assigned: "text-indigo-600",
  picked_up: "text-blue-600",
  on_the_way: "text-amber-600",
  delivered: "text-green-600",
  failed: "text-red-600",
};

function StatCard({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-bold ${tone ?? "text-navy"}`}>{value}</p>
    </div>
  );
}

export default function DriverKpiPage() {
  const { user, profile } = useAuth();
  const driverId = profile?.driverId ?? user?.uid ?? "";

  const month = useMemo(() => currentMonthKey(), []);
  const months = useMemo(() => recentMonthsFromNow(6), []);
  const days7 = useMemo(() => recentDaysFromNow(7), []);
  const days30 = useMemo(() => recentDaysFromNow(30), []);
  const today = useMemo(() => todayRangeNow(), []);

  const [orders, setOrders] = useState<Order[]>([]);
  const [settlements, setSettlements] = useState<DriverSettlement[]>([]);
  const [settings, setSettings] = useState<GeneralSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!driverId) return;
    const u1 = subscribeOrdersByDriver(
      driverId,
      (list) => {
        setOrders(list);
        setLoading(false);
      },
      () => setLoading(false),
    );
    const u2 = subscribeDriverSettlementsByDriver(driverId, (l) => setSettlements(l));
    const u3 = subscribeSettings((s) => setSettings(s));
    return () => {
      u1();
      u2();
      u3();
    };
  }, [driverId]);

  const settings_ = settings ?? (DEFAULT_SETTINGS as GeneralSettings);

  // Энэ сарын KPI (өөрийн).
  const kpi = useMemo(() => {
    const { start, end } = monthRange(month);
    const s = start.getTime();
    const e = end.getTime();
    const monthOrders = orders.filter((o) => o.createdAt >= s && o.createdAt <= e);
    const monthSettlements = settlements.filter((x) => x.date >= s && x.date <= e);
    const list = buildDriverKpis(monthOrders, monthSettlements, settings_, month);
    return list.find((k) => k.driverId === driverId) ?? null;
  }, [orders, settlements, settings_, month, driverId]);

  const trend = useMemo(
    () => buildMonthlyTrend(orders, settings_, months),
    [orders, settings_, months],
  );

  // Статусын тоо (бүх оноогдсон захиалга).
  const statusCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const o of orders) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [orders]);

  // Өнөөдрийн KPI.
  const dayKpi = useMemo(
    () => buildDayKpi(orders, today.start, today.end),
    [orders, today],
  );

  const daily7 = useMemo(() => buildDailyDeliveries(orders, days7), [orders, days7]);
  const daily30 = useMemo(() => buildDailyDeliveries(orders, days30), [orders, days30]);

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-navy">Миний гүйцэтгэл</h1>
        <p className="mt-0.5 text-sm text-slate-500">Захиалгын төлөв, өдөр/сарын KPI</p>
      </div>

      {/* Статусын тоо */}
      <div className="grid grid-cols-3 gap-2.5">
        {PIPELINE.map((s) => (
          <StatCard
            key={s}
            label={ORDER_STATUS_LABELS[s]}
            value={String(statusCounts[s] ?? 0)}
            tone={STATUS_TONE[s]}
          />
        ))}
      </div>

      {/* Өнөөдрийн KPI */}
      <div>
        <p className="mb-2 text-sm font-semibold text-navy">Өнөөдрийн KPI</p>
        <div className="grid grid-cols-3 gap-2.5">
          <StatCard label="Нийт хүргэлт" value={String(dayKpi.delivered)} />
          <StatCard label="Амжилтын хувь" value={`${dayKpi.successRate}%`} tone="text-green-600" />
          <StatCard label="Төлбөрийн дүн" value={formatCurrency(dayKpi.codCollected)} tone="text-brand" />
        </div>
      </div>

      {/* Сарын KPI */}
      <div>
        <p className="mb-2 text-sm font-semibold text-navy">{month} сарын KPI</p>
        <div className="grid grid-cols-3 gap-2.5">
          <StatCard label="Нийт хүргэлт" value={String(kpi?.totalDelivered ?? 0)} />
          <StatCard label="Нийт төлбөр" value={formatCurrency(kpi?.totalCodCollected ?? 0)} tone="text-brand" />
          <StatCard label="Амжилтын хувь" value={`${kpi?.successRate ?? 0}%`} tone="text-green-600" />
        </div>
      </div>

      {/* Хүргэлтийн график */}
      <DailyDeliveryChart title="7 хоногийн хүргэлт" points={daily7} />
      <DailyDeliveryChart title="30 хоногийн хүргэлт" points={daily30} />

      {/* Цалин */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Цалин" value={formatCurrency(kpi?.calculatedSalary ?? 0)} tone="text-brand" />
        <StatCard
          label="Bonus"
          value={kpi && kpi.bonus > 0 ? formatCurrency(kpi.bonus) : "—"}
          tone="text-brand"
        />
      </div>

      {/* Төлбөрийн зөрүү */}
      <div
        className={`rounded-2xl border px-4 py-3 text-sm ${
          (kpi?.codDifference ?? 0) === 0
            ? "border-green-200 bg-green-50 text-green-700"
            : "border-red-200 bg-red-50 text-red-600"
        }`}
      >
        <span className="font-medium">Төлбөрийн зөрүү (энэ сар): </span>
        <span className="font-bold">{formatCurrency(kpi?.codDifference ?? 0)}</span>
      </div>

      {/* Цалингийн дэлгэрэнгүй */}
      {kpi && (
        <div className="space-y-1.5 rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Суурь цалин</span>
            <span className="text-navy">{formatCurrency(kpi.baseSalary)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Bonus</span>
            <span className="text-navy">{formatCurrency(kpi.bonus)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-100 pt-1.5">
            <span className="font-medium text-slate-600">Нийт цалин</span>
            <span className="font-bold text-navy">{formatCurrency(kpi.calculatedSalary)}</span>
          </div>
        </div>
      )}

      <MonthlyTrendChart points={trend} />
    </div>
  );
}
