"use client";

import { useEffect, useMemo, useState } from "react";
import PartnerKpiCards from "@/components/kpi/PartnerKpiCards";
import PartnerKpiTable from "@/components/kpi/PartnerKpiTable";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import LoadingState from "@/components/ui/LoadingState";
import { subscribeCompanies } from "@/lib/firebase/companies";
import { getOrdersInRange } from "@/lib/firebase/orders";
import { currentMonthKey, monthRange } from "@/lib/kpi";
import { buildPartnerKpis } from "@/lib/partnerKpi";
import type { Company, Order } from "@/types";

export default function AdminPartnerKpiPage() {
  const [month, setMonth] = useState(currentMonthKey);
  const [companyId, setCompanyId] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadedMonth, setLoadedMonth] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = subscribeCompanies((l) => setCompanies(l), () => {});
    return () => unsub();
  }, []);

  useEffect(() => {
    let active = true;
    const { start, end } = monthRange(month);
    getOrdersInRange(start, end)
      .then((list) => {
        if (active) {
          setOrders(list);
          setError("");
        }
      })
      .catch(() => active && setError("KPI ачаалахад алдаа гарлаа."))
      .finally(() => active && setLoadedMonth(month));
    return () => {
      active = false;
    };
  }, [month]);

  const kpis = useMemo(() => {
    const filtered = companyId
      ? orders.filter((o) => o.companyId === companyId)
      : orders;
    return buildPartnerKpis(filtered, month);
  }, [orders, companyId, month]);

  const loading = loadedMonth !== month;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Харилцагчийн KPI</h1>
          <p className="mt-1 text-sm text-slate-500">
            Дэлгүүр бүрийн хүргэлтийн гүйцэтгэл, амжилтын хувь, COD
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-navy outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
          >
            <option value="">Бүх харилцагч</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-navy outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>
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
      ) : kpis.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon="📊" title="Энэ сард өгөгдөл алга" description="Тухайн сард захиалга байхгүй." />
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {!companyId && <PartnerKpiCards kpis={kpis} />}
          <PartnerKpiTable kpis={kpis} month={month} />
        </div>
      )}
    </div>
  );
}
