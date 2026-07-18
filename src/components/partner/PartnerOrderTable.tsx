"use client";

import Link from "next/link";
import StatusBadge from "@/components/admin/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/format";
import { isFinalOrderStatus } from "@/lib/status";
import type { Order } from "@/types";

export default function PartnerOrderTable({ orders }: { orders: Order[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[820px] table-fixed text-left text-sm">
        <colgroup>
          <col className="w-[11%]" />
          <col className="w-[12%]" />
          <col className="w-[28%]" />
          <col className="w-[13%]" />
          <col className="w-[13%]" />
          <col className="w-[11%]" />
          <col className="w-[12%]" />
        </colgroup>
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
            <th className="px-4 py-3 font-medium">Огноо</th>
            <th className="px-4 py-3 font-medium">Код</th>
            <th className="px-4 py-3 font-medium">Хүлээн авагч</th>
            <th className="px-4 py-3 font-medium">Утас</th>
            <th className="px-4 py-3 font-medium">Барааны үнэ</th>
            <th className="px-4 py-3 font-medium">Жолооч</th>
            <th className="px-4 py-3 font-medium">Статус</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr
              key={o.id}
              className={`border-b border-slate-100 last:border-0 hover:bg-slate-50/60 ${
                o.prepaid ? "bg-emerald-100/70" : ""
              }`}
            >
              <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                {formatDate(o.createdAt)}
              </td>
              <td className="px-4 py-3 font-mono font-semibold">
                <Link
                  href={`/partner/orders/detail?id=${o.id}`}
                  className="text-brand hover:underline"
                >
                  {o.orderCode}
                </Link>
              </td>
              <td className="px-4 py-3 text-slate-600">
                <span className="block truncate">{o.receiverName}</span>
                <span className="block truncate text-xs text-slate-400">
                  {o.receiverAddress}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{o.receiverPhone}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                {formatCurrency(o.codAmount)}
                {/* Тооцоогүй гэж бүртгэсэн — жолооч мөнгө авахгүй. */}
                {o.prepaid && (
                  <span className="block text-xs font-bold text-emerald-700">тооцоогүй</span>
                )}
              </td>
              <td className="truncate px-4 py-3 text-slate-600">{o.driverName || "—"}</td>
              <td className="px-4 py-3">
                <StatusBadge status={o.status} />
                {/* Жолооч хойшлуулсан бол аль өдөр рүү шилжсэнийг харуулна. */}
                {o.scheduledDate && !isFinalOrderStatus(o.status) && (
                  <span
                    title={o.postponedNote || undefined}
                    className="mt-1 block whitespace-nowrap rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-700"
                  >
                    📅 {o.scheduledDate}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
