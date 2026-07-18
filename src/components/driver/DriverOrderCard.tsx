"use client";

import { useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/admin/StatusBadge";
import { driverUpdateOrder } from "@/lib/firebase/orders";
import { saveListScroll } from "@/lib/listScroll";
import type { Order, OrderStatus } from "@/types";

// Жолооч бараа хүлээж авсан эсэх. Хуучин "on_the_way" төлөв ч хүлээн авсанд тооцно.
export const RECEIVED_STATUSES: OrderStatus[] = ["picked_up", "on_the_way"];
export function isReceived(status: OrderStatus): boolean {
  return RECEIVED_STATUSES.includes(status);
}

// Хүргэгдсэн захиалга ямар хэлбэрээр төлөгдсөн бэ.
function paymentLabel(order: Order): { text: string; className: string } | null {
  if (order.prepaid) {
    return { text: "Урьдчилж төлөгдсөн", className: "bg-green-100 text-green-800" };
  }
  const cash = order.cashPaid ?? 0;
  const transfer = order.transferPaid ?? 0;
  if (cash > 0 && transfer > 0) {
    return { text: "🔀 Хуваасан", className: "bg-purple-100 text-purple-800" };
  }
  if (cash > 0) return { text: "💵 Бэлнээр", className: "bg-green-100 text-green-800" };
  if (transfer > 0) return { text: "🏦 Шилжүүлсэн", className: "bg-blue-100 text-blue-800" };
  return null;
}

export default function DriverOrderCard({ order }: { order: Order }) {
  const item = order.productName || order.itemName || "—";
  const payment = order.status === "delivered" ? paymentLabel(order) : null;
  const [busy, setBusy] = useState(false);

  const received = isReceived(order.status);
  // Хүлээн авах товч зөвхөн идэвхтэй захиалгад (дууссан захиалгад статус л харагдана).
  const canToggle = order.status === "assigned" || received;

  async function toggleReceived() {
    setBusy(true);
    try {
      await driverUpdateOrder(order.id, { status: received ? "assigned" : "picked_up" });
    } catch {
      /* real-time subscription буцаах тул чимээгүй өнгөрнө */
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-lg font-bold text-navy">{order.orderCode}</p>
          <p className="text-sm text-slate-500">{order.companyName}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {canToggle ? (
            <button
              type="button"
              onClick={toggleReceived}
              disabled={busy}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition disabled:opacity-60 ${
                received
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {received ? "✓ Жолооч хүлээн авсан" : "Жолооч хүлээн авсан?"}
            </button>
          ) : (
            <StatusBadge status={order.status} />
          )}
          {payment && (
            <span
              className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${payment.className}`}
            >
              {payment.text}
            </span>
          )}
        </div>
      </div>

      {/* "Мөнгө авахгүй" бол зааварчилгаа — хүргэсний дараа утгагүй тул нуухна. */}
      {order.prepaid && order.status !== "delivered" && (
        <p className="mt-2 inline-flex items-center gap-1 rounded-lg bg-green-100 px-2 py-1 text-xs font-bold text-green-800">
          ✅ Төлбөр төлөгдсөн — мөнгө авахгүй
        </p>
      )}

      {order.scheduledDate && (
        <p className="mt-2 inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
          📅 Хойшилсон · {order.scheduledDate}
        </p>
      )}

      <div className="mt-3 space-y-1 text-sm">
        <p className="font-medium text-navy">{order.receiverName}</p>
        <p className="text-slate-500">{order.receiverPhone}</p>
        <p className="text-slate-500">{order.receiverAddress}</p>
      </div>

      <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
        {item}
        {order.qty ? ` · ${order.qty}ш` : ""}
      </div>

      {/* Жолоочид задаргаа хэрэггүй — авах нийт төлбөр. */}
      <div className="mt-3 flex items-baseline justify-between">
        <span className="text-sm text-slate-500">Авах төлбөр</span>
        {order.prepaid ? (
          <span className="text-base font-bold text-green-700">Төлөгдсөн</span>
        ) : (
          <span className="text-lg font-bold text-navy">
            {(
              order.totalAmount || order.codAmount + order.deliveryPrice
            ).toLocaleString("mn-MN")}
            ₮
          </span>
        )}
      </div>

      <Link
        href={`/driver/orders/detail?id=${order.id}`}
        // Байрлалыг ЯГ энэ агшинд тогтооно — буцахад үүн рүү сэргээнэ.
        onClick={saveListScroll}
        className="mt-4 block rounded-xl bg-navy py-3 text-center text-sm font-semibold text-white transition hover:bg-navy-light"
      >
        Дэлгэрэнгүй
      </Link>
    </div>
  );
}
