"use client";

import { useEffect, useMemo, useState } from "react";
import RouteSummary from "@/components/route/RouteSummary";
import RouteOrderList from "@/components/route/RouteOrderList";
import GoogleMapsRouteButton from "@/components/route/GoogleMapsRouteButton";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import LoadingState from "@/components/ui/LoadingState";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeOrdersByDriver } from "@/lib/firebase/orders";
import {
  isActiveRouteOrder,
  optimizeByProximity,
  splitByLocation,
  type LatLng,
} from "@/lib/routeOptimization";
import type { Order } from "@/types";

export default function DriverRoutePage() {
  const { user, profile } = useAuth();
  const driverId = profile?.driverId ?? user?.uid ?? "";

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [origin, setOrigin] = useState<LatLng | null>(null);
  const [geoError, setGeoError] = useState("");
  const [locating, setLocating] = useState(false);

  // Идэвхтэй захиалгууд (assigned / picked_up / on_the_way).
  useEffect(() => {
    if (!driverId) return;
    const unsub = subscribeOrdersByDriver(
      driverId,
      (list) => {
        setOrders(list.filter(isActiveRouteOrder));
        setLoading(false);
      },
      () => {
        setError("Захиалгуудыг ачаалахад алдаа гарлаа.");
        setLoading(false);
      },
    );
    return () => unsub();
  }, [driverId]);

  function locate() {
    if (!("geolocation" in navigator)) {
      setGeoError("Энэ төхөөрөмж байршил дэмжихгүй байна.");
      return;
    }
    setLocating(true);
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setGeoError("Байршил тогтоох боломжгүй (зөвшөөрөл олгоно уу).");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  // Mount дээр байршлыг нэг удаа асууна (synchronous setState-аас сэргийлж 0ms-аар хойшлуулна).
  useEffect(() => {
    const t = setTimeout(locate, 0);
    return () => clearTimeout(t);
  }, []);

  const { located, unlocated, optimized } = useMemo(() => {
    const split = splitByLocation(orders);
    return {
      located: split.located,
      unlocated: split.unlocated,
      optimized: optimizeByProximity(split.located, origin),
    };
  }, [orders, origin]);

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-navy">Хүргэлтийн маршрут</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Оноогдсон захиалгуудыг хамгийн ойр дарааллаар
        </p>
      </div>

      {error && <ErrorState message={error} />}

      {orders.length === 0 ? (
        <EmptyState icon="🗺️" title="Идэвхтэй хүргэлт алга" description="Оноогдсон захиалга гармагц энд маршрут харагдана." />
      ) : (
        <>
          <RouteSummary
            total={orders.length}
            withLocation={located.length}
            withoutLocation={unlocated.length}
          />

          {/* Байршлын төлөв */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm">
            <span className="text-slate-600">
              {origin ? (
                <span className="font-mono text-xs text-slate-500">
                  📍 {origin.lat.toFixed(4)}, {origin.lng.toFixed(4)}
                </span>
              ) : (
                <span className="text-amber-600">Байршил тогтоогоогүй</span>
              )}
            </span>
            <button
              onClick={locate}
              disabled={locating}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-navy transition hover:bg-slate-50 disabled:opacity-60"
            >
              {locating ? "Тогтоож байна…" : "Байршил тогтоох"}
            </button>
          </div>
          {geoError && <p className="text-xs text-amber-600">{geoError}</p>}

          <GoogleMapsRouteButton orders={[...optimized, ...unlocated]} origin={origin} />

          <RouteOrderList
            located={optimized}
            unlocated={unlocated}
            detailHref={(o) => `/driver/orders/detail?id=${o.id}`}
          />
        </>
      )}
    </div>
  );
}
