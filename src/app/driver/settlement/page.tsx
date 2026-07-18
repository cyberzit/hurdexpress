"use client";

import { useEffect, useMemo, useState } from "react";
import SettlementReport from "@/components/settlement/SettlementReport";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeOrdersByDriver } from "@/lib/firebase/orders";
import { getDriver } from "@/lib/firebase/drivers";
import {
  buildSettlementRows,
  dateKeyOf,
  subscribeDriverSettlementsByDriver,
} from "@/lib/firebase/driverSettlement";
import type { Driver, DriverSettlement, Order } from "@/types";

const inputClass =
  "rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-navy outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

// Сарын эхэн → өнөөдөр.
function defaultRange(): { start: string; end: string } {
  const now = new Date();
  return {
    start: dateKeyOf(new Date(now.getFullYear(), now.getMonth(), 1)),
    end: dateKeyOf(now),
  };
}

export default function DriverSettlementPage() {
  const { user, profile } = useAuth();
  const driverId = profile?.driverId ?? user?.uid ?? "";

  const [orders, setOrders] = useState<Order[]>([]);
  const [saved, setSaved] = useState<DriverSettlement[]>([]);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);

  const [initial] = useState(defaultRange);
  const [startInput, setStartInput] = useState(initial.start);
  const [endInput, setEndInput] = useState(initial.end);
  const [range, setRange] = useState(initial);

  useEffect(() => {
    if (!driverId) return;
    const unsubO = subscribeOrdersByDriver(
      driverId,
      (list) => {
        setOrders(list);
        setLoading(false);
      },
      () => setLoading(false),
    );
    const unsubS = subscribeDriverSettlementsByDriver(driverId, setSaved, () => {});
    getDriver(driverId)
      .then(setDriver)
      .catch(() => {});
    return () => {
      unsubO();
      unsubS();
    };
  }, [driverId]);

  const rows = useMemo(
    () => buildSettlementRows(orders, range.start, range.end),
    [orders, range],
  );

  const savedByKey = useMemo(() => {
    const m = new Map<string, DriverSettlement>();
    for (const s of saved) m.set(s.dateKey, s);
    return m;
  }, [saved]);

  if (loading) return <LoadingState />;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-navy">Тооцооны тайлан</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Хүргэсэн өдрөөр — тооцоог админ хянаж нийлүүлнэ
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-navy transition hover:bg-slate-50"
        >
          🖨 Хэвлэх
        </button>
      </div>

      {/* Огнооны муж */}
      <div className="mt-4 flex flex-wrap items-end gap-3 print:hidden">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Эхлэх</label>
          <input
            type="date"
            value={startInput}
            max={endInput}
            onChange={(e) => setStartInput(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Дуусах</label>
          <input
            type="date"
            value={endInput}
            min={startInput}
            onChange={(e) => setEndInput(e.target.value)}
            className={inputClass}
          />
        </div>
        <button
          onClick={() => setRange({ start: startInput, end: endInput })}
          className="rounded-lg bg-brand px-5 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
        >
          Хайх
        </button>
      </div>

      <div className="mt-5">
        {rows.length === 0 ? (
          <EmptyState icon="📭" title="Энэ хугацаанд хүргэлт алга" />
        ) : (
          <SettlementReport rows={rows} savedByKey={savedByKey} driver={driver} />
        )}
      </div>
    </div>
  );
}
