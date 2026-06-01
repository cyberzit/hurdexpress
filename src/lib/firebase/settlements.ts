import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { PaymentType, Settlement, SettlementStatus } from "@/types";

const COLLECTION = "settlements";

function toMillis(value: unknown): number {
  if (value && typeof value === "object" && "toMillis" in value) {
    return (value as { toMillis: () => number }).toMillis();
  }
  return typeof value === "number" ? value : Date.now();
}

function mapSettlement(id: string, data: Record<string, unknown>): Settlement {
  return {
    id,
    companyId: (data.companyId as string) ?? "",
    companyName: (data.companyName as string) ?? "",
    periodStart: toMillis(data.periodStart),
    periodEnd: toMillis(data.periodEnd),
    totalOrders: (data.totalOrders as number) ?? 0,
    deliveredOrders: (data.deliveredOrders as number) ?? 0,
    deliveryFeeTotal: (data.deliveryFeeTotal as number) ?? 0,
    codTotal: (data.codTotal as number) ?? 0,
    paidAmount: (data.paidAmount as number) ?? 0,
    balanceAmount: (data.balanceAmount as number) ?? 0,
    status: (data.status as SettlementStatus) ?? "draft",
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
  };
}

// Бүх тооцоо (admin) — createdAt-аар эрэмбэлнэ.
export function subscribeSettlements(
  onData: (list: Settlement[]) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => mapSettlement(d.id, d.data()))),
    (err) => onError?.(err),
  );
}

// Тодорхой байгууллагынх (partner) — client дээр эрэмбэлнэ (composite index хэрэггүй).
export function subscribeSettlementsByCompany(
  companyId: string,
  onData: (list: Settlement[]) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  const q = query(collection(db, COLLECTION), where("companyId", "==", companyId));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => mapSettlement(d.id, d.data()));
      list.sort((a, b) => b.createdAt - a.createdAt);
      onData(list);
    },
    (err) => onError?.(err),
  );
}

export interface CreateSettlementInput {
  companyId: string;
  companyName: string;
  periodStart: Date;
  periodEnd: Date;
}

// Delivered orders дээр үндэслэж draft settlement үүсгэнэ.
export async function createSettlement(input: CreateSettlementInput): Promise<string> {
  const snap = await getDocs(
    query(collection(db, "orders"), where("companyId", "==", input.companyId)),
  );

  const startMs = input.periodStart.getTime();
  const endMs = input.periodEnd.getTime();

  let totalOrders = 0;
  let deliveredOrders = 0;
  let deliveryFeeTotal = 0;
  let codTotal = 0;

  snap.forEach((d) => {
    const o = d.data();
    const created = toMillis(o.createdAt);
    if (created < startMs || created > endMs) return;
    totalOrders++;
    if (o.status === "delivered") {
      deliveredOrders++;
      deliveryFeeTotal += (o.deliveryPrice as number) || 0;
      codTotal += (o.codAmount as number) || 0;
    }
  });

  const ref = await addDoc(collection(db, COLLECTION), {
    companyId: input.companyId,
    companyName: input.companyName,
    periodStart: Timestamp.fromDate(input.periodStart),
    periodEnd: Timestamp.fromDate(input.periodEnd),
    totalOrders,
    deliveredOrders,
    deliveryFeeTotal,
    codTotal,
    paidAmount: 0,
    balanceAmount: deliveryFeeTotal,
    status: "draft" as SettlementStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateSettlementStatus(
  id: string,
  status: SettlementStatus,
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), { status, updatedAt: serverTimestamp() });
}

export interface RecordPaymentInput {
  companyId: string;
  settlementId: string;
  amount: number;
  type: PaymentType;
  note?: string;
}

// Төлбөр бүртгээд settlement-ийн paidAmount/balanceAmount-г шинэчилнэ (transaction).
export async function recordPayment(input: RecordPaymentInput): Promise<void> {
  await runTransaction(db, async (tx) => {
    const sRef = doc(db, COLLECTION, input.settlementId);
    const sSnap = await tx.get(sRef);
    if (!sSnap.exists()) throw new Error("Тооцоо олдсонгүй");
    const s = sSnap.data();

    const newPaid = ((s.paidAmount as number) || 0) + input.amount;
    const newBalance = ((s.deliveryFeeTotal as number) || 0) - newPaid;

    const pRef = doc(collection(db, "payments"));
    tx.set(pRef, {
      companyId: input.companyId,
      settlementId: input.settlementId,
      amount: input.amount,
      type: input.type,
      ...(input.note?.trim() ? { note: input.note.trim() } : {}),
      createdAt: serverTimestamp(),
    });
    tx.update(sRef, {
      paidAmount: newPaid,
      balanceAmount: newBalance,
      updatedAt: serverTimestamp(),
    });
  });
}
