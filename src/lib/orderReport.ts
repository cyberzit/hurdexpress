// Захиалгын тайлангийн ерөнхий логик — шүүх, эрэмбэлэх, нэгтгэх.
// Partner (өөрийн байгууллага) ба Admin (сонгосон байгууллага) ХОЁУЛАА эндээс
// өгөгдлөө авна — UI, PDF, нийлбэр гурав хэзээ ч зөрөхгүй.
import { dateKeyOf, rangeOfKey } from "@/lib/firebase/driverSettlement";
import type { Order, OrderStatus } from "@/types";

export type QuickRange = "today" | "last7" | "thisMonth" | "lastMonth" | "custom";
export type SortKey = "date" | "driver" | "status";
export type SortDir = "asc" | "desc";

export interface ReportFilters {
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
  driverId: string; // "" = бүх жолооч
  status: OrderStatus | ""; // "" = бүх статус
  search: string;
  // Зөвхөн admin ашиглана. Partner талд захиалга нь аль хэдийн companyId-гаар
  // хязгаарлагдсан тул хоосон үлдэнэ.
  companyId?: string;
}

// Буруу/дутуу тоог 0 гэж үзнэ (NaN, null, undefined, Infinity).
export function safeNum(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

// Огнооны түргэн сонголтууд.
export function rangeOf(preset: Exclude<QuickRange, "custom">): {
  start: string;
  end: string;
} {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  switch (preset) {
    case "today":
      return { start: dateKeyOf(now), end: dateKeyOf(now) };
    case "last7":
      // Өнөөдрийг оруулаад 7 хоног.
      return {
        start: dateKeyOf(new Date(y, m, now.getDate() - 6)),
        end: dateKeyOf(now),
      };
    case "thisMonth":
      return { start: dateKeyOf(new Date(y, m, 1)), end: dateKeyOf(now) };
    case "lastMonth": {
      const first = new Date(y, m - 1, 1);
      const last = new Date(y, m, 0); // өмнөх сарын сүүлийн өдөр
      return { start: dateKeyOf(first), end: dateKeyOf(last) };
    }
  }
}

// Анхдагч: энэ сарын эхний өдөр → өнөөдөр, бүх жолооч, бүх статус.
export function defaultFilters(): ReportFilters {
  const { start, end } = rangeOf("thisMonth");
  return { start, end, driverId: "", status: "", search: "" };
}

// Барааны нэр — олон бараатай бол мөрүүдээс, эс бөгөөс productName → itemName.
export function productLabel(o: Order): string {
  if (o.items && o.items.length > 0) {
    return o.items.map((it) => `${it.productName} ×${it.qty}`).join(", ");
  }
  return o.productName || o.itemName || "—";
}

export function driverLabel(o: Order): string {
  return o.driverName?.trim() || "Оноогоогүй";
}

// Захиалгын БАРААНЫ үнэ. codAmount нь хүргэлтийн үнийг агуулдаггүй —
// totalAmount = codAmount + deliveryPrice − discount (orders.ts).
export function goodsAmount(o: Order): number {
  return safeNum(o.codAmount);
}

// Тухайн компанийн захиалгуудад ажилласан жолоочдын давхардалгүй жагсаалт.
export function uniqueDrivers(orders: Order[]): { id: string; name: string }[] {
  const map = new Map<string, string>();
  for (const o of orders) {
    if (o.driverId) map.set(o.driverId, o.driverName?.trim() || o.driverId);
  }
  return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) =>
    a.name.localeCompare(b.name, "mn"),
  );
}

export function filterOrders(orders: Order[], f: ReportFilters): Order[] {
  const from = f.start ? rangeOfKey(f.start).start.getTime() : -Infinity;
  const to = f.end ? rangeOfKey(f.end).end.getTime() : Infinity;
  const q = f.search.trim().toLowerCase();
  const qDigits = q.replace(/\D/g, "");

  return orders.filter((o) => {
    if (f.companyId && o.companyId !== f.companyId) return false;
    const created = safeNum(o.createdAt);
    if (created < from || created > to) return false;
    if (f.driverId && o.driverId !== f.driverId) return false;
    if (f.status && o.status !== f.status) return false;
    if (!q) return true;

    // Хайлт — хүлээн авагч, утас, хаяг.
    const hay = [o.receiverName, o.receiverAddress].filter(Boolean).join(" ").toLowerCase();
    if (hay.includes(q)) return true;
    const phone = (o.receiverPhone ?? "").replace(/\D/g, "");
    return qDigits.length > 0 && phone.includes(qDigits);
  });
}

export function sortOrders(rows: Order[], key: SortKey, dir: SortDir): Order[] {
  const sign = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    let cmp = 0;
    if (key === "date") cmp = safeNum(a.createdAt) - safeNum(b.createdAt);
    else if (key === "driver") cmp = driverLabel(a).localeCompare(driverLabel(b), "mn");
    else cmp = a.status.localeCompare(b.status);
    // Тогтвортой эрэмбэ — тэнцвэл огноогоор.
    if (cmp === 0) cmp = safeNum(a.createdAt) - safeNum(b.createdAt);
    return cmp * sign;
  });
}

export interface ReportSummary {
  total: number;
  delivered: number;
  failed: number;
  cancelled: number;
  goodsTotal: number;
}

export function summarize(rows: Order[]): ReportSummary {
  return rows.reduce<ReportSummary>(
    (acc, o) => {
      acc.total++;
      if (o.status === "delivered") acc.delivered++;
      else if (o.status === "failed") acc.failed++;
      else if (o.status === "cancelled") acc.cancelled++;
      acc.goodsTotal += goodsAmount(o);
      return acc;
    },
    { total: 0, delivered: 0, failed: 0, cancelled: 0, goodsTotal: 0 },
  );
}

// Файлын нэрэнд аюулгүй болгох (Windows/Unix хоёуланд).
export function safeFileName(s: string): string {
  return (
    s
      .replace(/[\\/:*?"<>|]+/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "tailan"
  );
}
