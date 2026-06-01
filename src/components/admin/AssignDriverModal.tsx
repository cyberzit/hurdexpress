"use client";

import { useMemo, useState } from "react";
import { assignDriver } from "@/lib/firebase/orders";
import { logActivity } from "@/lib/firebase/activity";
import { pickBestDriver } from "@/lib/autoDispatch";
import { useAuth } from "@/contexts/AuthContext";
import {
  DRIVER_STATUS_LABELS,
  VEHICLE_TYPE_LABELS,
  type Driver,
  type Order,
} from "@/types";

interface Props {
  order: Order;
  drivers: Driver[]; // active жолооч нар
  onClose: () => void;
}

export default function AssignDriverModal({ order, drivers, onClose }: Props) {
  const { profile } = useAuth();
  const [selectedId, setSelectedId] = useState(order.driverId ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Авто-dispatch-тэй ижил логикоор санал болгох жолооч.
  const suggested = useMemo(() => pickBestDriver(drivers, order), [drivers, order]);

  async function handleAssign() {
    const driver = drivers.find((d) => d.id === selectedId);
    if (!driver) {
      setError("Жолооч сонгоно уу.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await assignDriver(order.id, driver.id, driver.name, driver.phone);

      // Activity лог (жолоочийн push/notification-г Cloud Function хариуцна).
      try {
        if (profile) {
          await logActivity({
            orderId: order.id,
            orderCode: order.orderCode,
            action: `Жолооч оноосон: ${driver.name}`,
            actorId: profile.uid,
            actorName: profile.name,
            actorRole: "admin",
          });
        }
      } catch {
        /* лог амжаагүй ч үргэлжилнэ */
      }

      onClose();
    } catch {
      setError("Жолооч онооход алдаа гарлаа.");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-navy">Жолооч оноох</h2>
            <p className="font-mono text-xs text-slate-400">{order.orderCode}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Хаах"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-navy"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5">
          {error && (
            <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          {/* Авто-dispatch санал */}
          {suggested && suggested.id !== selectedId && (
            <button
              type="button"
              onClick={() => setSelectedId(suggested.id)}
              className="mb-3 flex w-full items-center justify-between rounded-xl border border-brand/30 bg-brand/5 px-4 py-2.5 text-left transition hover:bg-brand/10"
            >
              <span className="text-sm text-navy">
                💡 Санал болгох: <span className="font-semibold">{suggested.name}</span>
                <span className="ml-1 text-xs text-slate-500">
                  ({suggested.currentOrderCount ?? 0} идэвхтэй захиалга)
                </span>
              </span>
              <span className="text-xs font-medium text-brand">Сонгох</span>
            </button>
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
                      selected
                        ? "border-brand bg-brand/5"
                        : "border-slate-200 hover:bg-slate-50"
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
              {busy ? "Оноож байна…" : "Оноох"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
