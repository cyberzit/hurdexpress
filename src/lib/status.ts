import { ORDER_STATUS_LABELS, type OrderStatus } from "@/types";

// Захиалгын статусын монгол нэр (нэгдсэн helper).
export function orderStatusLabel(status: OrderStatus): string {
  return ORDER_STATUS_LABELS[status] ?? status;
}

// Эцсийн (дууссан) статусууд — цаашид жолооч/статус өөрчлөхгүй.
export const FINAL_ORDER_STATUSES: OrderStatus[] = ["delivered", "failed", "cancelled"];

export function isFinalOrderStatus(status: OrderStatus): boolean {
  return FINAL_ORDER_STATUSES.includes(status);
}

// Badge (pill) өнгөний класс — бүх хүснэгт/карт нэг стандарт ашиглана.
export const ORDER_STATUS_BADGE: Record<OrderStatus, string> = {
  pending: "bg-amber-50 text-amber-700",
  assigned: "bg-blue-50 text-blue-700",
  picked_up: "bg-indigo-50 text-indigo-700",
  on_the_way: "bg-brand/10 text-brand-dark",
  delivered: "bg-green-50 text-green-700",
  failed: "bg-red-50 text-red-600",
  cancelled: "bg-slate-100 text-slate-500",
};

// Progress bar-ийн дүүргэлтийн өнгө (dashboard summary).
export const ORDER_STATUS_BAR: Record<OrderStatus, string> = {
  pending: "bg-amber-400",
  assigned: "bg-blue-400",
  picked_up: "bg-indigo-400",
  on_the_way: "bg-brand",
  delivered: "bg-green-500",
  failed: "bg-red-400",
  cancelled: "bg-slate-300",
};
