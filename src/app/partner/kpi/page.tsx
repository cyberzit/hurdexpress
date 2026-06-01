"use client";

import { useEffect, useMemo, useState } from "react";
import PartnerTrendChart from "@/components/kpi/PartnerTrendChart";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeOrdersByCompany } from "@/lib/firebase/orders";
import { currentMonthKey, monthRange, recentMonthsFromNow } from "@/lib/kpi";
import {
  buildPartnerKpis,
  buildPartnerTrend,
  buildReasonSummary,
} from "@/lib/partnerKpi";
import { formatCurrency } from "@/lib/format";
import type { Order } from "@/types";

function StatCard({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-bold ${tone ?? "text-navy"}`}>{value}</p>
    </div>
  );
}

function ReasonList({ title, items }: { title: string; items: { reason: string; count: number }[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-navy">{title}</p>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-slate-400">Байхгүй</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {items.map((r) => (
            <li key={r.reason} className="flex justify-between text-sm">
              <span className="text-slate-600">{r.reason}</span>
              <span className="font-semibold text-navy">{r.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function PartnerKpiPage() {
  const { profile, loading: authLoading } = useAuth();
  const companyId = profile?.companyId ?? "";

  const month = useMemo(() => currentMonthKey(), []);
  const months = useMemo(() => recentMonthsFromNow(6), []);

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return; // synchronous setState-аас сэргийлж guard
    const unsub = subscribeOrdersByCompany(
      companyId,
      (list) => {
        setOrders(list);
        setOrdersLoading(false);
      },
      () => setOrdersLoading(false),
    );
    return () => unsub();
  }, [companyId]);

  const { kpi, reasons } = useMemo(() => {
    const { start, end } = monthRange(month);
    const s = start.getTime();
    const e = end.getTime();
    const monthOrders = orders.filter((o) => o.createdAt >= s && o.createdAt <= e);
    const list = buildPartnerKpis(monthOrders, month);
    return { kpi: list[0] ?? null, reasons: buildReasonSummary(monthOrders) };
  }, [orders, month]);

  const trend = useMemo(() => buildPartnerTrend(orders, months), [orders, months]);

  if (authLoading) return <LoadingState />;
  if (!companyId) {
    return (
      <EmptyState icon="🏢" title="Байгууллага холбогдоогүй" description="Админд хандана уу." />
    );
  }
  if (ordersLoading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-navy">Дэлгүүрийн гүйцэтгэл</h1>
        <p className="mt-0.5 text-sm text-slate-500">{month} сарын статистик</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label="Энэ сарын захиалга" value={String(kpi?.totalOrders ?? 0)} />
        <StatCard label="Амжилттай хүргэлт" value={String(kpi?.deliveredOrders ?? 0)} tone="text-green-600" />
        <StatCard label="Амжилтын хувь" value={`${kpi?.successRate ?? 0}%`} tone="text-green-600" />
        <StatCard label="COD нийт" value={formatCurrency(kpi?.codTotal ?? 0)} />
        <StatCard label="Хүргэлтийн төлбөр" value={formatCurrency(kpi?.deliveryFeeTotal ?? 0)} tone="text-brand" />
        <StatCard label="Дундаж COD" value={formatCurrency(kpi?.averageCodAmount ?? 0)} />
      </div>

      {/* Reason summary */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ReasonList title="❌ Амжилтгүй болсон шалтгаан" items={reasons.failed} />
        <ReasonList title="🚫 Цуцлагдсан шалтгаан" items={reasons.cancelled} />
      </div>

      {/* Charts */}
      <PartnerTrendChart points={trend} />
    </div>
  );
}
