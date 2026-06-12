// Агуулахын үлдэгдэл — admin гар тохируулга + хөдөлгөөний түүх.
// Захиалгатай холбоотой reserve/out/release нь Cloud Function талд (onOrder*).

import {
  collection,
  doc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { InventoryMovement, InventoryMovementType } from "@/types";

const MOVEMENTS = "inventoryMovements";
const PRODUCTS = "products";

function toMillis(value: unknown): number {
  if (value && typeof value === "object" && "toMillis" in value) {
    return (value as { toMillis: () => number }).toMillis();
  }
  return typeof value === "number" ? value : Date.now();
}

function mapMovement(id: string, data: Record<string, unknown>): InventoryMovement {
  return {
    id,
    productId: (data.productId as string) ?? "",
    companyId: (data.companyId as string) ?? "",
    type: (data.type as InventoryMovementType) ?? "adjustment",
    qty: (data.qty as number) ?? 0,
    beforeQty: (data.beforeQty as number) ?? 0,
    afterQty: (data.afterQty as number) ?? 0,
    reason: data.reason as string | undefined,
    orderId: data.orderId as string | undefined,
    actorId: (data.actorId as string) ?? "",
    actorName: (data.actorName as string) ?? "",
    createdAt: toMillis(data.createdAt),
  };
}

// Тодорхой барааны хөдөлгөөний түүх (admin).
export function subscribeMovements(
  productId: string,
  onData: (list: InventoryMovement[]) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  const q = query(collection(db, MOVEMENTS), where("productId", "==", productId));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => mapMovement(d.id, d.data()));
      list.sort((a, b) => b.createdAt - a.createdAt);
      onData(list);
    },
    (err) => onError?.(err),
  );
}

export interface AdjustStockInput {
  productId: string;
  // "in" = нэмэх (delta), "out" = хасах (delta), "adjustment" = шинэ нийт дүн (absolute)
  type: Extract<InventoryMovementType, "in" | "out" | "adjustment">;
  qty: number; // delta эсвэл шинэ дүн
  reason?: string;
  actorId: string;
  actorName: string;
}

/**
 * Admin гар тохируулга — stockQty өөрчилж, inventoryMovements бичнэ (transaction).
 * Validation: stockQty негатив болохгүй; reservedQty stockQty-аас их болохгүй.
 */
export async function adjustStock(input: AdjustStockInput): Promise<void> {
  const productRef = doc(db, PRODUCTS, input.productId);
  const movementRef = doc(collection(db, MOVEMENTS));

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(productRef);
    if (!snap.exists()) throw new Error("Бараа олдсонгүй.");
    const data = snap.data();
    const before = (data.stockQty as number) ?? 0;
    const reserved = (data.reservedQty as number) ?? 0;
    const companyId = (data.companyId as string) ?? "";

    let after: number;
    if (input.type === "in") after = before + input.qty;
    else if (input.type === "out") after = before - input.qty;
    else after = input.qty; // adjustment — absolute

    if (after < 0) throw new Error("Үлдэгдэл сөрөг болж болохгүй.");
    if (after < reserved) {
      throw new Error(
        `Үлдэгдэл захиалгад түгжсэн тооноос (${reserved}) бага болж болохгүй.`,
      );
    }

    tx.update(productRef, {
      stockQty: after,
      availableQty: Math.max(0, after - reserved),
      updatedAt: serverTimestamp(),
    });
    tx.set(movementRef, {
      productId: input.productId,
      companyId,
      type: input.type,
      qty: input.qty,
      beforeQty: before,
      afterQty: after,
      ...(input.reason?.trim() ? { reason: input.reason.trim() } : {}),
      actorId: input.actorId,
      actorName: input.actorName,
      createdAt: serverTimestamp(),
    });
  });
}

// Бага үлдэгдлийн босго шинэчлэх (admin).
export async function setLowStockAlert(
  productId: string,
  lowStockAlertQty: number,
): Promise<void> {
  await updateDoc(doc(db, PRODUCTS, productId), {
    lowStockAlertQty: Math.max(0, lowStockAlertQty),
    updatedAt: serverTimestamp(),
  });
}
