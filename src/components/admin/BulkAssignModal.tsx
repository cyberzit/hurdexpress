"use client";

import { useState } from "react";
import { bulkAssignDriver } from "@/lib/firebase/orders";
import { logActivity } from "@/lib/firebase/activity";
import { useAuth } from "@/contexts/AuthContext";
import {
  DRIVER_STATUS_LABELS,
  VEHICLE_TYPE_LABELS,
  type Driver,
  type Order,
} from "@/types";

interface Props {
  orders: Order[]; // сонгосон захиалгууд
  drivers: Driver[]; // active жолооч нар
  onClose: () => void;
  onDone: (msg: string) => void;
}

export default function BulkAssignModal({ orders, drivers, onClose, onDone }: Props) {
  const { profile } = useAuth();
  const [selectedId, setSelectedId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleAssign() {
    const driver = drivers.find((d) => d.id === selectedId);
    if (!driver) {
      setError("Жолооч сонгоно уу.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const ids = orders.map((o) => o.id);
      const { assigned, skipped } = await bulkAssignDriver(
        ids,
        driver.id,
        driver.name,
        driver.phone,
      );

      // Activity лог — оноогдсон захиалга бүрт.
      if (profile) {
        const byId = new Map(orders.map((o) => [o.id, o]));
        await Promise.all(
          assigned.map((id) => {
            const o = byId.get(id);
            if (!o) return Promise.resolve();
            return logActivity({
              orderId: o.id,
              orderCode: o.orderCode,
              action: `Жолооч оноосон (бөөнөөр): ${driver.name}`,
              actorId: profile.uid,
              actorName: profile.name,
              actorRole: "admin",
            }).catch(() => {});
          }),
        );
      }

      const msg =
        skipped.length > 0
          ? `${assigned.length} захиалгад ${driver.name} оноогдлоо. ${skipped.length} дууссан тул алгассан.`
          : `${assigned.length} захиалгад ${driver.name} оноогдлоо.`;
      onDone(msg);
    } catch {
      setError("Бөөнөөр онооход алдаа гарлаа.");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0" onClick={busy ? undefined : onClose} aria-hidden />
      <div
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-navy">Бөөнөөр жолооч оноох</h2>
            <p className="text-xs text-slate-400">
              {orders.length} захиалга сонгогдсон
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={busy}
            aria-label="Хаах"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-navy disabled:opacity-60"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5">
          {error && (
            <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          {drivers.length === 0 ? (
            <p className="rounded-lg bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              Идэвхтэй жолооч алга. Эхлээд жолооч нэмнэ үү.
            </p>
          ) : (
            <div className="space-y-2">
              {drivers.map((d) => {
                const selected = d.id === selectedId;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setSelectedId(d.id)}
                    className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                      selected ? "border-brand bg-brand/5" : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <p className="font-medium text-navy">{d.name}</p>
                      <p className="text-xs text-slate-500">
                        {d.phone} · {VEHICLE_TYPE_LABELS[d.vehicleType]}
                      </p>
                    </div>
                    <span className="text-xs text-slate-400">
                      {DRIVER_STATUS_LABELS[d.currentStatus]}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-navy transition hover:bg-slate-50 disabled:opacity-60"
            >
              Болих
            </button>
            <button
              type="button"
              onClick={handleAssign}
              disabled={busy || drivers.length === 0}
              className="flex-1 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-60"
            >
              {busy ? "Оноож байна…" : "Батлах"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
