"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import PrintableWaybill from "@/components/orders/PrintableWaybill";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import { subscribeOrder } from "@/lib/firebase/orders";
import type { Order } from "@/types";

function PrintInner() {
  const id = useSearchParams().get("id") ?? "";
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(!!id);

  useEffect(() => {
    if (!id) return;
    const unsub = subscribeOrder(
      id,
      (o) => {
        setOrder(o);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return () => unsub();
  }, [id]);

  if (loading) return <LoadingState />;
  if (!order) return <EmptyState icon="📦" title="Захиалга олдсонгүй" />;

  return (
    <div className="py-4">
      <PrintableWaybill order={order} />
    </div>
  );
}

export default function AdminOrderPrintPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <PrintInner />
    </Suspense>
  );
}
