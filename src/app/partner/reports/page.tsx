"use client";

import { useEffect, useMemo, useState } from "react";
import PartnerReportFilters from "@/components/partner/reports/PartnerReportFilters";
import PartnerReportPdfButton from "@/components/partner/reports/PartnerReportPdfButton";
import PartnerReportSummary from "@/components/partner/reports/PartnerReportSummary";
import ReportTable from "@/components/reports/ReportTable";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import LoadingState from "@/components/ui/LoadingState";
import { useAuth } from "@/contexts/AuthContext";
import { getCompany } from "@/lib/firebase/companies";
import { subscribeOrdersByCompany } from "@/lib/firebase/orders";
import {
  defaultFilters,
  filterOrders,
  sortOrders,
  summarize,
  uniqueDrivers,
  type ReportFilters,
  type SortDir,
  type SortKey,
} from "@/lib/orderReport";
import { ORDER_STATUS_LABELS, type Order } from "@/types";

export default function PartnerReportsPage() {
  const { profile } = useAuth();
  // companyId нь ЗӨВХӨН нэвтэрсэн хэрэглэгчийн профайлаас — URL/параметрээр солих боломжгүй.
  const companyId = profile?.companyId ?? "";

  const [companyName, setCompanyName] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [filters, setFilters] = useState<ReportFilters>(defaultFilters);
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!companyId) return;
    getCompany(companyId)
      .then((c) => setCompanyName(c?.name ?? ""))
      .catch(() => {});
  }, [companyId]);

  useEffect(() => {
    if (!companyId) return;
    // where("companyId","==",companyId) — өөр байгууллагын өгөгдөл татагдахгүй.
    const unsub = subscribeOrdersByCompany(
      companyId,
      (list) => {
        setOrders(list);
        setLoading(false);
      },
      () => {
        setError("Захиалгыг ачаалахад алдаа гарлаа.");
        setLoading(false);
      },
    );
    return () => unsub();
  }, [companyId]);

  const drivers = useMemo(() => uniqueDrivers(orders), [orders]);

  // Шүүлтүүрт таарсан БҮХ мөр — PDF энэ жагсаалтыг бүтнээр нь авна.
  const filtered = useMemo(() => filterOrders(orders, filters), [orders, filters]);
  const sorted = useMemo(
    () => sortOrders(filtered, sortKey, sortDir),
    [filtered, sortKey, sortDir],
  );
  const summary = useMemo(() => summarize(filtered), [filtered]);

  // Шүүлтүүр/эрэмбэ солигдоход хуудсыг эхэнд нь буцаана.
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageRows = useMemo(
    () => sorted.slice((safePage - 1) * pageSize, safePage * pageSize),
    [sorted, safePage, pageSize],
  );

  function changeFilters(next: ReportFilters) {
    setFilters(next);
    setPage(1);
  }

  function toggleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "date" ? "desc" : "asc");
    }
    setPage(1);
  }

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Захиалгын тайлан</h1>
          <p className="mt-1 text-sm text-slate-500">{companyName}</p>
        </div>
        <PartnerReportPdfButton
          disabled={sorted.length === 0}
          onError={setToast}
          build={() => ({
            orders: sorted, // pagination-аас хамаарахгүй — бүх мөр
            companyName: companyName || "—",
            start: filters.start,
            end: filters.end,
            driverName: filters.driverId
              ? (drivers.find((d) => d.id === filters.driverId)?.name ?? "—")
              : "Бүх жолооч",
            statusLabel: filters.status
              ? ORDER_STATUS_LABELS[filters.status]
              : "Бүх статус",
            summary,
          })}
        />
      </div>

      {toast && (
        <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600">
          {toast}
        </p>
      )}

      {error && <ErrorState message={error} />}

      <PartnerReportFilters value={filters} drivers={drivers} onChange={changeFilters} />

      <PartnerReportSummary summary={summary} />

      {sorted.length === 0 ? (
        <EmptyState
          icon="📄"
          title="Сонгосон нөхцөлд захиалга алга"
          description="Огноо, жолооч, статусаа өөрчилж үзнэ үү."
        />
      ) : (
        <ReportTable
          rows={pageRows}
          totalRows={sorted.length}
          goodsTotal={summary.goodsTotal}
          page={safePage}
          pageSize={pageSize}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={toggleSort}
          onPage={setPage}
          onPageSize={(s) => {
            setPageSize(s);
            setPage(1);
          }}
        />
      )}
    </div>
  );
}
