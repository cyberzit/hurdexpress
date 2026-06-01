"use client";

import StatusBadge from "@/components/admin/StatusBadge";
import type { Order } from "@/types";

const mnt = (n: number) => `${n.toLocaleString("mn-MN")}₮`;

export default function RecentOrders({ orders }: { orders: Order[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-bold text-navy">Сүүлийн захиалгууд</h2>
      </div>

      {orders.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-slate-400">
          Захиалга алга.
        </p>
      ) : (
        <>
          {/* Desktop — table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3 font-medium">Код</th>
                  <th className="px-4 py-3 font-medium">Байгууллага</th>
                  <th className="px-4 py-3 font-medium">Хүлээн авагч</th>
                  <th className="px-4 py-3 font-medium">COD</th>
                  <th className="px-4 py-3 font-medium">Статус</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr
                    key={o.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
                  >
                    <td className="px-4 py-3 font-mono font-semibold text-navy">
                      {o.orderCode}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{o.companyName || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{o.receiverName}</td>
                    <td className="px-4 py-3 text-slate-600">{mnt(o.codAmount)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile — card list */}
          <div className="divide-y divide-slate-100 md:hidden">
            {orders.map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="font-mono text-sm font-semibold text-navy">
                    {o.orderCode}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {o.companyName} · {o.receiverName}
                  </p>
                  <p className="text-xs text-slate-400">{mnt(o.codAmount)}</p>
                </div>
                <StatusBadge status={o.status} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
