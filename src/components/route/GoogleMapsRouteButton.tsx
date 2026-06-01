"use client";

import {
  MAX_ROUTE_STOPS,
  buildRouteUrlFromOrders,
  type LatLng,
} from "@/lib/routeOptimization";
import type { Order } from "@/types";

interface Props {
  // Маршрутад оруулах захиалгууд (оновчлогдсон дараалал).
  orders: Order[];
  origin?: LatLng | null; // жолоочийн одоогийн байршил (эхлэл)
  label?: string;
}

// Google Maps multi-stop directions нээх том товч.
export default function GoogleMapsRouteButton({
  orders,
  origin,
  label = "Маршрут эхлүүлэх",
}: Props) {
  const url = buildRouteUrlFromOrders(orders, origin);
  const disabled = !url;
  const capped = orders.length > MAX_ROUTE_STOPS;

  if (disabled) {
    return (
      <button
        disabled
        className="w-full cursor-not-allowed rounded-2xl bg-slate-200 py-4 text-center text-base font-bold text-slate-400"
      >
        🚗 {label}
      </button>
    );
  }

  return (
    <div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-4 text-base font-bold text-white shadow-sm transition hover:bg-brand-dark"
      >
        🚗 {label}
      </a>
      {capped && (
        <p className="mt-1.5 text-center text-xs text-amber-600">
          Google Maps-д эхний {MAX_ROUTE_STOPS} зогсоол л орно. Үлдсэнийг дараа нь нээнэ үү.
        </p>
      )}
    </div>
  );
}
