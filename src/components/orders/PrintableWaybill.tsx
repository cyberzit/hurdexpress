"use client";

import OrderQRCode from "@/components/orders/OrderQRCode";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Order } from "@/types";

// A6 хэмжээтэй наадаг хүргэлтийн хуудас. admin/partner print дээр утас бүтэн.
export default function PrintableWaybill({ order }: { order: Order }) {
  const item = order.productName || order.itemName || "—";

  return (
    <div className="mx-auto max-w-[105mm]">
      {/* Наалтын хуудасны хэмжээ — зөвхөн энэ хуудсанд A6 (globals.css нь A4). */}
      <style>{"@media print{@page{size:A6;margin:6mm}}"}</style>

      {/* Хэвлэх товч — print дээр харагдахгүй */}
      <div className="mb-4 flex justify-end print:hidden">
        <button
          onClick={() => window.print()}
          className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
        >
          🖨 Хэвлэх
        </button>
      </div>

      {/* Waybill — A6 label */}
      <div className="rounded-lg border border-slate-300 bg-white p-4 text-navy print:rounded-none print:border-0">
        {/* Толгой */}
        <div className="flex items-start justify-between border-b border-slate-300 pb-2">
          <div>
            <p className="text-base font-bold">
              Hurd<span className="text-brand">Express</span>
            </p>
            <p className="text-[10px] text-slate-500">Хүргэлтийн хуудас</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-lg font-bold">{order.orderCode}</p>
            <p className="text-[10px] text-slate-500">{formatDate(order.createdAt)}</p>
          </div>
        </div>

        {/* QR + дэлгүүр */}
        <div className="mt-3 flex items-center gap-3">
          <OrderQRCode orderCode={order.orderCode} size={96} />
          <div className="text-xs">
            <p className="text-slate-500">Дэлгүүр</p>
            <p className="font-semibold">{order.companyName}</p>
          </div>
        </div>

        {/* Хүлээн авагч */}
        <div className="mt-3 border-t border-slate-200 pt-2 text-sm">
          <p className="text-[10px] uppercase text-slate-400">Хүлээн авагч</p>
          <p className="font-semibold">{order.receiverName}</p>
          <p>{order.receiverPhone}</p>
          <p className="text-slate-600">{order.receiverAddress}</p>
        </div>

        {/* Бараа */}
        <div className="mt-2 border-t border-slate-200 pt-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Бараа</span>
            <span className="font-medium">{item}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Тоо</span>
            <span className="font-medium">{order.qty}</span>
          </div>
        </div>

        {/* Дүн */}
        <div className="mt-2 border-t border-slate-200 pt-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Барааны үнэ</span>
            <span className="font-semibold">{formatCurrency(order.codAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Хүргэлт</span>
            <span>{formatCurrency(order.deliveryPrice)}</span>
          </div>
          {(order.discount ?? 0) > 0 && (
            <div className="flex justify-between">
              <span className="text-slate-500">Хөнгөлөлт</span>
              <span>−{formatCurrency(order.discount ?? 0)}</span>
            </div>
          )}
          <div className="mt-1 flex justify-between border-t border-slate-200 pt-1">
            <span className="font-medium">Нийт</span>
            <span className="font-bold">{formatCurrency(order.totalAmount)}</span>
          </div>
        </div>

        {order.note && (
          <div className="mt-2 border-t border-slate-200 pt-2 text-xs">
            <span className="text-slate-500">Тэмдэглэл: </span>
            {order.note}
          </div>
        )}
      </div>
    </div>
  );
}
