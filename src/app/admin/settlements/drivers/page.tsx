"use client";

import { useEffect, useMemo, useState } from "react";
import SettlementReport from "@/components/settlement/SettlementReport";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import LoadingState from "@/components/ui/LoadingState";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeDrivers } from "@/lib/firebase/drivers";
import { subscribeOrdersByDriver } from "@/lib/firebase/orders";
import {
  buildSettlementRows,
  dateKeyOf,
  reconcileDriverDay,
  subscribeDriverSettlementsByDriver,
} from "@/lib/firebase/driverSettlement";
import type { Driver, DriverSettlement, Order } from "@/types";

const inputClass =
  "rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-navy outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

// Сарын эхэн → өнөөдөр (анхны муж).
function defaultRange(): { start: string; end: string } {
  const now = new Date();
  return {
    start: dateKeyOf(new Date(now.getFullYear(), now.getMonth(), 1)),
    end: dateKeyOf(now),
  };
}

export default function DriverSettlementsPage() {
  const { profile } = useAuth();

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [driverId, setDriverId] = useState("");
  // Өгөгдлийг эзэн жолоочийн ID-тай хамт хадгална — жолооч солиход өмнөхийнх
  // харагдахгүй, мөн effect дотроос setState хийх шаардлагагүй болно.
  const [ordersFor, setOrdersFor] = useState<{ id: string; list: Order[] }>({
    id: "",
    list: [],
  });
  const [savedFor, setSavedFor] = useState<{ id: string; list: DriverSettlement[] }>({
    id: "",
    list: [],
  });
  const [error, setError] = useState("");
  const [busyKey, setBusyKey] = useState("");

  // Огнооны талбарууд — "Хайх" дарж л мужийг хэрэглэнэ (Deligo шиг).
  const [initial] = useState(defaultRange);
  const [startInput, setStartInput] = useState(initial.start);
  const [endInput, setEndInput] = useState(initial.end);
  const [range, setRange] = useState(initial);

  useEffect(() => {
    const unsub = subscribeDrivers(
      (list) => setDrivers(list.filter((d) => d.isActive)),
      () => setError("Жолоочдыг ачаалахад алдаа гарлаа."),
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!driverId) return;
    const unsubO = subscribeOrdersByDriver(
      driverId,
      (list) => setOrdersFor({ id: driverId, list }),
      () => setError("Захиалгыг ачаалахад алдаа гарлаа."),
    );
    const unsubS = subscribeDriverSettlementsByDriver(
      driverId,
      (list) => setSavedFor({ id: driverId, list }),
      () => {},
    );
    return () => {
      unsubO();
      unsubS();
    };
  }, [driverId]);

  const driver = drivers.find((d) => d.id === driverId);
  // Зөвхөн одоогийн жолоочийн өгөгдлийг хэрэглэнэ.
  const orders = useMemo(
    () => (ordersFor.id === driverId ? ordersFor.list : []),
    [ordersFor, driverId],
  );
  const saved = useMemo(
    () => (savedFor.id === driverId ? savedFor.list : []),
    [savedFor, driverId],
  );
  const loading = driverId !== "" && ordersFor.id !== driverId;

  const rows = useMemo(
    () => buildSettlementRows(orders, range.start, range.end),
    [orders, range],
  );

  // dateKey → хадгалсан тооцоо (тэмдэглэгээ/тайлбар).
  const savedByKey = useMemo(() => {
    const m = new Map<string, DriverSettlement>();
    for (const s of saved) m.set(s.dateKey, s);
    return m;
  }, [saved]);

  async function toggleReconciled(dateKey: string, next: boolean) {
    const row = rows.find((r) => r.dateKey === dateKey);
    if (!row || !driver) return;
    setBusyKey(dateKey);
    setError("");
    try {
      await reconcileDriverDay({
        driverId: driver.id,
        driverName: driver.name,
        dateKey,
        dateMs: row.dateMs,
        reconciled: next,
        note: savedByKey.get(dateKey)?.note ?? "",
        actorUid: profile?.uid ?? "",
        codTotal: row.codTotal,
        deliveryTotal: row.deliveryTotal,
        payable: row.payable,
        deliveredOrders: row.deliveredCount,
      });
    } catch {
      setError("Хадгалахад алдаа гарлаа.");
    } finally {
      setBusyKey("");
    }
  }

  async function saveNote(dateKey: string, note: string) {
    const row = rows.find((r) => r.dateKey === dateKey);
    if (!row || !driver) return;
    const existing = savedByKey.get(dateKey);
    if ((existing?.note ?? "") === note) return; // өөрчлөгдөөгүй бол бичихгүй
    try {
      await reconcileDriverDay({
        driverId: driver.id,
        driverName: driver.name,
        dateKey,
        dateMs: row.dateMs,
        reconciled: existing?.reconciled ?? false,
        note,
        actorUid: profile?.uid ?? "",
        codTotal: row.codTotal,
        deliveryTotal: row.deliveryTotal,
        payable: row.payable,
        deliveredOrders: row.deliveredCount,
      });
    } catch {
      setError("Тайлбар хадгалахад алдаа гарлаа.");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <h1 className="text-xl font-bold text-navy">Тооцооны тайлан — Жолооч</h1>
        <button
          onClick={() => window.print()}
          disabled={!driverId}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-navy transition hover:bg-slate-50 disabled:opacity-50"
        >
          🖨 Хэвлэх
        </button>
      </div>

      {/* Шүүлтүүр */}
      <div className="mt-4 flex flex-wrap items-end gap-3 print:hidden">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Жолооч</label>
          <select
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
            className={inputClass}
          >
            <option value="">— Сонгох —</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} {d.phone}
              </option>
            ))}
          </select>
        </div>
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

      {error && (
        <div className="mt-4 print:hidden">
          <ErrorState message={error} />
        </div>
      )}

      {!driverId ? (
        <div className="mt-6">
          <EmptyState icon="🧾" title="Жолооч сонгоно уу" />
        </div>
      ) : loading ? (
        <div className="mt-6">
          <LoadingState />
        </div>
      ) : (
        <>
          {rows.length === 0 ? (
            <div className="mt-6">
              <EmptyState icon="📭" title="Энэ хугацаанд хүргэлт алга" />
            </div>
          ) : (
            <div className="mt-5">
              <SettlementReport
                rows={rows}
                savedByKey={savedByKey}
                driver={driver}
                editable
                busyKey={busyKey}
                onToggle={toggleReconciled}
                onNote={saveNote}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
