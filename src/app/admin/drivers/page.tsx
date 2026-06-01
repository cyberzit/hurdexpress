"use client";

import { useEffect, useMemo, useState } from "react";
import DriverForm from "@/components/admin/DriverForm";
import DriverTable from "@/components/admin/DriverTable";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import LoadingState from "@/components/ui/LoadingState";
import { setDriverActive, subscribeDrivers } from "@/lib/firebase/drivers";
import {
  DRIVER_STATUS_LABELS,
  type Driver,
  type DriverStatus,
} from "@/types";

const STATUSES = Object.keys(DRIVER_STATUS_LABELS) as DriverStatus[];

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DriverStatus | "">("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeDrivers(
      (list) => {
        setDrivers(list);
        setLoading(false);
      },
      () => {
        setError("Жолооч нарын жагсаалтыг ачаалахад алдаа гарлаа.");
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return drivers.filter((d) => {
      if (statusFilter && d.currentStatus !== statusFilter) return false;
      if (!q) return true;
      return (
        d.name.toLowerCase().includes(q) || d.phone.toLowerCase().includes(q)
      );
    });
  }, [drivers, search, statusFilter]);

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(driver: Driver) {
    setEditing(driver);
    setFormOpen(true);
  }

  async function toggleActive(driver: Driver) {
    try {
      await setDriverActive(driver.id, !driver.isActive);
    } catch {
      setError("Төлөв солиход алдаа гарлаа.");
    }
  }

  return (
    <div>
      {/* Толгой */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Жолооч нар</h1>
          <p className="mt-1 text-sm text-slate-500">Хүргэлтийн жолооч нарын бүртгэл</p>
        </div>
        <button
          onClick={openAdd}
          className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
        >
          + Шинэ жолооч нэмэх
        </button>
      </div>

      {/* Хайлт + filter */}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Нэр эсвэл утсаар хайх…"
          className="w-full max-w-sm rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-navy outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as DriverStatus | "")}
          className="w-full max-w-xs rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-navy outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
        >
          <option value="">Бүх төлөв</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {DRIVER_STATUS_LABELS[s]}
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
            icon="🚚"
            title={search || statusFilter ? "Илэрц олдсонгүй" : "Одоогоор жолооч алга"}
            description={
              search || statusFilter
                ? "Шүүлтүүрээ өөрчилж үзнэ үү."
                : "Дээрх товчоор шинэ жолооч нэмнэ үү."
            }
          />
        ) : (
          <DriverTable
            drivers={filtered}
            onEdit={openEdit}
            onToggleActive={toggleActive}
          />
        )}
      </div>

      {formOpen && <DriverForm initial={editing} onClose={() => setFormOpen(false)} />}
    </div>
  );
}
