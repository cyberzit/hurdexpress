"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import OrderDetailCard from "@/components/orders/OrderDetailCard";
import OrderStatusTimeline from "@/components/orders/OrderStatusTimeline";
import EditOrderModal from "@/components/orders/EditOrderModal";
import CancelOrderModal from "@/components/orders/CancelOrderModal";
import OrderQRCode from "@/components/orders/OrderQRCode";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import GoogleMapProvider from "@/components/maps/GoogleMapProvider";
import DriverMarkerMap from "@/components/maps/DriverMarkerMap";
import { subscribeOrder } from "@/lib/firebase/orders";
import { formatDateTime } from "@/lib/format";
import type { Order } from "@/types";

export default function PartnerOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
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

  if (loading) return <LoadingState />;
  if (notFound || !order) {
    return (
      <EmptyState icon="📦" title="Захиалга олдсонгүй" description="Буцаж дахин оролдоно уу." />
    );
  }

  const loc = order.lastDriverLocation;

  return (
    <div>
      <Link href="/partner/orders" className="text-sm font-medium text-slate-500 hover:text-brand">
        ← Миний захиалгууд
      </Link>

      <div className="mt-3 space-y-4">
        <OrderDetailCard order={order} />

        {/* Pending үед л засах/цуцлах */}
        {order.status === "pending" && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              ✏️ Засах
            </Button>
            <Button variant="danger" onClick={() => setCancelOpen(true)}>
              Цуцлах
            </Button>
          </div>
        )}

        {/* Жолоочийн байршил — зөвхөн замдаа яваа үед */}
        {order.status === "on_the_way" && (
          <Card>
            <p className="text-sm font-semibold text-navy">🚚 Жолоочийн байршил</p>
            {loc ? (
              <>
                <p className="mt-1 font-mono text-xs text-slate-500">
                  {loc.lat.toFixed(5)}, {loc.lng.toFixed(5)} ({formatDateTime(loc.updatedAt)})
                </p>
                <div className="mt-3">
                  <GoogleMapProvider
                    fallback={
                      <a
                        href={`https://www.google.com/maps?q=${loc.lat},${loc.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
                      >
                        Газрын зураг дээр харах
                      </a>
                    }
                  >
                    <DriverMarkerMap
                      height="260px"
                      markers={[
                        {
                          id: order.driverId ?? "driver",
                          lat: loc.lat,
                          lng: loc.lng,
                          title: order.driverName ?? "Жолооч",
                          updatedAt: loc.updatedAt,
                        },
                      ]}
                    />
                  </GoogleMapProvider>
                </div>
              </>
            ) : (
              <p className="mt-1 text-sm text-slate-500">Жолооч байршил хуваалцаагүй байна.</p>
            )}
          </Card>
        )}

        {/* QR + waybill */}
        <Card>
          <div className="flex items-center gap-4">
            <OrderQRCode orderCode={order.orderCode} size={110} />
            <div>
              <p className="text-sm font-bold text-navy">QR / Waybill</p>
              <Link
                href={`/partner/orders/${order.id}/print`}
                className="mt-2 inline-block rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-navy transition hover:bg-slate-50"
              >
                🖨 Хэвлэх
              </Link>
            </div>
          </div>
        </Card>

        <OrderStatusTimeline order={order} />
      </div>

      {editOpen && <EditOrderModal order={order} onClose={() => setEditOpen(false)} />}
      {cancelOpen && <CancelOrderModal order={order} onClose={() => setCancelOpen(false)} />}
    </div>
  );
}
