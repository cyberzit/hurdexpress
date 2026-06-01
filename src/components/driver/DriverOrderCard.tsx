"use client";

import Link from "next/link";
import StatusBadge from "@/components/admin/StatusBadge";
import type { Order } from "@/types";

export default function DriverOrderCard({ order }: { order: Order }) {
  const item = order.productName || order.itemName || "—";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-lg font-bold text-navy">{order.orderCode}</p>
          <p className="text-sm text-slate-500">{order.companyName}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="mt-3 space-y-1 text-sm">
        <p className="font-medium text-navy">{order.receiverName}</p>
        <p className="text-slate-500">{order.receiverPhone}</p>
        <p className="text-slate-500">{order.receiverAddress}</p>
      </div>

      <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
        {item}
        {order.qty ? ` · ${order.qty}ш` : ""}
      </div>

      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-slate-500">
          COD:{" "}
          <span className="font-semibold text-navy">
            {order.codAmount.toLocaleString("mn-MN")}₮
          </span>
        </span>
        <span className="text-slate-500">
          Хүргэлт:{" "}
          <span className="font-semibold text-navy">
            {order.deliveryPrice.toLocaleString("mn-MN")}₮
          </span>
        </span>
      </div>

      <Link
        href={`/driver/orders/detail?id=${order.id}`}
        className="mt-4 block rounded-xl bg-navy py-3 text-center text-sm font-semibold text-white transition hover:bg-navy-light"
      >
        Дэлгэрэнгүй
      </Link>
    </div>
  );
}
