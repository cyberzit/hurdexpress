"use client";

import { useEffect, useMemo, useState } from "react";
import DriverKpiCards from "@/components/kpi/DriverKpiCards";
import DriverKpiTable from "@/components/kpi/DriverKpiTable";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import LoadingState from "@/components/ui/LoadingState";
import { getOrdersInRange } from "@/lib/firebase/orders";
import { subscribeDriverSettlements } from "@/lib/firebase/driverSettlement";
import { subscribeSettings } from "@/lib/settings";
import {
  buildDriverKpis,
  buildHighlights,
  currentMonthKey,
  monthRange,
} from "@/lib/kpi";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import type { DriverSettlement, GeneralSettings, Order } from "@/types";

export default function AdminDriverKpiPage() {
  const [month, setMonth] = useState(currentMonthKey);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settlements, setSettlements] = useState<DriverSettlement[]>([]);
  const [settings, setSettings] = useState<GeneralSettings | null>(null);
  const [loadedMonth, setLoadedMonth] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Тохиргоо + бүх жолоочийн тооцоо (realtime).
  useEffect(() => {
    const u1 = subscribeSettings((s) => setSettings(s));
    const u2 = subscribeDriverSettlements((l) => setSettlements(l));
    return () => {
      u1();
      u2();
    };
  }, []);

  // Сонгосон сарын захиалгууд.
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

  const settings_ = settings ?? (DEFAULT_SETTINGS as GeneralSettings);

  const monthSettlements = useMemo(() => {
    const { start, end } = monthRange(month);
    const s = start.getTime();
    const e = end.getTime();
    return settlements.filter((x) => x.date >= s && x.date <= e);
  }, [settlements, month]);

  const kpis = useMemo(
    () => buildDriverKpis(orders, monthSettlements, settings_, month),
    [orders, monthSettlements, settings_, month],
  );
  const highlights = useMemo(() => buildHighlights(kpis), [kpis]);

  const loading = loadedMonth !== month;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Жолоочийн KPI</h1>
          <p className="mt-1 text-sm text-slate-500">
            Сарын бүтээмж, амжилтын хувь, автомат цалин
          </p>
        </div>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-navy outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
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
      ) : kpis.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon="📊" title="Энэ сард өгөгдөл алга" description="Тухайн сард жолоочид оноогдсон захиалга байхгүй." />
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          <DriverKpiCards highlights={highlights} />
          <DriverKpiTable kpis={kpis} month={month} />
        </div>
      )}
    </div>
  );
}
