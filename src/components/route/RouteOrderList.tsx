"use client";

import Link from "next/link";
import { ORDER_STATUS_LABELS, type Order } from "@/types";

interface Props {
  located: Order[]; // оновчлогдсон дараалал
  unlocated: Order[]; // байршилгүй (доор тусдаа)
  // Дэлгэрэнгүй холбоос харуулах эсэх (driver/admin аль алинд тохирно).
  detailHref?: (order: Order) => string;
}

function OrderRow({
  order,
  index,
  detailHref,
}: {
  order: Order;
  index?: number;
  detailHref?: (order: Order) => string;
}) {
  const mapUrl = order.location
    ? `https://www.google.com/maps?q=${order.location.lat},${order.location.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.receiverAddress)}`;

  return (
    <div className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
          index != null ? "bg-brand text-white" : "bg-slate-100 text-slate-400"
        }`}
      >
        {index != null ? index : "—"}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-sm font-semibold text-navy">
            {order.orderCode}
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
            {ORDER_STATUS_LABELS[order.status]}
          </span>
        </div>
        <p className="mt-0.5 text-sm font-medium text-navy">{order.receiverName}</p>
        <p className="truncate text-xs text-slate-500">{order.receiverAddress}</p>

        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <a
            href={`tel:${order.receiverPhone}`}
            className="rounded-lg bg-green-50 px-2.5 py-1 font-medium text-green-700"
          >
            📞 {order.receiverPhone}
          </a>
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-blue-50 px-2.5 py-1 font-medium text-blue-700"
          >
            🗺️ Газрын зураг
          </a>
          {detailHref && (
            <Link
              href={detailHref(order)}
              className="rounded-lg border border-slate-200 px-2.5 py-1 font-medium text-navy"
            >
              Дэлгэрэнгүй
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RouteOrderList({ located, unlocated, detailHref }: Props) {
  return (
    <div className="space-y-4">
      {located.length > 0 && (
        <div className="space-y-2">
          {located.map((o, i) => (
            <OrderRow key={o.id} order={o} index={i + 1} detailHref={detailHref} />
          ))}
        </div>
      )}

      {unlocated.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold text-amber-700">
            ⚠️ Байршилгүй ({unlocated.length}) — гараар тодорхойлно уу
          </p>
          <div className="space-y-2">
            {unlocated.map((o) => (
              <OrderRow key={o.id} order={o} detailHref={detailHref} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
