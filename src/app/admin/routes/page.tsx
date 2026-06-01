"use client";

import { useEffect, useMemo, useState } from "react";
import RouteSummary from "@/components/route/RouteSummary";
import RouteOrderList from "@/components/route/RouteOrderList";
import GoogleMapsRouteButton from "@/components/route/GoogleMapsRouteButton";
import GoogleMapProvider from "@/components/maps/GoogleMapProvider";
import DriverMarkerMap, { type MapMarker } from "@/components/maps/DriverMarkerMap";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import { subscribeDrivers } from "@/lib/firebase/drivers";
import { subscribeDriverLocations } from "@/lib/firebase/locations";
import { subscribeOrdersByDriver } from "@/lib/firebase/orders";
import {
  isActiveRouteOrder,
  optimizeByProximity,
  splitByLocation,
  type LatLng,
} from "@/lib/routeOptimization";
import type { Driver, DriverLocation, Order } from "@/types";

const inputClass =
  "w-full max-w-sm rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-navy outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

export default function AdminRoutesPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [locations, setLocations] = useState<DriverLocation[]>([]);
  const [selectedId, setSelectedId] = useState("");

  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Идэвхтэй жолооч + бүх байршил (realtime).
  useEffect(() => {
    const unsubD = subscribeDrivers((list) => setDrivers(list.filter((d) => d.isActive)));
    const unsubL = subscribeDriverLocations((list) => setLocations(list));
    return () => {
      unsubD();
      unsubL();
    };
  }, []);

  // Сонгосон жолоочийн идэвхтэй захиалгууд (subscribe-only — setState нь callback дотор).
  useEffect(() => {
    if (!selectedId) return;
    const unsub = subscribeOrdersByDriver(
      selectedId,
      (list) => {
        setOrders(list.filter(isActiveRouteOrder));
        setLoadingOrders(false);
      },
      () => setLoadingOrders(false),
    );
    return () => unsub();
  }, [selectedId]);

  // Жолооч солих — orders/loading-г энд (event handler) шинэчилнэ.
  function selectDriver(id: string) {
    setSelectedId(id);
    setOrders([]);
    setLoadingOrders(Boolean(id));
  }

  const driverLoc = useMemo<LatLng | null>(() => {
    const l = locations.find((x) => x.driverId === selectedId);
    return l ? { lat: l.lat, lng: l.lng } : null;
  }, [locations, selectedId]);

  const { located, unlocated, optimized } = useMemo(() => {
    const split = splitByLocation(orders);
    return {
      located: split.located,
      unlocated: split.unlocated,
      optimized: optimizeByProximity(split.located, driverLoc),
    };
  }, [orders, driverLoc]);

  // Газрын зургийн marker-ууд: жолооч + захиалгууд (дараалсан дугаартай).
  const markers = useMemo<MapMarker[]>(() => {
    const list: MapMarker[] = [];
    if (driverLoc) {
      list.push({
        id: "driver",
        lat: driverLoc.lat,
        lng: driverLoc.lng,
        title: "🚚 Жолоочийн байршил",
      });
    }
    optimized.forEach((o, i) => {
      if (o.location) {
        list.push({
          id: o.id,
          lat: o.location.lat,
          lng: o.location.lng,
          title: `${i + 1}. ${o.orderCode} — ${o.receiverName}`,
        });
      }
    });
    return list;
  }, [driverLoc, optimized]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Жолоочийн маршрут</h1>
      <p className="mt-1 text-sm text-slate-500">
        Жолооч сонгоод тухайн өдрийн идэвхтэй маршрутыг харна
      </p>

      <div className="mt-5">
        <select
          value={selectedId}
          onChange={(e) => selectDriver(e.target.value)}
          className={inputClass}
        >
          <option value="">— Жолооч сонгох —</option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} · {d.phone}
            </option>
          ))}
        </select>
      </div>

      {!selectedId ? (
        <div className="mt-6">
          <EmptyState icon="🗺️" title="Жолооч сонгоно уу" description="Дээрх жагсаалтаас жолооч сонгоход маршрут харагдана." />
        </div>
      ) : loadingOrders ? (
        <div className="mt-6">
          <LoadingState />
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon="📭" title="Идэвхтэй захиалга алга" description="Энэ жолоочид одоогоор хүргэх захиалга байхгүй." />
        </div>
      ) : (
        <div className="mt-6 grid gap-5 lg:grid-cols-2 lg:items-start">
          {/* Газрын зураг */}
          <div className="space-y-4">
            <RouteSummary
              total={orders.length}
              withLocation={located.length}
              withoutLocation={unlocated.length}
            />
            <GoogleMapProvider
              fallback={
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
                  Газрын зураг идэвхгүй (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY тохируулаагүй).
                </div>
              }
            >
              {markers.length > 0 ? (
                <DriverMarkerMap markers={markers} height="420px" />
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
                  Байршилтай захиалга алга — газрын зураг хоосон.
                </div>
              )}
            </GoogleMapProvider>
            <GoogleMapsRouteButton
              orders={[...optimized, ...unlocated]}
              origin={driverLoc}
              label="Google Maps дээр маршрут нээх"
            />
          </div>

          {/* Эрэмбэлэгдсэн жагсаалт */}
          <RouteOrderList
            located={optimized}
            unlocated={unlocated}
            detailHref={(o) => `/admin/orders/detail?id=${o.id}`}
          />
        </div>
      )}
    </div>
  );
}
