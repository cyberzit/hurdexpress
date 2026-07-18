"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/format";
import { deleteOrder } from "@/lib/firebase/orders";
import { ORDER_STATUS_LABELS, type Order } from "@/types";

interface Props {
  order: Order;
  onClose: () => void;
  onDeleted: (order: Order) => void;
}

// Устгах нь БУЦААХГҮЙ үйлдэл тул захиалгын кодыг бичүүлж баталгаажуулна.
export default function DeleteOrderModal({ order, onClose, onDeleted }: Props) {
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const matches = confirm.trim().toUpperCase() === order.orderCode.toUpperCase();

  async function handleDelete() {
    if (!matches) return;
    setBusy(true);
    setError("");
    try {
      await deleteOrder(order.id);
      onDeleted(order);
    } catch {
      setError("Устгахад алдаа гарлаа. Дахин оролдоно уу.");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div
        className="w-full max-w-md rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-bold text-red-600">Захиалга устгах</h2>
          <p className="mt-0.5 font-mono text-sm text-slate-500">{order.orderCode}</p>
        </div>

        <div className="space-y-3 px-6 py-5">
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
            <p className="font-medium text-navy">{order.companyName}</p>
            <p className="text-slate-500">
              {order.receiverName} · {order.receiverPhone}
            </p>
            <p className="mt-1 text-slate-600">
              {formatCurrency(order.codAmount)} · {ORDER_STATUS_LABELS[order.status]}
            </p>
          </div>

          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <p className="font-bold">⚠️ Энэ үйлдлийг буцаах БОЛОМЖГҮЙ.</p>
            <p className="mt-1">
              Захиалга харилцагч болон жолоочийн жагсаалтаас нэгэн зэрэг устна. Тайлан,
              тооцооны түүхээс ч алга болно.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-navy">
              Баталгаажуулахын тулд{" "}
              <span className="font-mono font-bold">{order.orderCode}</span> гэж бичнэ үү
            </label>
            <input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={busy}
              autoComplete="off"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 font-mono text-sm text-navy outline-none transition focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-100"
            />
          </div>
        </div>

        <div className="flex gap-3 border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-navy transition hover:bg-slate-50 disabled:opacity-60"
          >
            Болих
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={busy || !matches}
            className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
          >
            {busy ? "Устгаж байна…" : "Бүрмөсөн устгах"}
          </button>
        </div>
      </div>
    </div>
  );
}
