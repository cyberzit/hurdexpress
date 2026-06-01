// Хүргэлтийн маршрут оновчлол (эхний хувилбар — энгийн nearest-neighbor).
//
// Цаашид: Google Routes API (Directions / Route Optimization API) холбож
// бодит зам, түгжрэл, цаг хугацааг тооцоолж болно. Тэр үед `optimizeByProximity`-г
// сервер талын дуудлагаар (Cloud Function) сольж, үр дүнг `routeOrder`-д хадгална.

import { distanceKm } from "@/lib/autoDispatch";
import type { Order, OrderStatus } from "@/types";

export type LatLng = { lat: number; lng: number };

// Маршрутад хамаарах идэвхтэй статусууд.
export const ACTIVE_ROUTE_STATUSES: OrderStatus[] = [
  "assigned",
  "picked_up",
  "on_the_way",
];

// Google Maps directions URL-ийн зогсоолын дээд хязгаар (эхний хувилбар).
export const MAX_ROUTE_STOPS = 10;

export function isActiveRouteOrder(o: Order): boolean {
  return ACTIVE_ROUTE_STATUSES.includes(o.status);
}

// Байршилтай / байршилгүй захиалгуудыг ялгана.
export function splitByLocation(orders: Order[]): {
  located: Order[];
  unlocated: Order[];
} {
  const located: Order[] = [];
  const unlocated: Order[] = [];
  for (const o of orders) {
    if (o.location) located.push(o);
    else unlocated.push(o);
  }
  return { located, unlocated };
}

/**
 * Байршилтай захиалгуудыг origin-оос эхлэн nearest-neighbor аргаар эрэмбэлнэ.
 * origin байхгүй бол эхний захиалгаас эхэлнэ.
 */
export function optimizeByProximity(located: Order[], origin?: LatLng | null): Order[] {
  if (located.length <= 1) return [...located];

  const remaining = [...located];
  const result: Order[] = [];
  let cursor: LatLng | undefined =
    origin ?? (remaining[0].location as LatLng | undefined);

  while (remaining.length > 0) {
    let bestIdx = 0;
    if (cursor) {
      let bestDist = Number.POSITIVE_INFINITY;
      remaining.forEach((o, i) => {
        const d = o.location ? distanceKm(cursor!, o.location) : Number.POSITIVE_INFINITY;
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      });
    }
    const [next] = remaining.splice(bestIdx, 1);
    result.push(next);
    cursor = next.location as LatLng | undefined;
  }
  return result;
}

// Захиалгыг Google Maps зогсоол болгох: байршилтай бол "lat,lng", эс бол хаяг.
export function orderToStop(o: Order): string {
  if (o.location) return `${o.location.lat},${o.location.lng}`;
  return o.receiverAddress;
}

/**
 * Google Maps multi-stop directions URL үүсгэнэ.
 * origin → waypoint1 → … → destination (driving).
 * stops нь "lat,lng" эсвэл хаягийн мөр. MAX_ROUTE_STOPS-оор хязгаарлана.
 */
export function buildGoogleMapsRouteUrl(stops: string[], origin?: string): string {
  let pts = stops.filter(Boolean).slice(0, MAX_ROUTE_STOPS);
  if (pts.length === 0) return "";

  const params = new URLSearchParams({ api: "1", travelmode: "driving" });

  let originVal = origin;
  if (!originVal) {
    originVal = pts[0];
    pts = pts.slice(1);
  }
  params.set("origin", originVal);

  if (pts.length === 0) {
    params.set("destination", originVal);
  } else {
    params.set("destination", pts[pts.length - 1]);
    const waypoints = pts.slice(0, -1);
    if (waypoints.length > 0) params.set("waypoints", waypoints.join("|"));
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

// Эрэмбэлэгдсэн захиалгууд + (заавал биш) origin-оос directions URL.
export function buildRouteUrlFromOrders(orders: Order[], origin?: LatLng | null): string {
  const stops = orders.map(orderToStop);
  const originStr = origin ? `${origin.lat},${origin.lng}` : undefined;
  return buildGoogleMapsRouteUrl(stops, originStr);
}
