"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import OrderDetailCard from "@/components/orders/OrderDetailCard";
import OrderStatusTimeline from "@/components/orders/OrderStatusTimeline";
import ActivityTimeline from "@/components/orders/ActivityTimeline";
import DriverStatusActions from "@/components/driver/DriverStatusActions";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import { subscribeOrder } from "@/lib/firebase/orders";
import type { Order } from "@/types";

function DriverOrderDetail() {
  const id = useSearchParams().get("id") ?? "";

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [notFound, setNotFound] = useState(!id);

  useEffect(() => {
    if (!id) return;
    const unsub = subscribeOrder(
      id,
      (o) => {
        setOrder(o);
        setNotFound(!o);
        setLoading(false);
      },
      () => {
        setNotFound(true);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [id]);

  if (loading) return <LoadingState />;
  if (notFound || !order) {
    return (
      <EmptyState icon="📦" title="Захиалга олдсонгүй" description="Буцаж дахин оролдоно уу." />
    );
  }

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.receiverAddress)}`;

  return (
    <div>
      <Link
        href="/driver/orders"
        className="text-sm font-medium text-slate-500 hover:text-brand"
      >
        ← Буцах
      </Link>

      {/* Том үндсэн товчнууд (driver — touch-friendly) */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <a
          href={`tel:${order.receiverPhone}`}
          className="flex items-center justify-center gap-2 rounded-2xl bg-green-600 py-4 text-base font-semibold text-white transition hover:bg-green-700"
        >
          📞 Залгах
        </a>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 text-base font-semibold text-white transition hover:bg-blue-700"
        >
          🗺️ Газрын зураг
        </a>
      </div>

      <div className="mt-4 space-y-4">
        <OrderDetailCard order={order} />
        <DriverStatusActions order={order} />
        <OrderStatusTimeline order={order} />
        <ActivityTimeline orderId={order.id} />
      </div>
    </div>
  );
}

export default function DriverOrderDetailPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <DriverOrderDetail />
    </Suspense>
  );
}
