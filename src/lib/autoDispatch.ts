// Auto-dispatch — жолооч сонгох цэвэр алгоритм.
//
// Энэ нь client талын ТУСЛАХ (admin-д "санал болгох жолооч" харуулах) бөгөөд
// БОДИТ авто-оноолтыг Cloud Function (onOrderCreated) хийдэг — давхар оноохгүй.
// Хоёр тал ижил логик баримтална: available + хамгийн бага ачаалал + бүс/ойролцоо.

import { terminalDistrictForProvince } from "@/lib/mongoliaLocations";
import type { Driver, Order } from "@/types";

// Хоёр цэгийн хоорондын зай (км) — Haversine.
export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

// Захиалгыг хариуцах зорилтот дүүрэг:
//  - city: захиалгын дүүрэг (order.cityDistrict)
//  - province: бүсийн терминал дүүрэг (зүүн→Баянзүрх, баруун→Баянгол)
export function targetDistrictForOrder(
  order: Pick<Order, "deliveryType" | "cityDistrict" | "province">,
): string | undefined {
  if (order.deliveryType === "province") {
    return terminalDistrictForProvince(order.province) ?? undefined;
  }
  return order.cityDistrict || undefined;
}

/**
 * Захиалгад хамгийн тохиромжтой жолоочийг сонгоно.
 * 1. available + идэвхтэй жолооч
 * 2. зорилтот дүүргийг serviceDistricts-дээ агуулсан жолоочдыг урьдална
 *    (city: захиалгын дүүрэг; province: зүүн→Баянзүрх / баруун→Баянгол)
 * 3. хамгийн бага currentOrderCount
 * 4. (байршил мэдэгдвэл) хамгийн ойр
 * Тохирох жолооч байхгүй бол available-аас сонгоно.
 */
export function pickBestDriver(drivers: Driver[], order: Order): Driver | null {
  const available = drivers.filter(
    (d) => d.isActive && d.currentStatus === "available",
  );
  if (available.length === 0) return null;

  const target = targetDistrictForOrder(order);
  const matched = target
    ? available.filter((d) => (d.serviceDistricts ?? []).includes(target))
    : [];
  const pool = matched.length ? matched : available;

  const loc = order.location;

  const score = (d: Driver) => {
    const count = d.currentOrderCount ?? 0;
    const dist =
      loc && d.lastLocation ? distanceKm(loc, d.lastLocation) : Number.POSITIVE_INFINITY;
    return { count, dist };
  };

  return [...pool].sort((a, b) => {
    const sa = score(a);
    const sb = score(b);
    // 1) хамгийн бага ачаалал, 2) хамгийн ойр
    if (sa.count !== sb.count) return sa.count - sb.count;
    if (sa.dist !== sb.dist) return sa.dist - sb.dist;
    return 0;
  })[0];
}
