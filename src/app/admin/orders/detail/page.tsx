"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import AssignDriverModal from "@/components/admin/AssignDriverModal";
import OrderDetailCard from "@/components/orders/OrderDetailCard";
import OrderStatusTimeline from "@/components/orders/OrderStatusTimeline";
import ActivityTimeline from "@/components/orders/ActivityTimeline";
import EditOrderModal from "@/components/orders/EditOrderModal";
import CancelOrderModal from "@/components/orders/CancelOrderModal";
import OrderQRCode from "@/components/orders/OrderQRCode";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import { subscribeDrivers } from "@/lib/firebase/drivers";
import { subscribeOrder, updateOrderStatus } from "@/lib/firebase/orders";
import { ORDER_STATUS_LABELS, type Driver, type Order, type OrderStatus } from "@/types";

const STATUSES = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];

function AdminOrderDetail() {
  const id = useSearchParams().get("id") ?? "";

  const [order, setOrder] = useState<Order | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(!!id);
  const [notFound, setNotFound] = useState(!id);
  const [assignOpen, setAssignOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

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

  useEffect(() => {
    const unsub = subscribeDrivers((l) => setDrivers(l), () => {});
    return () => unsub();
  }, []);

  const activeDrivers = useMemo(() => drivers.filter((d) => d.isActive), [drivers]);

  if (loading) return <LoadingState />;
  if (notFound || !order) {
    return (
      <EmptyState icon="📦" title="Захиалга олдсонгүй" description="Буцаж дахин оролдоно уу." />
    );
  }

  return (
    <div className="max-w-3xl">
      <Link href="/admin/orders" className="text-sm font-medium text-slate-500 hover:text-brand">
        ← Захиалгууд
      </Link>

      <div className="mt-3 grid gap-4 lg:grid-cols-5 lg:items-start">
        <div className="space-y-4 lg:col-span-3">
          <OrderDetailCard order={order} />

          {/* Админ үйлдэл */}
          <Card>
            <h2 className="text-sm font-bold text-navy">Үйлдэл</h2>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
              <select
                value={order.status}
                onChange={(e) =>
                  updateOrderStatus(order.id, e.target.value as OrderStatus).catch(() => {})
                }
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-navy outline-none transition focus:border-brand"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {ORDER_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
              <Button variant="secondary" onClick={() => setAssignOpen(true)}>
                Жолооч оноох
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                ✏️ Засах
              </Button>
              {order.status !== "cancelled" && order.status !== "delivered" && (
                <Button variant="danger" size="sm" onClick={() => setCancelOpen(true)}>
                  Цуцлах
                </Button>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-2">
          {/* QR + waybill */}
          <Card>
            <div className="flex items-center gap-4">
              <OrderQRCode orderCode={order.orderCode} size={110} />
              <div>
                <p className="text-sm font-bold text-navy">QR / Waybill</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Уншуулбал tracking хуудас нээгдэнэ.
                </p>
                <Link
                  href={`/admin/orders/print?id=${order.id}`}
                  className="mt-2 inline-block rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-navy transition hover:bg-slate-50"
                >
                  🖨 Хэвлэх
                </Link>
              </div>
            </div>
          </Card>

          <OrderStatusTimeline order={order} />
          <ActivityTimeline orderId={order.id} />
        </div>
      </div>

      {assignOpen && (
        <AssignDriverModal
          order={order}
          drivers={activeDrivers}
          onClose={() => setAssignOpen(false)}
        />
      )}
      {editOpen && <EditOrderModal order={order} onClose={() => setEditOpen(false)} />}
      {cancelOpen && <CancelOrderModal order={order} onClose={() => setCancelOpen(false)} />}
    </div>
  );
}

export default function AdminOrderDetailPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <AdminOrderDetail />
    </Suspense>
  );
}
