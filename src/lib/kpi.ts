// Жолоочийн KPI + автомат цалин тооцоо.
// Захиалга (orders) + жолоочийн тооцоо (driverSettlements) + цалингийн тохиргооноос
// динамикаар тооцоолно (тусдаа sync шаардлагагүй).

import type {
  DriverKpi,
  DriverSettlement,
  GeneralSettings,
  Order,
} from "@/types";

export interface SalaryBreakdown {
  base: number;
  bonus: number;
  total: number;
}

// Огнооноос "YYYY-MM".
export function monthKeyOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// Одоогийн сар "YYYY-MM" (component render-д new Date() бичихгүйн тулд lib-д).
export function currentMonthKey(): string {
  return monthKeyOf(new Date());
}

// "YYYY-MM" → тухайн сарын муж.
export function monthRange(monthKey: string): { start: Date; end: Date } {
  const [y, m] = monthKey.split("-").map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0, 23, 59, 59, 999); // сарын сүүлийн өдөр
  return { start, end };
}

// Сүүлийн N сарын түлхүүр (хамгийн эртнийх нь эхэнд).
export function recentMonths(count: number, ref: Date): string[] {
  const out: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    out.push(monthKeyOf(new Date(ref.getFullYear(), ref.getMonth() - i, 1)));
  }
  return out;
}

// Одоогоос сүүлийн N сар (component-д new Date() бичихгүйн тулд lib-д).
export function recentMonthsFromNow(count: number): string[] {
  return recentMonths(count, new Date());
}

// Цалин = (fixed: суурь) | (per_delivery: хүргэлт × дүн) + bonus.
export function computeSalary(
  deliveredOrders: number,
  settings: Pick<
    GeneralSettings,
    | "driverSalaryMode"
    | "baseSalary"
    | "perDeliveryAmount"
    | "bonusThreshold"
    | "bonusAmount"
  >,
): SalaryBreakdown {
  const base =
    settings.driverSalaryMode === "fixed"
      ? settings.baseSalary ?? 0
      : deliveredOrders * (settings.perDeliveryAmount ?? 0);

  const threshold = settings.bonusThreshold ?? 0;
  const bonus =
    threshold > 0 && deliveredOrders >= threshold ? settings.bonusAmount ?? 0 : 0;

  return { base, bonus, total: base + bonus };
}

function rate(delivered: number, failed: number): number {
  const denom = delivered + failed;
  return denom === 0 ? 0 : Math.round((delivered / denom) * 100);
}

/**
 * Тухайн сарын захиалгуудаас жолооч бүрийн KPI + цалинг тооцоолно.
 * orders — тухайн сард үүссэн захиалгууд (driverId-тэй нь л тооцно).
 * settlements — тухайн сарын driverSettlements (codDifference-д).
 */
export function buildDriverKpis(
  orders: Order[],
  settlements: DriverSettlement[],
  settings: GeneralSettings,
  monthKey: string,
): DriverKpi[] {
  const diffByDriver = new Map<string, number>();
  for (const s of settlements) {
    diffByDriver.set(s.driverId, (diffByDriver.get(s.driverId) ?? 0) + s.differenceAmount);
  }

  const map = new Map<string, DriverKpi>();
  for (const o of orders) {
    if (!o.driverId) continue;
    const k =
      map.get(o.driverId) ??
      ({
        driverId: o.driverId,
        driverName: o.driverName || "—",
        month: monthKey,
        totalAssigned: 0,
        totalDelivered: 0,
        totalFailed: 0,
        successRate: 0,
        totalDeliveryIncome: 0,
        totalCodCollected: 0,
        codDifference: diffByDriver.get(o.driverId) ?? 0,
        baseSalary: 0,
        bonus: 0,
        calculatedSalary: 0,
      } as DriverKpi);

    k.totalAssigned++;
    if (o.status === "delivered") {
      k.totalDelivered++;
      k.totalDeliveryIncome += o.deliveryPrice || 0;
      k.totalCodCollected += o.codAmount || 0;
    } else if (o.status === "failed") {
      k.totalFailed++;
    }
    map.set(o.driverId, k);
  }

  const list = [...map.values()];
  for (const k of list) {
    k.successRate = rate(k.totalDelivered, k.totalFailed);
    const salary = computeSalary(k.totalDelivered, settings);
    k.baseSalary = salary.base;
    k.bonus = salary.bonus;
    k.calculatedSalary = salary.total;
  }
  return list.sort((a, b) => b.totalDelivered - a.totalDelivered);
}

// ── Шилдэг үзүүлэлтүүд (cards) ────────────────────────────────
export interface KpiHighlights {
  topDriver: DriverKpi | null; // хамгийн өндөр цалин (нийт гүйцэтгэл)
  mostDeliveries: DriverKpi | null;
  bestSuccess: DriverKpi | null; // дор хаяж 1 хүргэлттэй
  worstDifference: DriverKpi | null; // хамгийн их COD зөрүү (≠0)
}

export function buildHighlights(kpis: DriverKpi[]): KpiHighlights {
  if (kpis.length === 0) {
    return { topDriver: null, mostDeliveries: null, bestSuccess: null, worstDifference: null };
  }
  const max = (sel: (k: DriverKpi) => number, filter?: (k: DriverKpi) => boolean) => {
    const pool = filter ? kpis.filter(filter) : kpis;
    if (pool.length === 0) return null;
    return pool.reduce((a, b) => (sel(b) > sel(a) ? b : a));
  };
  return {
    topDriver: max((k) => k.calculatedSalary),
    mostDeliveries: max((k) => k.totalDelivered),
    bestSuccess: max((k) => k.successRate, (k) => k.totalDelivered > 0),
    worstDifference: max((k) => Math.abs(k.codDifference), (k) => k.codDifference !== 0),
  };
}

// ── Сарын трэнд (deliveries + salary) ────────────────────────
export interface MonthlyTrendPoint {
  month: string; // YYYY-MM
  deliveries: number;
  salary: number;
}

// Нэг жолоочийн (эсвэл filter хийсэн) захиалгуудаас сар бүрийн трэнд.
export function buildMonthlyTrend(
  orders: Order[],
  settings: GeneralSettings,
  months: string[],
): MonthlyTrendPoint[] {
  return months.map((month) => {
    const { start, end } = monthRange(month);
    const s = start.getTime();
    const e = end.getTime();
    const delivered = orders.filter(
      (o) => o.status === "delivered" && o.deliveredAt != null && o.deliveredAt >= s && o.deliveredAt <= e,
    ).length;
    return { month, deliveries: delivered, salary: computeSalary(delivered, settings).total };
  });
}

// CSV мөрүүд (export).
export const KPI_CSV_HEADERS = [
  "Жолооч",
  "Оноосон",
  "Хүргэсэн",
  "Амжилтгүй",
  "Амжилт %",
  "Хүргэлтийн орлого",
  "COD цуглуулсан",
  "COD зөрүү",
  "Суурь цалин",
  "Bonus",
  "Нийт цалин",
];

export function kpiToCsvRows(kpis: DriverKpi[]): (string | number)[][] {
  return kpis.map((k) => [
    k.driverName,
    k.totalAssigned,
    k.totalDelivered,
    k.totalFailed,
    k.successRate,
    k.totalDeliveryIncome,
    k.totalCodCollected,
    k.codDifference,
    k.baseSalary,
    k.bonus,
    k.calculatedSalary,
  ]);
}
