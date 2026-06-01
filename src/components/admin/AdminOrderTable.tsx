"use client";

import Link from "next/link";
import StatusBadge from "@/components/admin/StatusBadge";
import { isFinalOrderStatus } from "@/lib/status";
import { ORDER_STATUS_LABELS, type Order, type OrderStatus } from "@/types";

const STATUSES = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];

interface Props {
  orders: Order[];
  onAssign: (order: Order) => void;
  onStatusChange: (order: Order, status: OrderStatus) => void;
}

function StatusSelect({
  order,
  onStatusChange,
  disabled,
}: {
  order: Order;
  onStatusChange: Props["onStatusChange"];
  disabled?: boolean;
}) {
  return (
    <select
      value={order.status}
      disabled={disabled}
      onChange={(e) => onStatusChange(order, e.target.value as OrderStatus)}
      className={`rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-navy outline-none transition focus:border-brand ${
        disabled ? "cursor-not-allowed opacity-60" : ""
      }`}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {ORDER_STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  );
}

// Дууссан захиалга дээр харуулах badge.
function DoneBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500 ${className}`}
    >
      Дууссан
    </span>
  );
}

export default function AdminOrderTable({ orders, onAssign, onStatusChange }: Props) {
  return (
    <>
      {/* Desktop — table */}
      <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
        <table className="w-full min-w-[940px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3 font-medium">Код</th>
              <th className="px-4 py-3 font-medium">Байгууллага</th>
              <th className="px-4 py-3 font-medium">Хүлээн авагч</th>
              <th className="px-4 py-3 font-medium">COD</th>
              <th className="px-4 py-3 font-medium">Жолооч</th>
              <th className="px-4 py-3 font-medium">Статус</th>
              <th className="px-4 py-3 text-right font-medium">Үйлдэл</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const final = isFinalOrderStatus(o.status);
              return (
              <tr
                key={o.id}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
              >
                <td className="px-4 py-3 font-mono font-semibold">
                  <Link href={`/admin/orders/detail?id=${o.id}`} className="text-brand hover:underline">
                    {o.orderCode}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">{o.companyName || "—"}</td>
                <td className="px-4 py-3 text-slate-600">
                  {o.receiverName}
                  <span className="block text-xs text-slate-400">
                    {o.receiverPhone}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {o.codAmount.toLocaleString("mn-MN")}₮
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {o.driverName || "—"}
                  {o.autoAssigned && o.driverName && (
                    <span
                      title="Авто-оноолтоор оноогдсон"
                      className="ml-1.5 rounded-full bg-brand/10 px-1.5 py-0.5 text-[10px] font-semibold text-brand-dark"
                    >
                      🤖 Авто
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={o.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <StatusSelect order={o} onStatusChange={onStatusChange} disabled={final} />
                    {final ? (
                      <DoneBadge />
                    ) : (
                      <button
                        onClick={() => onAssign(o)}
                        className="rounded-lg bg-navy px-3 py-1.5 text-xs font-medium text-white transition hover:bg-navy-light"
                      >
                        Жолооч
                      </button>
                    )}
                    <Link
                      href={`/admin/orders/print?id=${o.id}`}
                      title="QR / Хэвлэх"
                      className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs transition hover:bg-slate-50"
                    >
                      🖨
                    </Link>
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile — card list */}
      <div className="space-y-3 md:hidden">
        {orders.map((o) => {
          const final = isFinalOrderStatus(o.status);
          return (
          <div
            key={o.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link
                  href={`/admin/orders/detail?id=${o.id}`}
                  className="font-mono font-semibold text-brand hover:underline"
                >
                  {o.orderCode}
                </Link>
                <p className="text-xs text-slate-400">{o.companyName}</p>
              </div>
              <StatusBadge status={o.status} />
            </div>

            <div className="mt-3 space-y-1 text-sm">
              <p className="text-navy">{o.receiverName}</p>
              <p className="text-slate-500">{o.receiverPhone}</p>
              <p className="text-slate-500">{o.receiverAddress}</p>
              <div className="flex justify-between pt-1 text-slate-600">
                <span>COD: {o.codAmount.toLocaleString("mn-MN")}₮</span>
                <span>Жолооч: {o.driverName || "—"}</span>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <StatusSelect order={o} onStatusChange={onStatusChange} disabled={final} />
              {final ? (
                <DoneBadge className="flex-1 text-center" />
              ) : (
                <button
                  onClick={() => onAssign(o)}
                  className="flex-1 rounded-lg bg-navy px-3 py-2 text-xs font-medium text-white transition hover:bg-navy-light"
                >
                  Жолооч оноох
                </button>
              )}
            </div>
          </div>
          );
        })}
      </div>
    </>
  );
}
