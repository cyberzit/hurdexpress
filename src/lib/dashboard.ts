import type { Company, Driver, Order, OrderStatus } from "@/types";

const IN_TRANSIT: OrderStatus[] = ["assigned", "picked_up", "on_the_way"];

export function isToday(ms: number): boolean {
  const d = new Date(ms);
  const n = new Date();
  return (
    d.getFullYear() === n.getFullYear() &&
    d.getMonth() === n.getMonth() &&
    d.getDate() === n.getDate()
  );
}

export interface DashboardStats {
  todayOrders: number;
  pending: number;
  inTransit: number;
  delivered: number;
  codTotal: number;
  revenue: number;
  activeCompanies: number;
  activeDrivers: number;
}

export function buildDashboardStats(
  orders: Order[],
  companies: Company[],
  drivers: Driver[],
): DashboardStats {
  const today = orders.filter((o) => isToday(o.createdAt));

  let pending = 0;
  let inTransit = 0;
  let delivered = 0;
  let codTotal = 0;
  let revenue = 0;

  for (const o of today) {
    if (o.status === "pending") {
      pending++;
    } else if (IN_TRANSIT.includes(o.status)) {
      inTransit++;
    } else if (o.status === "delivered") {
      delivered++;
      codTotal += o.codAmount || 0;
      revenue += o.deliveryPrice || 0;
    }
  }

  return {
    todayOrders: today.length,
    pending,
    inTransit,
    delivered,
    codTotal,
    revenue,
    activeCompanies: companies.filter((c) => c.isActive).length,
    activeDrivers: drivers.filter((d) => d.isActive).length,
  };
}

export interface StatusCount {
  status: OrderStatus;
  count: number;
}

// Өнөөдрийн захиалгуудын статусаар хуваарилалт (progress bar-д).
export function buildStatusBreakdown(orders: Order[]): {
  total: number;
  counts: StatusCount[];
} {
  const today = orders.filter((o) => isToday(o.createdAt));
  const all: OrderStatus[] = [
    "pending",
    "assigned",
    "picked_up",
    "on_the_way",
    "delivered",
    "failed",
    "cancelled",
  ];
  const counts = all.map((status) => ({
    status,
    count: today.filter((o) => o.status === status).length,
  }));
  return { total: today.length, counts };
}
