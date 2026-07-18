"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AdminOrderTable from "@/components/admin/AdminOrderTable";
import AssignDriverModal from "@/components/admin/AssignDriverModal";
import DeleteOrderModal from "@/components/admin/DeleteOrderModal";
import BulkAssignModal from "@/components/admin/BulkAssignModal";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import LoadingState from "@/components/ui/LoadingState";
import { exportOrdersToExcel } from "@/lib/exportOrders";
import { dateKeyOf } from "@/lib/firebase/driverSettlement";
import { subscribeCompanies } from "@/lib/firebase/companies";
import { subscribeDrivers } from "@/lib/firebase/drivers";
import { subscribeOrders, updateOrderStatus } from "@/lib/firebase/orders";
import { isFinalOrderStatus } from "@/lib/status";
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
  const [dateFilter, setDateFilter] = useState("");

  const [assignOrder, setAssignOrder] = useState<Order | null>(null);
  const [deleteOrder, setDeleteOrder] = useState<Order | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [toast, setToast] = useState("");

  // Toast автомат арилгах.
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // Жолооч оноох — дууссан захиалгад зөвшөөрөхгүй (modal нээхгүй).
  function handleAssign(order: Order) {
    if (isFinalOrderStatus(order.status)) {
      setToast("Дууссан захиалгад жолооч дахин оноох боломжгүй.");
      return;
    }
    setAssignOrder(order);
  }

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
      if (dateFilter && dateKeyOf(new Date(o.createdAt)) !== dateFilter) return false;
      if (!q) return true;
      return (
        o.orderCode.toLowerCase().includes(q) ||
        o.receiverPhone.toLowerCase().includes(q) ||
        o.receiverName.toLowerCase().includes(q) ||
        o.companyName.toLowerCase().includes(q)
      );
    });
  }, [orders, search, statusFilter, companyFilter, driverFilter, dateFilter]);

  async function handleStatusChange(order: Order, status: OrderStatus) {
    try {
      await updateOrderStatus(order.id, status);
    } catch {
      setError("Статус шинэчлэхэд алдаа гарлаа.");
    }
  }

  // ─── Multi-select ───
  const selectedOrders = useMemo(
    () => orders.filter((o) => selectedIds.has(o.id)),
    [orders, selectedIds],
  );

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => {
      const allChosen = filtered.length > 0 && filtered.every((o) => prev.has(o.id));
      const next = new Set(prev);
      if (allChosen) {
        filtered.forEach((o) => next.delete(o.id));
      } else {
        filtered.forEach((o) => next.add(o.id));
      }
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function handleExport() {
    if (selectedOrders.length === 0) {
      setToast("Экспортлох захиалга сонгоно уу.");
      return;
    }
    exportOrdersToExcel(selectedOrders);
    setToast(`${selectedOrders.length} захиалга Excel рүү экспортлогдлоо.`);
  }

  function handleBulkDone(msg: string) {
    setBulkOpen(false);
    clearSelection();
    setToast(msg);
  }

  return (
    <div>
      <div className="flex flex-col gap-3 print:hidden sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Захиалгын удирдлага</h1>
          <p className="mt-1 text-sm text-slate-500">
            Бүх захиалгыг хянах, жолооч оноох, статус шинэчлэх
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-navy transition hover:bg-slate-50"
          >
            🖨 Хэвлэх ({filtered.length})
          </button>
          <Link
            href="/admin/orders/import"
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-center text-sm font-medium text-navy transition hover:bg-slate-50"
          >
            ⬆ Excel импорт
          </Link>
        </div>
      </div>

      {/* Хэвлэх үед л харагдах толгой — цаас хэнийх, хэзээнийх нь мэдэгдэнэ. */}
      <div className="hidden print:mb-3 print:block">
        <h1 className="text-lg font-bold text-navy">HurdExpress — Захиалгын жагсаалт</h1>
        <p className="mt-0.5 text-xs text-slate-600">
          {driverFilter
            ? `Жолооч: ${drivers.find((d) => d.id === driverFilter)?.name ?? "—"}`
            : "Жолооч: бүгд"}
          {" · "}
          {dateFilter ? `Огноо: ${dateFilter}` : "Огноо: бүх"}
          {" · "}
          Нийт: {filtered.length}
        </p>
      </div>

      {/* Хайлт + filters */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5 print:hidden">
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
        <div className="flex gap-2">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            aria-label="Огноогоор шүүх"
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-navy outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          {dateFilter && (
            <button
              type="button"
              onClick={() => setDateFilter("")}
              aria-label="Огноо цэвэрлэх"
              className="shrink-0 rounded-xl border border-slate-200 px-3 text-slate-400 transition hover:bg-slate-50 hover:text-navy"
            >
              ✕
            </button>
          )}
        </div>
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
            onAssign={handleAssign}
            onStatusChange={handleStatusChange}
            onDelete={setDeleteOrder}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
          />
        )}
      </div>

      {/* Bulk action bar — сонголт байгаа үед доороос гарна */}
      {selectedIds.size > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur lg:left-64">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-medium text-navy">
              {selectedIds.size} захиалга сонгогдсон
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={clearSelection}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-50"
              >
                Цэвэрлэх
              </button>
              <button
                onClick={handleExport}
                className="rounded-xl border border-navy px-4 py-2 text-sm font-semibold text-navy transition hover:bg-navy hover:text-white"
              >
                ⬇ Excel татах
              </button>
              <button
                onClick={() => setBulkOpen(true)}
                className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
              >
                🚚 Жолооч оноох
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteOrder && (
        <DeleteOrderModal
          order={deleteOrder}
          onClose={() => setDeleteOrder(null)}
          onDeleted={(o) => {
            setDeleteOrder(null);
            // Устгасан захиалга сонголтод үлдэхээс сэргийлнэ.
            setSelectedIds((prev) => {
              const next = new Set(prev);
              next.delete(o.id);
              return next;
            });
            setToast(o.orderCode + " захиалга устлаа.");
          }}
        />
      )}

      {assignOrder && (
        <AssignDriverModal
          order={assignOrder}
          drivers={activeDrivers}
          onClose={() => setAssignOrder(null)}
        />
      )}

      {bulkOpen && (
        <BulkAssignModal
          orders={selectedOrders}
          drivers={activeDrivers}
          onClose={() => setBulkOpen(false)}
          onDone={handleBulkDone}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-navy px-5 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
