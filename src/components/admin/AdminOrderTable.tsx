"use client";

import Link from "next/link";
import StatusBadge from "@/components/admin/StatusBadge";
import { formatDate } from "@/lib/format";
import { isFinalOrderStatus } from "@/lib/status";
import { ORDER_STATUS_LABELS, type Order, type OrderStatus } from "@/types";

const STATUSES = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];

interface Props {
  orders: Order[];
  onAssign: (order: Order) => void;
  onStatusChange: (order: Order, status: OrderStatus) => void;
  onDelete: (order: Order) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
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

export default function AdminOrderTable({
  orders,
  onAssign,
  onStatusChange,
  onDelete,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
}: Props) {
  const allSelected = orders.length > 0 && orders.every((o) => selectedIds.has(o.id));
  const someSelected = orders.some((o) => selectedIds.has(o.id));
  return (
    <>
      {/* Desktop — table. Хэвлэхэд A4 босоо цаасанд багтаана:
          min-width, хүрээ, сүүдэр авч хаяж, үсгийг жижигрүүлнэ. */}
      <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm md:block print:block print:overflow-visible print:rounded-none print:border-0 print:shadow-none">
        <table className="w-full min-w-[1080px] text-left text-sm print:min-w-0 print:table-fixed print:text-[10px]">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3 font-medium print:hidden">
                <input
                  type="checkbox"
                  aria-label="Бүгдийг сонгох"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = !allSelected && someSelected;
                  }}
                  onChange={onToggleSelectAll}
                  className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/30"
                />
              </th>
              <th className="px-4 py-3 font-medium print:hidden">Огноо</th>
              <th className="px-4 py-3 font-medium print:hidden">Код</th>
              <th className="px-4 py-3 font-medium print:w-[18%]">Байгууллага</th>
              <th className="px-4 py-3 font-medium print:w-[47%]">Хүлээн авагч</th>
              <th className="px-4 py-3 font-medium print:w-[16%]">Барааны үнэ</th>
              <th className="px-4 py-3 font-medium print:hidden">Жолооч</th>
              <th className="px-4 py-3 font-medium print:w-[19%]">Статус</th>
              <th className="px-4 py-3 text-right font-medium print:hidden">Үйлдэл</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const final = isFinalOrderStatus(o.status);
              const checked = selectedIds.has(o.id);
              return (
              <tr
                key={o.id}
                className={`border-b border-slate-100 last:border-0 transition hover:bg-slate-50/60 ${
                  checked ? "bg-brand/5" : o.prepaid ? "bg-emerald-100/70" : ""
                }`}
              >
                <td className="px-4 py-3 print:hidden">
                  <input
                    type="checkbox"
                    aria-label={`${o.orderCode} сонгох`}
                    checked={checked}
                    onChange={() => onToggleSelect(o.id)}
                    className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/30"
                  />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-500 print:hidden">
                  {formatDate(o.createdAt)}
                </td>
                <td className="px-4 py-3 font-mono font-semibold print:hidden">
                  <Link href={`/admin/orders/detail?id=${o.id}`} className="text-brand hover:underline">
                    {o.orderCode}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">{o.companyName || "—"}</td>
                <td className="px-4 py-3 text-slate-600">
                  {o.receiverName}
                  {/* Нэр нь утаснаас өөр байвал л утсыг тусад нь харуулна
                      (шинэ захиалгад нэр = утас тул давхардна). */}
                  {o.receiverPhone && o.receiverPhone !== o.receiverName && (
                    <span className="block text-xs text-slate-400">{o.receiverPhone}</span>
                  )}
                  {o.receiverAddress && (
                    <span
                      title={o.receiverAddress}
                      // Хэвлэхэд хаяг БҮТЭН харагдана — таслахгүй, мөр таслана.
                      className="mt-0.5 block max-w-[280px] truncate text-xs text-slate-400 print:max-w-none print:overflow-visible print:whitespace-normal print:text-[10px] print:text-slate-700"
                    >
                      📍 {o.receiverAddress}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {o.codAmount.toLocaleString("mn-MN")}₮
                  {/* Байгууллага "тооцоогүй" гэж бүртгэсэн — жолооч мөнгө авахгүй. */}
                  {o.prepaid && (
                    <span className="block text-xs font-bold text-emerald-700">
                      тооцоогүй
                    </span>
                  )}
                </td>
                {/* Жолооч хэвлэхэд хэрэггүй — толгойд нь бичигдсэн. */}
                <td className="px-4 py-3 text-slate-600 print:hidden">
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
                  {/* Жолооч хойшлуулсан бол аль өдөр рүү шилжсэнийг харуулна. */}
                  {o.scheduledDate && !isFinalOrderStatus(o.status) && (
                    <span
                      title={o.postponedNote || undefined}
                      className="mt-1 block whitespace-nowrap rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-700"
                    >
                      📅 Хойшилсон · {o.scheduledDate}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 print:hidden">
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
                    <button
                      onClick={() => onDelete(o)}
                      title="Захиалга устгах"
                      aria-label={`${o.orderCode} устгах`}
                      className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs text-red-500 transition hover:bg-red-50"
                    >
                      🗑
                    </button>
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile — card list. Хэвлэхэд md: breakpoint тохирохгүй тул картууд
          хүснэгтийн ард давхар хэвлэгддэг байсан → print:hidden. */}
      <div className="space-y-3 md:hidden print:hidden">
        {orders.map((o) => {
          const final = isFinalOrderStatus(o.status);
          const checked = selectedIds.has(o.id);
          return (
          <div
            key={o.id}
            className={`rounded-2xl border p-4 shadow-sm transition ${
              checked
                ? "border-brand bg-white ring-1 ring-brand/30"
                : o.prepaid
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  aria-label={`${o.orderCode} сонгох`}
                  checked={checked}
                  onChange={() => onToggleSelect(o.id)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/30"
                />
                <div>
                  <Link
                    href={`/admin/orders/detail?id=${o.id}`}
                    className="font-mono font-semibold text-brand hover:underline"
                  >
                    {o.orderCode}
                  </Link>
                  <p className="text-xs text-slate-400">
                    {formatDate(o.createdAt)} · {o.companyName}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <StatusBadge status={o.status} />
                {o.scheduledDate && !isFinalOrderStatus(o.status) && (
                  <span className="whitespace-nowrap rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-700">
                    📅 {o.scheduledDate}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-3 space-y-1 text-sm">
              <p className="text-navy">{o.receiverName}</p>
              <p className="text-slate-500">{o.receiverPhone}</p>
              <p className="text-slate-500">{o.receiverAddress}</p>
              <div className="flex justify-between pt-1 text-slate-600">
                <span>
                  Барааны үнэ: {o.codAmount.toLocaleString("mn-MN")}₮
                  {o.prepaid && (
                    <span className="ml-1.5 font-bold text-emerald-700">· тооцоогүй</span>
                  )}
                </span>
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
              <button
                onClick={() => onDelete(o)}
                aria-label={`${o.orderCode} устгах`}
                className="rounded-lg border border-red-200 px-3 py-2 text-xs text-red-500 transition hover:bg-red-50"
              >
                🗑
              </button>
            </div>
          </div>
          );
        })}
      </div>
    </>
  );
}
