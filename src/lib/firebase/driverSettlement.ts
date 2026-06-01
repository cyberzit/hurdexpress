import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { DriverSettlement, DriverSettlementStatus, Order } from "@/types";

const COLLECTION = "driverSettlements";

function toMillis(value: unknown): number {
  if (value && typeof value === "object" && "toMillis" in value) {
    return (value as { toMillis: () => number }).toMillis();
  }
  return typeof value === "number" ? value : Date.now();
}

// Огнооны түлхүүр — "YYYY-MM-DD" (local). (Event handler/lib — render биш.)
export function dateKeyOf(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

// Өнөөдрийн муж + түлхүүр.
export function todayRange(): { start: Date; end: Date; key: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return { start, end, key: dateKeyOf(start) };
}

// Жолоочийн нэг өдрийн статистик (delivered/failed-аас).
export interface DayStats {
  delivered: Order[];
  totalOrders: number;
  deliveredOrders: number;
  codCollected: number;
  cashCollected: number;
}

export function computeDayStats(
  orders: Order[],
  range: { start: Date; end: Date },
): DayStats {
  const s = range.start.getTime();
  const e = range.end.getTime();
  const inRange = (ms?: number) => ms != null && ms >= s && ms <= e;

  const delivered = orders.filter(
    (o) => o.status === "delivered" && inRange(o.deliveredAt),
  );
  const failed = orders.filter((o) => o.status === "failed" && inRange(o.failedAt));

  let codCollected = 0;
  let cashCollected = 0;
  for (const o of delivered) {
    codCollected += o.codAmount || 0;
    if (o.codCollected) cashCollected += o.codAmount || 0;
  }

  return {
    delivered,
    totalOrders: delivered.length + failed.length,
    deliveredOrders: delivered.length,
    codCollected,
    cashCollected,
  };
}

function mapDriverSettlement(id: string, data: Record<string, unknown>): DriverSettlement {
  return {
    id,
    driverId: (data.driverId as string) ?? "",
    driverName: (data.driverName as string) ?? "",
    date: toMillis(data.date),
    dateKey: (data.dateKey as string) ?? "",
    totalOrders: (data.totalOrders as number) ?? 0,
    deliveredOrders: (data.deliveredOrders as number) ?? 0,
    codCollected: (data.codCollected as number) ?? 0,
    cashCollected: (data.cashCollected as number) ?? 0,
    handedAmount: (data.handedAmount as number) ?? 0,
    differenceAmount: (data.differenceAmount as number) ?? 0,
    status: (data.status as DriverSettlementStatus) ?? "open",
    submittedAt: data.submittedAt ? toMillis(data.submittedAt) : undefined,
    approvedAt: data.approvedAt ? toMillis(data.approvedAt) : undefined,
    approvedBy: data.approvedBy as string | undefined,
    note: data.note as string | undefined,
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
  };
}

// Нэг өдөр-жолооч = нэг document (idempotent upsert).
function docId(driverId: string, dateKey: string): string {
  return `${driverId}_${dateKey}`;
}

export interface SubmitSettlementInput {
  driverId: string;
  driverName: string;
  dateKey: string;
  dateMs: number;
  totalOrders: number;
  deliveredOrders: number;
  codCollected: number;
  cashCollected: number;
  handedAmount: number;
  note?: string;
}

// Жолооч өдөр хаалт илгээх → status "submitted".
export async function submitDriverSettlement(input: SubmitSettlementInput): Promise<void> {
  const ref = doc(db, COLLECTION, docId(input.driverId, input.dateKey));
  const existing = await getDoc(ref);

  await setDoc(
    ref,
    {
      driverId: input.driverId,
      driverName: input.driverName,
      date: Timestamp.fromMillis(input.dateMs),
      dateKey: input.dateKey,
      totalOrders: input.totalOrders,
      deliveredOrders: input.deliveredOrders,
      codCollected: input.codCollected,
      cashCollected: input.cashCollected,
      handedAmount: input.handedAmount,
      differenceAmount: input.codCollected - input.handedAmount,
      status: "submitted" as DriverSettlementStatus,
      ...(input.note?.trim() ? { note: input.note.trim() } : {}),
      submittedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...(existing.exists() ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: true },
  );
}

// Жолоочийн тухайн өдрийн тооцоог realtime ажиглах (status мэдэхэд).
export function subscribeDriverSettlementDay(
  driverId: string,
  dateKey: string,
  onData: (s: DriverSettlement | null) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db, COLLECTION, docId(driverId, dateKey)),
    (snap) =>
      onData(snap.exists() ? mapDriverSettlement(snap.id, snap.data()) : null),
    (err) => onError?.(err),
  );
}

// Бүх тооцоо (admin) — огноогоор эрэмбэлнэ.
export function subscribeDriverSettlements(
  onData: (list: DriverSettlement[]) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  const q = query(collection(db, COLLECTION), orderBy("date", "desc"));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => mapDriverSettlement(d.id, d.data()))),
    (err) => onError?.(err),
  );
}

// Тодорхой жолоочийнх (driver өөрийн түүх) — client дээр эрэмбэлнэ.
export function subscribeDriverSettlementsByDriver(
  driverId: string,
  onData: (list: DriverSettlement[]) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  const q = query(collection(db, COLLECTION), where("driverId", "==", driverId));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => mapDriverSettlement(d.id, d.data()));
      list.sort((a, b) => b.date - a.date);
      onData(list);
    },
    (err) => onError?.(err),
  );
}

// Admin — батлах.
export async function approveDriverSettlement(
  id: string,
  approvedBy: string,
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    status: "approved" as DriverSettlementStatus,
    approvedAt: serverTimestamp(),
    approvedBy,
    updatedAt: serverTimestamp(),
  });
}

// Admin — буцаах (дахин нээх → жолооч засаж дахин илгээнэ).
export async function rejectDriverSettlement(id: string, note?: string): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    status: "open" as DriverSettlementStatus,
    ...(note?.trim() ? { note: note.trim() } : {}),
    updatedAt: serverTimestamp(),
  });
}

// Admin — тэмдэглэл нэмэх/засах.
export async function setDriverSettlementNote(id: string, note: string): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    note: note.trim(),
    updatedAt: serverTimestamp(),
  });
}
