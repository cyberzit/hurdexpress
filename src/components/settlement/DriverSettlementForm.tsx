"use client";

import { useState } from "react";
import { submitDriverSettlement } from "@/lib/firebase/driverSettlement";
import { formatCurrency } from "@/lib/format";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-navy outline-none transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20";
const labelClass = "text-sm font-medium text-slate-600";

interface Props {
  driverId: string;
  driverName: string;
  dateKey: string;
  dateMs: number;
  totalOrders: number;
  deliveredOrders: number;
  codCollected: number;
  cashCollected: number;
  onClose: () => void;
}

export default function DriverSettlementForm({
  driverId,
  driverName,
  dateKey,
  dateMs,
  totalOrders,
  deliveredOrders,
  codCollected,
  cashCollected,
  onClose,
}: Props) {
  // Анхдагч тушаах дүн — бэлнээр цуглуулсан мөнгө.
  const [handed, setHanded] = useState(String(cashCollected));
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handedNum = Number(handed) || 0;
  const difference = codCollected - handedNum;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (handed.trim() === "" || Number.isNaN(Number(handed)) || handedNum < 0) {
      return setError("Тушаах дүнг зөв оруулна уу.");
    }

    setBusy(true);
    try {
      await submitDriverSettlement({
        driverId,
        driverName,
        dateKey,
        dateMs,
        totalOrders,
        deliveredOrders,
        codCollected,
        cashCollected,
        handedAmount: handedNum,
        note,
      });
      onClose();
    } catch {
      setError("Илгээхэд алдаа гарлаа. Дахин оролдоно уу.");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-navy">Өдөр хаах</h2>
          <button
            onClick={onClose}
            aria-label="Хаах"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-navy"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5" noValidate>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <div className="space-y-1.5 rounded-xl bg-slate-50 px-4 py-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Хүргэсэн захиалга</span>
              <span className="font-medium text-navy">{deliveredOrders}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">COD нийт</span>
              <span className="font-medium text-navy">{formatCurrency(codCollected)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Бэлэн мөнгө</span>
              <span className="font-medium text-navy">{formatCurrency(cashCollected)}</span>
            </div>
          </div>

          <div>
            <label className={labelClass}>Тушаах дүн (₮) *</label>
            <input
              className={inputClass}
              type="number"
              min={0}
              step={100}
              value={handed}
              onChange={(e) => setHanded(e.target.value)}
              disabled={busy}
            />
          </div>

          {/* Зөрүү */}
          <div
            className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm ${
              difference === 0
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-600"
            }`}
          >
            <span className="font-medium">Зөрүү (COD − тушаах)</span>
            <span className="font-bold">{formatCurrency(difference)}</span>
          </div>

          <div>
            <label className={labelClass}>Тэмдэглэл</label>
            <textarea
              className={`${inputClass} min-h-20 resize-y`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Зөрүү гарсан шалтгаан г.м."
              disabled={busy}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-navy transition hover:bg-slate-50 disabled:opacity-60"
            >
              Болих
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex-1 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-60"
            >
              {busy ? "Илгээж байна…" : "Илгээх"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
