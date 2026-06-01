// Харилцагч байгууллагын KPI — orders collection-оос month-аар шүүж тооцоолно.
// (Тусдаа partnerKpi sync шаардахгүй; динамик.)

import { monthRange } from "@/lib/kpi";
import type { Order, PartnerKpi } from "@/types";

function rate(delivered: number, total: number): number {
  return total === 0 ? 0 : Math.round((delivered / total) * 100);
}

/**
 * Сарын захиалгуудаас байгууллага бүрийн KPI.
 * deliveryFeeTotal / codTotal нь зөвхөн delivered захиалгаас.
 */
export function buildPartnerKpis(orders: Order[], monthKey: string): PartnerKpi[] {
  const map = new Map<string, PartnerKpi>();
  for (const o of orders) {
    const id = o.companyId || o.companyName || "—";
    const k =
      map.get(id) ??
      ({
        companyId: id,
        companyName: o.companyName || "—",
        month: monthKey,
        totalOrders: 0,
        deliveredOrders: 0,
        failedOrders: 0,
        cancelledOrders: 0,
        successRate: 0,
        deliveryFeeTotal: 0,
        codTotal: 0,
        averageCodAmount: 0,
      } as PartnerKpi);

    k.totalOrders++;
    if (o.status === "delivered") {
      k.deliveredOrders++;
      k.deliveryFeeTotal += o.deliveryPrice || 0;
      k.codTotal += o.codAmount || 0;
    } else if (o.status === "failed") {
      k.failedOrders++;
    } else if (o.status === "cancelled") {
      k.cancelledOrders++;
    }
    map.set(id, k);
  }

  const list = [...map.values()];
  for (const k of list) {
    k.successRate = rate(k.deliveredOrders, k.totalOrders);
    k.averageCodAmount =
      k.deliveredOrders === 0 ? 0 : Math.round(k.codTotal / k.deliveredOrders);
  }
  return list.sort((a, b) => b.totalOrders - a.totalOrders);
}

// Шилдэг N байгууллага (захиалгын тоогоор).
export function topCompanies(kpis: PartnerKpi[], n: number): PartnerKpi[] {
  return [...kpis].sort((a, b) => b.totalOrders - a.totalOrders).slice(0, n);
}

// Амжилтгүй / цуцлагдсан шалтгааны нэгтгэл (partner хуудсанд).
export interface ReasonSummary {
  failed: { reason: string; count: number }[];
  cancelled: { reason: string; count: number }[];
}

function tally(items: (string | undefined)[]): { reason: string; count: number }[] {
  const map = new Map<string, number>();
  for (const r of items) {
    const key = r?.trim() || "Тодорхойгүй";
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);
}

export function buildReasonSummary(orders: Order[]): ReasonSummary {
  return {
    failed: tally(orders.filter((o) => o.status === "failed").map((o) => o.failedReason)),
    cancelled: tally(
      orders.filter((o) => o.status === "cancelled").map((o) => o.cancelReason),
    ),
  };
}

// ── Сарын трэнд (orders / delivered / failed / COD) ──────────
export interface PartnerTrendPoint {
  month: string;
  total: number;
  delivered: number;
  failed: number;
  codTotal: number;
}

export function buildPartnerTrend(
  orders: Order[],
  months: string[],
): PartnerTrendPoint[] {
  return months.map((month) => {
    const { start, end } = monthRange(month);
    const s = start.getTime();
    const e = end.getTime();
    const inMonth = orders.filter((o) => o.createdAt >= s && o.createdAt <= e);
    let delivered = 0;
    let failed = 0;
    let codTotal = 0;
    for (const o of inMonth) {
      if (o.status === "delivered") {
        delivered++;
        codTotal += o.codAmount || 0;
      } else if (o.status === "failed") {
        failed++;
      }
    }
    return { month, total: inMonth.length, delivered, failed, codTotal };
  });
}

// ── CSV ──────────────────────────────────────────────────────
export const PARTNER_KPI_CSV_HEADERS = [
  "Байгууллага",
  "Нийт",
  "Хүргэсэн",
  "Амжилтгүй",
  "Цуцлагдсан",
  "Амжилт %",
  "Хүргэлтийн төлбөр",
  "COD нийт",
  "Дундаж COD",
];

export function partnerKpiToCsvRows(kpis: PartnerKpi[]): (string | number)[][] {
  return kpis.map((k) => [
    k.companyName,
    k.totalOrders,
    k.deliveredOrders,
    k.failedOrders,
    k.cancelledOrders,
    k.successRate,
    k.deliveryFeeTotal,
    k.codTotal,
    k.averageCodAmount,
  ]);
}
