import type { OrderStatus } from "@/types";

// Нийтийн tracking-д харагдах монгол орчуулга (admin labels-аас өөр).
export const TRACKING_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Шинэ захиалга",
  assigned: "Жолоочид оноосон",
  picked_up: "Бараа авсан",
  on_the_way: "Замдаа явж байна",
  delivered: "Хүргэгдсэн",
  failed: "Амжилтгүй",
  cancelled: "Цуцлагдсан",
};

// Timeline-ийн дараалал (failed/cancelled нь энд ороогүй — тусдаа warning).
export const TIMELINE_STEPS: OrderStatus[] = [
  "pending",
  "assigned",
  "picked_up",
  "on_the_way",
  "delivered",
];
