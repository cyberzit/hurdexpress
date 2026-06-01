"use client";

import Link from "next/link";
import StatusBadge from "@/components/admin/StatusBadge";
import { formatCurrency } from "@/lib/format";
import type { Order } from "@/types";

export default function PartnerOrderTable({ orders }: { orders: Order[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
            <th className="px-4 py-3 font-medium">Код</th>
            <th className="px-4 py-3 font-medium">Хүлээн авагч</th>
            <th className="px-4 py-3 font-medium">Утас</th>
            <th className="px-4 py-3 font-medium">COD</th>
            <th className="px-4 py-3 font-medium">Жолооч</th>
            <th className="px-4 py-3 font-medium">Статус</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr
              key={o.id}
              className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
            >
              <td className="px-4 py-3 font-mono font-semibold">
                <Link href={`/partner/orders/detail?id=${o.id}`} className="text-brand hover:underline">
                  {o.orderCode}
                </Link>
              </td>
              <td className="px-4 py-3 text-slate-600">
                {o.receiverName}
                <span className="block text-xs text-slate-400">{o.receiverAddress}</span>
              </td>
              <td className="px-4 py-3 text-slate-600">{o.receiverPhone}</td>
              <td className="px-4 py-3 text-slate-600">{formatCurrency(o.codAmount)}</td>
              <td className="px-4 py-3 text-slate-600">{o.driverName || "—"}</td>
              <td className="px-4 py-3">
                <StatusBadge status={o.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
