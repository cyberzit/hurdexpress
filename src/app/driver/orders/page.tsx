"use client";

import { useEffect, useMemo, useState } from "react";
import DriverOrderCard from "@/components/driver/DriverOrderCard";
import LocationShareToggle from "@/components/driver/LocationShareToggle";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import LoadingState from "@/components/ui/LoadingState";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeOrdersByDriver } from "@/lib/firebase/orders";
import { ORDER_STATUS_LABELS, type Order, type OrderStatus } from "@/types";

// Жолоочид хамаатай статусууд.
const DRIVER_STATUSES: OrderStatus[] = [
  "assigned",
  "picked_up",
  "on_the_way",
  "delivered",
  "failed",
];

export default function DriverOrdersPage() {
  const { user, profile } = useAuth();
  const driverId = profile?.driverId ?? user?.uid ?? "";

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");

  useEffect(() => {
    if (!driverId) return;
    const unsub = subscribeOrdersByDriver(
      driverId,
      (list) => {
        setOrders(list);
        setLoading(false);
      },
      () => {
        setError("Захиалгуудыг ачаалахад алдаа гарлаа.");
        setLoading(false);
      },
    );
    return () => unsub();
  }, [driverId]);

  const filtered = useMemo(() => {
    if (!statusFilter) return orders;
    return orders.filter((o) => o.status === statusFilter);
  }, [orders, statusFilter]);

  const hasActiveOrders = useMemo(
    () => orders.some((o) => DRIVER_STATUSES.includes(o.status) && o.status !== "delivered" && o.status !== "failed"),
    [orders],
  );

  return (
    <div>
      <h1 className="text-xl font-bold text-navy">Миний хүргэлтүүд</h1>

      {/* Байршил хуваалцах */}
      {driverId && (
        <div className="mt-3">
          <LocationShareToggle
            driverId={driverId}
            driverName={profile?.name ?? ""}
            hasActiveOrders={hasActiveOrders}
          />
        </div>
      )}

      {/* Статус filter — chip-үүд */}
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setStatusFilter("")}
          className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition ${
            statusFilter === "" ? "bg-navy text-white" : "bg-white text-slate-500 border border-slate-200"
          }`}
        >
          Бүгд
        </button>
        {DRIVER_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition ${
              statusFilter === s
                ? "bg-navy text-white"
                : "border border-slate-200 bg-white text-slate-500"
            }`}
          >
            {ORDER_STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-4">
          <ErrorState message={error} />
        </div>
      )}

      <div className="mt-4">
        {loading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="🚚"
            title={
              statusFilter ? "Энэ статустай захиалга алга" : "Танд оноогдсон захиалга алга"
            }
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((o) => (
              <DriverOrderCard key={o.id} order={o} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
