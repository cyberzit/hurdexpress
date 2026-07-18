"use client";

import { useEffect, useMemo, useState } from "react";
import AdminCompanyReportFilters from "@/components/admin/reports/AdminCompanyReportFilters";
import AdminCompanyReportPdfButton from "@/components/admin/reports/AdminCompanyReportPdfButton";
import AdminCompanyReportSummary from "@/components/admin/reports/AdminCompanyReportSummary";
import AdminCompanyReportTable from "@/components/admin/reports/AdminCompanyReportTable";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import LoadingState from "@/components/ui/LoadingState";
import { subscribeCompanies } from "@/lib/firebase/companies";
import { subscribeOrdersByCompany } from "@/lib/firebase/orders";
import {
  defaultAdminFilters,
  filterOrders,
  sortOrders,
  summarize,
  uniqueDrivers,
  type ReportFilters,
  type SortDir,
  type SortKey,
} from "@/lib/adminCompanyReport";
import { ORDER_STATUS_LABELS, type Company, type Order } from "@/types";

export default function AdminReportsPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [filters, setFilters] = useState<ReportFilters>(defaultAdminFilters);
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const companyId = filters.companyId ?? "";

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const unsub = subscribeCompanies(
      (list) => setCompanies(list),
      () => setError("Байгууллагуудыг ачаалахад алдаа гарлаа."),
    );
    return () => unsub();
  }, []);

  // Байгууллага сонгосон үед л захиалга татна.
  // where("companyId","==",…) — нэг талбарын шүүлт тул composite index шаардлагагүй.
  useEffect(() => {
    if (!companyId) return;
    const unsub = subscribeOrdersByCompany(
      companyId,
      (list) => {
        setOrders(list);
        setLoadingOrders(false);
      },
      () => {
        setError("Захиалгыг ачаалахад алдаа гарлаа.");
        setLoadingOrders(false);
      },
    );
    return () => unsub();
  }, [companyId]);

  const companyName = companies.find((c) => c.id === companyId)?.name ?? "";
  // Subscription солигдох хооронд өмнөх байгууллагын мөр харагдахаас сэргийлнэ.
  const scoped = useMemo(
    () => (companyId ? orders.filter((o) => o.companyId === companyId) : []),
    [orders, companyId],
  );
  const drivers = useMemo(() => uniqueDrivers(scoped), [scoped]);

  // Шүүлтүүрт таарсан БҮХ мөр — PDF энэ жагсаалтыг бүтнээр нь авна.
  const filtered = useMemo(() => filterOrders(scoped, filters), [scoped, filters]);
  const sorted = useMemo(
    () => sortOrders(filtered, sortKey, sortDir),
    [filtered, sortKey, sortDir],
  );
  const summary = useMemo(() => summarize(filtered), [filtered]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageRows = useMemo(
    () => sorted.slice((safePage - 1) * pageSize, safePage * pageSize),
    [sorted, safePage, pageSize],
  );

  function changeFilters(next: ReportFilters) {
    // Байгууллага солиход өмнөх өгөгдлийг цэвэрлэж, ачаалж дуустал loading харуулна.
    if ((next.companyId ?? "") !== companyId) {
      setOrders([]);
      setLoadingOrders(Boolean(next.companyId));
    }
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Харилцагч байгууллагын тайлан</h1>
          <p className="mt-1 text-sm text-slate-500">
            Сонгосон байгууллагын захиалгын дэлгэрэнгүй тайлан
          </p>
        </div>
        <AdminCompanyReportPdfButton
          disabled={sorted.length === 0}
          onError={setToast}
          build={() => ({
            orders: sorted, // pagination-аас хамаарахгүй
            companyName: companyName || "—",
            start: filters.start,
            end: filters.end,
            driverName: filters.driverId
              ? (drivers.find((d) => d.id === filters.driverId)?.name ?? "—")
              : "Бүх жолооч",
            statusLabel: filters.status ? ORDER_STATUS_LABELS[filters.status] : "Бүх статус",
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

      <AdminCompanyReportFilters
        value={filters}
        companies={companies}
        drivers={drivers}
        onChange={changeFilters}
      />

      {!companyId ? (
        <EmptyState
          icon="🏢"
          title="Тайлан харахын тулд харилцагч байгууллага сонгоно уу"
          description="Дээрх жагсаалтаас байгууллагаа сонгосны дараа захиалгын тайлан гарч ирнэ."
        />
      ) : loadingOrders ? (
        <LoadingState />
      ) : (
        <>
          <AdminCompanyReportSummary
            summary={summary}
            companyName={companyName}
            start={filters.start}
            end={filters.end}
          />

          {sorted.length === 0 ? (
            <EmptyState
              icon="📄"
              title="Сонгосон нөхцөлд захиалга алга"
              description="Огноо, жолооч, статусаа өөрчилж үзнэ үү."
            />
          ) : (
            <AdminCompanyReportTable
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
        </>
      )}
    </div>
  );
}
