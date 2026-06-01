"use client";

import { useEffect, useMemo, useState } from "react";
import StatCard from "@/components/admin/StatCard";
import DashboardStatusSummary from "@/components/admin/DashboardStatusSummary";
import RecentOrders from "@/components/admin/RecentOrders";
import ErrorState from "@/components/ui/ErrorState";
import LoadingState from "@/components/ui/LoadingState";
import { subscribeCompanies } from "@/lib/firebase/companies";
import { subscribeDrivers } from "@/lib/firebase/drivers";
import { subscribeOrders } from "@/lib/firebase/orders";
import { buildDashboardStats, buildStatusBreakdown } from "@/lib/dashboard";
import type { Company, Driver, Order } from "@/types";

const mnt = (n: number) => `${n.toLocaleString("mn-MN")}₮`;

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [ordersLoaded, setOrdersLoaded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = subscribeOrders(
      (list) => {
        setOrders(list);
        setOrdersLoaded(true);
      },
      () => {
        setError("Дата ачаалахад алдаа гарлаа.");
        setOrdersLoaded(true);
      },
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    const u1 = subscribeCompanies((l) => setCompanies(l), () => {});
    const u2 = subscribeDrivers((l) => setDrivers(l), () => {});
    return () => {
      u1();
      u2();
    };
  }, []);

  const stats = useMemo(
    () => buildDashboardStats(orders, companies, drivers),
    [orders, companies, drivers],
  );
  const breakdown = useMemo(() => buildStatusBreakdown(orders), [orders]);
  const recent = useMemo(() => orders.slice(0, 10), [orders]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Хяналтын самбар</h1>
      <p className="mt-1 text-sm text-slate-500">Өнөөдрийн үзүүлэлтүүд</p>

      {error && (
        <div className="mt-4">
          <ErrorState message={error} />
        </div>
      )}

      {!ordersLoaded ? (
        <div className="mt-6">
          <LoadingState />
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Өнөөдрийн захиалга" value={String(stats.todayOrders)} icon="📦" accent="orange" />
            <StatCard title="Хүлээгдэж буй" value={String(stats.pending)} icon="⏳" accent="amber" />
            <StatCard title="Хүргэлтэнд явж буй" value={String(stats.inTransit)} icon="🚚" accent="blue" />
            <StatCard title="Амжилттай хүргэгдсэн" value={String(stats.delivered)} icon="✅" accent="green" />
            <StatCard title="Өнөөдрийн COD дүн" value={mnt(stats.codTotal)} icon="💵" accent="navy" />
            <StatCard title="Өнөөдрийн хүргэлтийн орлого" value={mnt(stats.revenue)} icon="📈" accent="orange" />
            <StatCard title="Идэвхтэй харилцагч" value={String(stats.activeCompanies)} icon="🏢" accent="slate" />
            <StatCard title="Идэвхтэй жолооч" value={String(stats.activeDrivers)} icon="🧑‍✈️" accent="slate" />
          </div>

          {/* Summary + recent */}
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <DashboardStatusSummary total={breakdown.total} counts={breakdown.counts} />
            </div>
            <div className="lg:col-span-2">
              <RecentOrders orders={recent} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
