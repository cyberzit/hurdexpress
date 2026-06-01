import type { Order } from "@/types";

export type DateRangeKey = "today" | "7d" | "month" | "custom";

export interface DateRange {
  start: Date;
  end: Date;
}

// Сонголтоос огнооны муж тооцох.
export function computeRange(
  key: DateRangeKey,
  customStart?: string,
  customEnd?: string,
): DateRange {
  const now = new Date();
  const endOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  );

  if (key === "today") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return { start, end: endOfToday };
  }
  if (key === "7d") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    return { start, end: endOfToday };
  }
  if (key === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start, end: endOfToday };
  }
  // custom
  const start = customStart
    ? new Date(`${customStart}T00:00:00`)
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const end = customEnd ? new Date(`${customEnd}T23:59:59`) : endOfToday;
  return { start, end };
}

// ── Нэгтгэлүүд ───────────────────────────────────────────────

export interface ReportSummary {
  totalOrders: number;
  deliveredOrders: number;
  failedOrders: number;
  pendingOrders: number;
  deliveryFeeTotal: number; // хүргэгдсэн захиалгуудын хүргэлтийн орлого
  codTotal: number; // хүргэгдсэн захиалгуудын COD дүн
}

export function buildSummary(orders: Order[]): ReportSummary {
  const s: ReportSummary = {
    totalOrders: orders.length,
    deliveredOrders: 0,
    failedOrders: 0,
    pendingOrders: 0,
    deliveryFeeTotal: 0,
    codTotal: 0,
  };
  for (const o of orders) {
    if (o.status === "delivered") {
      s.deliveredOrders++;
      s.deliveryFeeTotal += o.deliveryPrice || 0;
      s.codTotal += o.codAmount || 0;
    } else if (o.status === "failed") {
      s.failedOrders++;
    } else if (o.status === "pending") {
      s.pendingOrders++;
    }
  }
  return s;
}

export interface CompanyRow {
  companyName: string;
  totalOrders: number;
  deliveredOrders: number;
  deliveryFeeTotal: number;
  codTotal: number;
}

export function buildCompanyReport(orders: Order[]): CompanyRow[] {
  const map = new Map<string, CompanyRow>();
  for (const o of orders) {
    const key = o.companyId || o.companyName || "—";
    const row =
      map.get(key) ??
      {
        companyName: o.companyName || "—",
        totalOrders: 0,
        deliveredOrders: 0,
        deliveryFeeTotal: 0,
        codTotal: 0,
      };
    row.totalOrders++;
    if (o.status === "delivered") {
      row.deliveredOrders++;
      row.deliveryFeeTotal += o.deliveryPrice || 0;
      row.codTotal += o.codAmount || 0;
    }
    map.set(key, row);
  }
  return [...map.values()].sort((a, b) => b.totalOrders - a.totalOrders);
}

export interface DriverRow {
  driverName: string;
  totalOrders: number;
  deliveredOrders: number;
  failedOrders: number;
  codCollectedTotal: number;
}

export function buildDriverReport(orders: Order[]): DriverRow[] {
  const map = new Map<string, DriverRow>();
  for (const o of orders) {
    if (!o.driverId) continue;
    const row =
      map.get(o.driverId) ??
      {
        driverName: o.driverName || "—",
        totalOrders: 0,
        deliveredOrders: 0,
        failedOrders: 0,
        codCollectedTotal: 0,
      };
    row.totalOrders++;
    if (o.status === "delivered") row.deliveredOrders++;
    if (o.status === "failed") row.failedOrders++;
    if (o.codCollected) row.codCollectedTotal += o.codAmount || 0;
    map.set(o.driverId, row);
  }
  return [...map.values()].sort((a, b) => b.totalOrders - a.totalOrders);
}

export interface DailyRow {
  date: string; // YYYY-MM-DD
  totalOrders: number;
  deliveredOrders: number;
  deliveryFeeTotal: number;
  codTotal: number;
}

function dateKey(ms: number): string {
  const d = new Date(ms);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function buildDailyReport(orders: Order[]): DailyRow[] {
  const map = new Map<string, DailyRow>();
  for (const o of orders) {
    const key = dateKey(o.createdAt);
    const row =
      map.get(key) ??
      {
        date: key,
        totalOrders: 0,
        deliveredOrders: 0,
        deliveryFeeTotal: 0,
        codTotal: 0,
      };
    row.totalOrders++;
    if (o.status === "delivered") {
      row.deliveredOrders++;
      row.deliveryFeeTotal += o.deliveryPrice || 0;
      row.codTotal += o.codAmount || 0;
    }
    map.set(key, row);
  }
  return [...map.values()].sort((a, b) => b.date.localeCompare(a.date));
}

// ── CSV export (client-side) ─────────────────────────────────

export function downloadCSV(
  filename: string,
  headers: string[],
  rows: (string | number)[][],
): void {
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [
    headers.map(escape).join(","),
    ...rows.map((r) => r.map(escape).join(",")),
  ].join("\n");
  // BOM — Excel дээр кирилл зөв уншихад.
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
