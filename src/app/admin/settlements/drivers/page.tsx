"use client";

import { useEffect, useMemo, useState } from "react";
import DriverSettlementTable from "@/components/settlement/DriverSettlementTable";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import LoadingState from "@/components/ui/LoadingState";
import { useAuth } from "@/contexts/AuthContext";
import {
  approveDriverSettlement,
  rejectDriverSettlement,
  setDriverSettlementNote,
  subscribeDriverSettlements,
} from "@/lib/firebase/driverSettlement";
import { formatCurrency } from "@/lib/format";
import {
  DRIVER_SETTLEMENT_STATUS_LABELS,
  type DriverSettlement,
  type DriverSettlementStatus,
} from "@/types";

const STATUSES = Object.keys(DRIVER_SETTLEMENT_STATUS_LABELS) as DriverSettlementStatus[];

export default function AdminDriverSettlementsPage() {
  const { profile } = useAuth();

  const [items, setItems] = useState<DriverSettlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DriverSettlementStatus | "">("");

  useEffect(() => {
    const unsub = subscribeDriverSettlements(
      (list) => {
        setItems(list);
        setLoading(false);
      },
      () => {
        setError("Тооцоог ачаалахад алдаа гарлаа.");
        setLoading(false);
      },
    );
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((s) => {
      if (statusFilter && s.status !== statusFilter) return false;
      if (q && !s.driverName.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, search, statusFilter]);

  // Зөрүүтэй (анхаарал татах) тооцоонуудын тоо.
  const diffCount = useMemo(
    () => items.filter((s) => s.differenceAmount !== 0 && s.status !== "open").length,
    [items],
  );
  const pendingCount = useMemo(
    () => items.filter((s) => s.status === "submitted").length,
    [items],
  );

  async function run(id: string, fn: () => Promise<void>) {
    setBusyId(id);
    try {
      await fn();
    } catch {
      setError("Үйлдэл амжилтгүй боллоо.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Жолоочийн тооцоо</h1>
          <p className="mt-1 text-sm text-slate-500">
            Өдрийн COD тушаалт, зөрүү шалгах, батлах
          </p>
        </div>
        <div className="flex gap-2">
          <span className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Хүлээгдэж буй: <span className="font-bold">{pendingCount}</span>
          </span>
          <span className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
            Зөрүүтэй: <span className="font-bold">{diffCount}</span>
          </span>
        </div>
      </div>

      {/* Зөрүүний анхааруулга */}
      {diffCount > 0 && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          ⚠️ {diffCount} тооцоонд COD зөрүү илэрсэн байна. Шалгаж баталгаажуулна уу.
        </div>
      )}

      {/* Filter */}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Жолоочийн нэрээр хайх…"
          className="w-full max-w-sm rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-navy outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as DriverSettlementStatus | "")}
          className="w-full max-w-xs rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-navy outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
        >
          <option value="">Бүх төлөв</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {DRIVER_SETTLEMENT_STATUS_LABELS[s]}
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
            icon="🧾"
            title={search || statusFilter ? "Илэрц олдсонгүй" : "Тооцоо алга"}
            description="Жолооч өдөр хаахад энд харагдана."
          />
        ) : (
          <DriverSettlementTable
            settlements={filtered}
            busyId={busyId}
            onApprove={(id) =>
              run(id, () => approveDriverSettlement(id, profile?.uid ?? ""))
            }
            onReject={(id) => run(id, () => rejectDriverSettlement(id))}
            onSaveNote={(id, note) => run(id, () => setDriverSettlementNote(id, note))}
          />
        )}
      </div>

      <p className="mt-4 text-xs text-slate-400">
        Нийт зөрүү:{" "}
        {formatCurrency(items.reduce((sum, s) => sum + s.differenceAmount, 0))}
      </p>
    </div>
  );
}
