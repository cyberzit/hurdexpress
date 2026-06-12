"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { adjustStock, subscribeMovements } from "@/lib/firebase/inventory";
import { formatDateTime } from "@/lib/format";
import {
  INVENTORY_MOVEMENT_LABELS,
  type InventoryMovement,
  type Product,
} from "@/types";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-navy outline-none transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20";
const labelClass = "text-sm font-medium text-slate-600";

type Mode = "in" | "out" | "adjustment";

const MODE_LABELS: Record<Mode, string> = {
  in: "Нэмэх (+)",
  out: "Хасах (−)",
  adjustment: "Шинэ нийт дүн",
};

export default function InventoryAdjustModal({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const { profile } = useAuth();
  const [mode, setMode] = useState<Mode>("in");
  const [qty, setQty] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [movements, setMovements] = useState<InventoryMovement[]>([]);

  useEffect(() => {
    const unsub = subscribeMovements(product.id, (list) => setMovements(list));
    return () => unsub();
  }, [product.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const n = Number(qty);
    if (qty.trim() === "" || Number.isNaN(n) || n < 0) {
      return setError("Тоо хэмжээг зөв оруулна уу.");
    }
    setBusy(true);
    try {
      await adjustStock({
        productId: product.id,
        type: mode,
        qty: n,
        reason,
        actorId: profile?.uid ?? "",
        actorName: profile?.name ?? "Admin",
      });
      setQty("");
      setReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Алдаа гарлаа.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-navy">Үлдэгдэл засварлах</h2>
            <p className="text-xs text-slate-400">{product.name}</p>
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
          {/* Одоогийн төлөв */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-slate-50 py-2.5">
              <p className="text-lg font-bold text-navy">{product.stockQty ?? 0}</p>
              <p className="text-xs text-slate-500">Нийт</p>
            </div>
            <div className="rounded-xl bg-slate-50 py-2.5">
              <p className="text-lg font-bold text-amber-600">{product.reservedQty ?? 0}</p>
              <p className="text-xs text-slate-500">Түгжсэн</p>
            </div>
            <div className="rounded-xl bg-slate-50 py-2.5">
              <p className="text-lg font-bold text-green-600">{product.availableQty ?? 0}</p>
              <p className="text-xs text-slate-500">Боломжит</p>
            </div>
          </div>

          {/* Тохируулах форм */}
          <form onSubmit={handleSubmit} className="mt-4 space-y-3" noValidate>
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Үйлдэл</label>
                <select
                  className={inputClass}
                  value={mode}
                  onChange={(e) => setMode(e.target.value as Mode)}
                  disabled={busy}
                >
                  {(Object.keys(MODE_LABELS) as Mode[]).map((m) => (
                    <option key={m} value={m}>
                      {MODE_LABELS[m]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Тоо хэмжээ (ш)</label>
                <input
                  className={inputClass}
                  type="number"
                  min={0}
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  disabled={busy}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Шалтгаан</label>
              <input
                className={inputClass}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Жишээ: Шинэ нийлүүлэлт, тооллого"
                disabled={busy}
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-60"
            >
              {busy ? "Хадгалж байна…" : "Хадгалах"}
            </button>
          </form>

          {/* Хөдөлгөөний түүх */}
          <div className="mt-5">
            <p className="text-sm font-semibold text-navy">Хөдөлгөөний түүх</p>
            {movements.length === 0 ? (
              <p className="mt-2 rounded-lg bg-slate-50 px-4 py-4 text-center text-sm text-slate-400">
                Хөдөлгөөн алга.
              </p>
            ) : (
              <div className="mt-2 max-h-56 space-y-1.5 overflow-y-auto">
                {movements.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-xs"
                  >
                    <div>
                      <span className="font-medium text-navy">
                        {INVENTORY_MOVEMENT_LABELS[m.type]}
                      </span>
                      <span className="ml-1.5 text-slate-400">
                        {m.beforeQty} → {m.afterQty}
                      </span>
                      {m.reason && (
                        <span className="block text-slate-400">{m.reason}</span>
                      )}
                    </div>
                    <div className="text-right text-slate-400">
                      <p>{m.actorName}</p>
                      <p>{formatDateTime(m.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
