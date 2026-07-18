"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import PartnerOrderTable from "@/components/partner/PartnerOrderTable";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import LoadingState from "@/components/ui/LoadingState";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeOrdersByCompany } from "@/lib/firebase/orders";
import {
  ORDER_STATUS_LABELS,
  type Order,
  type OrderStatus,
} from "@/types";

const STATUSES = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];

export default function PartnerOrdersPage() {
  const { profile } = useAuth();
  const companyId = profile?.companyId ?? "";

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");

  useEffect(() => {
    if (!companyId) return;
    const unsub = subscribeOrdersByCompany(
      companyId,
      (list) => {
        setOrders(list);
        setLoading(false);
      },
      () => {
        setError("Захиалгуудыг ачаалахад алдаа гарлаа.");
        setLoading(false);
      },
    );
    return () => unsub();
  }, [companyId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter && o.status !== statusFilter) return false;
      if (!q) return true;
      return (
        o.orderCode.toLowerCase().includes(q) ||
        o.receiverPhone.toLowerCase().includes(q)
      );
    });
  }, [orders, search, statusFilter]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Миний захиалгууд</h1>
          <p className="mt-1 text-sm text-slate-500">Танай байгууллагын захиалгууд</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Загварыг ил гаргана — модал дотор нуувал хэрэглэгч олдоггүй. */}
          <a
            href="/templates/hurdexpress-orders-template.xlsx"
            download
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-center text-sm font-medium text-navy transition hover:bg-slate-50"
          >
            ⬇ Excel загвар татах
          </a>
          <Link
            href="/partner/orders/import"
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-center text-sm font-medium text-navy transition hover:bg-slate-50"
          >
            ⬆ Олон захиалга оруулах
          </Link>
          <Link
            href="/partner/orders/new"
            className="rounded-xl bg-brand px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
          >
            + Шинэ захиалга
          </Link>
        </div>
      </div>

      {/* Хайлт + filter */}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Код эсвэл утсаар хайх…"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-navy outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 sm:max-w-xs"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as OrderStatus | "")}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-navy outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 sm:max-w-xs"
        >
          <option value="">Бүх статус</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mt-4">
          <ErrorState message={error} />
        </div>
      )}

      <div className="mt-5">
        {loading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="📦"
            title={search || statusFilter ? "Илэрц олдсонгүй" : "Одоогоор захиалга алга"}
            description={
              search || statusFilter
                ? "Шүүлтүүрээ өөрчилж үзнэ үү."
                : "«Шинэ захиалга» товчоор захиалга үүсгэнэ үү."
            }
          />
        ) : (
          <PartnerOrderTable orders={filtered} />
        )}
      </div>
    </div>
  );
}
