"use client";

import { useEffect, useMemo, useState } from "react";
import ReportCards from "@/components/admin/ReportCards";
import ReportFilters from "@/components/admin/ReportFilters";
import ReportTables from "@/components/admin/ReportTables";
import ErrorState from "@/components/ui/ErrorState";
import LoadingState from "@/components/ui/LoadingState";
import { subscribeCompanies } from "@/lib/firebase/companies";
import { subscribeDrivers } from "@/lib/firebase/drivers";
import { getOrdersInRange } from "@/lib/firebase/orders";
import {
  buildCompanyReport,
  buildDailyReport,
  buildDriverReport,
  buildSummary,
  computeRange,
  type DateRangeKey,
} from "@/lib/reports";
import type { Company, Driver, Order, OrderStatus } from "@/types";

export default function ReportsPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadedSig, setLoadedSig] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Filters
  const [rangeKey, setRangeKey] = useState<DateRangeKey>("month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [status, setStatus] = useState<OrderStatus | "">("");

  // Filter dropdown-уудын жагсаалт
  useEffect(() => {
    const u1 = subscribeCompanies((l) => setCompanies(l), () => {});
    const u2 = subscribeDrivers((l) => setDrivers(l), () => {});
    return () => {
      u1();
      u2();
    };
  }, []);

  // Огнооны муж бүрэн эсэх (custom бол 2 огноо шаардлагатай).
  const rangeSig =
    rangeKey === "custom" && (!customStart || !customEnd)
      ? ""
      : `${rangeKey}|${customStart}|${customEnd}`;

  // loading-г синхрон setState-гүйгээр derived байдлаар тооцно.
  const loading = rangeSig !== "" && loadedSig !== rangeSig;

  // Огнооны мужид багтах захиалгууд (муж өөрчлөгдөхөд дахин татна)
  useEffect(() => {
    if (!rangeSig) return;
    let active = true;
    const { start, end } = computeRange(rangeKey, customStart, customEnd);
    getOrdersInRange(start, end)
      .then((list) => {
        if (active) {
          setOrders(list);
          setError("");
        }
      })
      .catch(() => {
        if (active) setError("Тайланг ачаалахад алдаа гарлаа.");
      })
      .finally(() => {
        if (active) setLoadedSig(rangeSig);
      });
    return () => {
      active = false;
    };
  }, [rangeSig, rangeKey, customStart, customEnd]);

  // Company/driver/status — client талд шүүнэ
  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (companyId && o.companyId !== companyId) return false;
      if (driverId && o.driverId !== driverId) return false;
      if (status && o.status !== status) return false;
      return true;
    });
  }, [orders, companyId, driverId, status]);

  const summary = useMemo(() => buildSummary(filtered), [filtered]);
  const companyRows = useMemo(() => buildCompanyReport(filtered), [filtered]);
  const driverRows = useMemo(() => buildDriverReport(filtered), [filtered]);
  const dailyRows = useMemo(() => buildDailyReport(filtered), [filtered]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Тайлан</h1>
      <p className="mt-1 text-sm text-slate-500">Захиалга, орлого, гүйцэтгэлийн тайлан</p>

      <div className="mt-5">
        <ReportFilters
          rangeKey={rangeKey}
          setRangeKey={setRangeKey}
          customStart={customStart}
          setCustomStart={setCustomStart}
          customEnd={customEnd}
          setCustomEnd={setCustomEnd}
          companies={companies}
          companyId={companyId}
          setCompanyId={setCompanyId}
          drivers={drivers}
          driverId={driverId}
          setDriverId={setDriverId}
          status={status}
          setStatus={setStatus}
        />
      </div>

      {error && (
        <div className="mt-4">
          <ErrorState message={error} />
        </div>
      )}

      {loading ? (
        <div className="mt-6">
          <LoadingState />
        </div>
      ) : (
        <>
          <div className="mt-6">
            <ReportCards summary={summary} />
          </div>
          <div className="mt-6">
            <ReportTables
              companyRows={companyRows}
              driverRows={driverRows}
              dailyRows={dailyRows}
            />
          </div>
        </>
      )}
    </div>
  );
}
