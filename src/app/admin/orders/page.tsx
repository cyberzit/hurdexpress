"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AdminOrderTable from "@/components/admin/AdminOrderTable";
import AssignDriverModal from "@/components/admin/AssignDriverModal";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import LoadingState from "@/components/ui/LoadingState";
import { subscribeCompanies } from "@/lib/firebase/companies";
import { subscribeDrivers } from "@/lib/firebase/drivers";
import { subscribeOrders, updateOrderStatus } from "@/lib/firebase/orders";
import {
  ORDER_STATUS_LABELS,
  type Company,
  type Driver,
  type Order,
  type OrderStatus,
} from "@/types";

const STATUSES = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [driverFilter, setDriverFilter] = useState("");

  const [assignOrder, setAssignOrder] = useState<Order | null>(null);

  useEffect(() => {
    const unsub = subscribeOrders(
      (list) => {
        setOrders(list);
        setLoading(false);
      },
      () => {
        setError("Захиалгын жагсаалтыг ачаалахад алдаа гарлаа.");
        setLoading(false);
      },
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = subscribeCompanies((list) => setCompanies(list), () => {});
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = subscribeDrivers((list) => setDrivers(list), () => {});
    return () => unsub();
  }, []);

  const activeDrivers = useMemo(() => drivers.filter((d) => d.isActive), [drivers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter && o.status !== statusFilter) return false;
      if (companyFilter && o.companyId !== companyFilter) return false;
      if (driverFilter && o.driverId !== driverFilter) return false;
      if (!q) return true;
      return (
        o.orderCode.toLowerCase().includes(q) ||
        o.receiverPhone.toLowerCase().includes(q) ||
        o.receiverName.toLowerCase().includes(q) ||
        o.companyName.toLowerCase().includes(q)
      );
    });
  }, [orders, search, statusFilter, companyFilter, driverFilter]);

  async function handleStatusChange(order: Order, status: OrderStatus) {
    try {
      await updateOrderStatus(order.id, status);
    } catch {
      setError("Статус шинэчлэхэд алдаа гарлаа.");
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Захиалгын удирдлага</h1>
          <p className="mt-1 text-sm text-slate-500">
            Бүх захиалгыг хянах, жолооч оноох, статус шинэчлэх
          </p>
        </div>
        <Link
          href="/admin/orders/import"
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-center text-sm font-medium text-navy transition hover:bg-slate-50"
        >
          ⬆ Excel импорт
        </Link>
      </div>

      {/* Хайлт + filters */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Код, утас, нэр, байгууллага…"
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-navy outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as OrderStatus | "")}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-navy outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
        >
          <option value="">Бүх статус</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <select
          value={companyFilter}
          onChange={(e) => setCompanyFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-navy outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
        >
          <option value="">Бүх байгууллага</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={driverFilter}
          onChange={(e) => setDriverFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-navy outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
        >
          <option value="">Бүх жолооч</option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mt-4">
          <ErrorState message={error} />
        </div>
      )}

      {/* Контент */}
      <div className="mt-5">
        {loading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="📦"
            title={
              search || statusFilter || companyFilter || driverFilter
                ? "Илэрц олдсонгүй"
                : "Одоогоор захиалга алга"
            }
            description="Захиалгыг харилцагч байгууллага үүсгэдэг."
          />
        ) : (
          <AdminOrderTable
            orders={filtered}
            onAssign={(o) => setAssignOrder(o)}
            onStatusChange={handleStatusChange}
          />
        )}
      </div>

      {assignOrder && (
        <AssignDriverModal
          order={assignOrder}
          drivers={activeDrivers}
          onClose={() => setAssignOrder(null)}
        />
      )}
    </div>
  );
}
