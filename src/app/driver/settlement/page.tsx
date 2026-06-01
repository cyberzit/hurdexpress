"use client";

import { useEffect, useMemo, useState } from "react";
import DriverSettlementForm from "@/components/settlement/DriverSettlementForm";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeOrdersByDriver } from "@/lib/firebase/orders";
import {
  computeDayStats,
  subscribeDriverSettlementDay,
  todayRange,
} from "@/lib/firebase/driverSettlement";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { DriverSettlement, Order } from "@/types";

function Card({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-bold ${tone ?? "text-navy"}`}>{value}</p>
    </div>
  );
}

export default function DriverSettlementPage() {
  const { user, profile } = useAuth();
  const driverId = profile?.driverId ?? user?.uid ?? "";
  const driverName = profile?.name ?? "";

  const range = useMemo(() => todayRange(), []);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [settlement, setSettlement] = useState<DriverSettlement | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    if (!driverId) return;
    const unsub = subscribeOrdersByDriver(
      driverId,
      (list) => {
        setOrders(list);
        setLoading(false);
      },
      () => setLoading(false),
    );
    const unsubS = subscribeDriverSettlementDay(driverId, range.key, (s) =>
      setSettlement(s),
    );
    return () => {
      unsub();
      unsubS();
    };
  }, [driverId, range.key]);

  const stats = useMemo(() => computeDayStats(orders, range), [orders, range]);

  const handedDisplay = settlement ? settlement.handedAmount : stats.cashCollected;
  const status = settlement?.status ?? "open";

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-navy">Өдрийн тооцоо</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Өнөөдөр цуглуулсан COD болон тушаах дүн
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card label="Өнөөдрийн хүргэлт" value={String(stats.deliveredOrders)} />
        <Card label="COD нийт" value={formatCurrency(stats.codCollected)} />
        <Card label="Бэлэн мөнгө" value={formatCurrency(stats.cashCollected)} tone="text-green-600" />
        <Card label="Тушаах дүн" value={formatCurrency(handedDisplay)} tone="text-brand" />
      </div>

      {/* Status / action */}
      {status === "approved" ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          ✓ Өнөөдрийн тооцоо батлагдсан. Зөрүү: {formatCurrency(settlement?.differenceAmount ?? 0)}
        </div>
      ) : status === "submitted" ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          ⏳ Тооцоо илгээгдсэн, админ батлахыг хүлээж байна.
          <button
            onClick={() => setFormOpen(true)}
            className="ml-2 font-semibold underline"
          >
            Засах
          </button>
        </div>
      ) : (
        <button
          onClick={() => setFormOpen(true)}
          disabled={stats.deliveredOrders === 0}
          className="w-full rounded-2xl bg-brand py-4 text-base font-bold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-50"
        >
          🔒 Өдөр хаах
        </button>
      )}
      {settlement?.note && (
        <p className="rounded-xl bg-slate-50 px-4 py-2.5 text-sm text-slate-600">
          📝 {settlement.note}
        </p>
      )}

      {/* Today's delivered orders */}
      <div>
        <p className="mb-2 text-sm font-semibold text-navy">
          Өнөөдрийн хүргэлтүүд ({stats.delivered.length})
        </p>
        {stats.delivered.length === 0 ? (
          <EmptyState icon="📦" title="Өнөөдөр хүргэсэн захиалга алга" />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-3 py-2.5 font-medium">Код</th>
                  <th className="px-3 py-2.5 font-medium">Хүлээн авагч</th>
                  <th className="px-3 py-2.5 font-medium">COD</th>
                  <th className="px-3 py-2.5 font-medium">Хүргэлт</th>
                  <th className="px-3 py-2.5 font-medium">Хүргэсэн</th>
                </tr>
              </thead>
              <tbody>
                {stats.delivered.map((o) => (
                  <tr key={o.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-2.5 font-mono font-semibold text-navy">
                      {o.orderCode}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">{o.receiverName}</td>
                    <td className="px-3 py-2.5 text-slate-600">{formatCurrency(o.codAmount)}</td>
                    <td className="px-3 py-2.5 text-slate-600">{formatCurrency(o.deliveryPrice)}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-500">
                      {formatDateTime(o.deliveredAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {formOpen && (
        <DriverSettlementForm
          driverId={driverId}
          driverName={driverName}
          dateKey={range.key}
          dateMs={range.start.getTime()}
          totalOrders={stats.totalOrders}
          deliveredOrders={stats.deliveredOrders}
          codCollected={stats.codCollected}
          cashCollected={stats.cashCollected}
          onClose={() => setFormOpen(false)}
        />
      )}
    </div>
  );
}
