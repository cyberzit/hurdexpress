import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Order, OrderStatus } from "@/types";

const COLLECTION = "orders";

export interface OrderInput {
  companyId: string;
  companyName: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  itemName: string;
  productId?: string;
  productName?: string;
  qty: number;
  deliveryPrice: number;
  codAmount: number;
  note?: string;
  createdByUid?: string;
}

// HX + 6 оронтой санамсаргүй тоо.
export function generateOrderCode(): string {
  return `HX${Math.floor(100000 + Math.random() * 900000)}`;
}

function toMillis(value: unknown): number {
  if (value && typeof value === "object" && "toMillis" in value) {
    return (value as { toMillis: () => number }).toMillis();
  }
  return typeof value === "number" ? value : Date.now();
}

function mapOrder(id: string, data: Record<string, unknown>): Order {
  return {
    id,
    orderCode: (data.orderCode as string) ?? "",
    companyId: (data.companyId as string) ?? "",
    companyName: (data.companyName as string) ?? "",
    receiverName: (data.receiverName as string) ?? "",
    receiverPhone: (data.receiverPhone as string) ?? "",
    receiverAddress: (data.receiverAddress as string) ?? "",
    itemName: (data.itemName as string) ?? "",
    productId: data.productId as string | undefined,
    productName: data.productName as string | undefined,
    qty: (data.qty as number) ?? 0,
    deliveryPrice: (data.deliveryPrice as number) ?? 0,
    codAmount: (data.codAmount as number) ?? 0,
    totalAmount: (data.totalAmount as number) ?? 0,
    note: data.note as string | undefined,
    status: (data.status as OrderStatus) ?? "pending",
    createdByUid: data.createdByUid as string | undefined,
    driverId: data.driverId as string | undefined,
    driverName: data.driverName as string | undefined,
    driverPhone: data.driverPhone as string | undefined,
    assignedAt: data.assignedAt ? toMillis(data.assignedAt) : undefined,
    pickedUpAt: data.pickedUpAt ? toMillis(data.pickedUpAt) : undefined,
    deliveredAt: data.deliveredAt ? toMillis(data.deliveredAt) : undefined,
    codCollected: data.codCollected as boolean | undefined,
    driverNote: data.driverNote as string | undefined,
    cancelReason: data.cancelReason as string | undefined,
    failedReason: data.failedReason as string | undefined,
    editedAt: data.editedAt ? toMillis(data.editedAt) : undefined,
    editedBy: data.editedBy as string | undefined,
    cancelledAt: data.cancelledAt ? toMillis(data.cancelledAt) : undefined,
    cancelledBy: data.cancelledBy as string | undefined,
    failedAt: data.failedAt ? toMillis(data.failedAt) : undefined,
    failedBy: data.failedBy as string | undefined,
    lastDriverLocation: data.lastDriverLocation
      ? {
          lat: (data.lastDriverLocation as Record<string, unknown>).lat as number,
          lng: (data.lastDriverLocation as Record<string, unknown>).lng as number,
          updatedAt: toMillis(
            (data.lastDriverLocation as Record<string, unknown>).updatedAt,
          ),
        }
      : undefined,
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
  };
}

// Real-time жагсаалт (onSnapshot). Unsubscribe буцаана.
export function subscribeOrders(
  onData: (orders: Order[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => mapOrder(d.id, d.data()))),
    (err) => onError?.(err),
  );
}

// Тодорхой байгууллагын захиалгууд (partner panel). orderBy-гүй query →
// composite index шаардахгүй; эрэмбэлэлтийг client дээр хийнэ.
export function subscribeOrdersByCompany(
  companyId: string,
  onData: (orders: Order[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const q = query(collection(db, COLLECTION), where("companyId", "==", companyId));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => mapOrder(d.id, d.data()));
      list.sort((a, b) => b.createdAt - a.createdAt);
      onData(list);
    },
    (err) => onError?.(err),
  );
}

// Тайланд — createdAt мужаар (admin). Нэг талбарын range тул composite index хэрэггүй.
export async function getOrdersInRange(start: Date, end: Date): Promise<Order[]> {
  const q = query(
    collection(db, COLLECTION),
    where("createdAt", ">=", start),
    where("createdAt", "<=", end),
    orderBy("createdAt", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapOrder(d.id, d.data()));
}

export interface CreatedOrder {
  id: string;
  orderCode: string;
}

export async function addOrder(input: OrderInput): Promise<CreatedOrder> {
  // Нийт дүн = COD + хүргэлтийн үнэ (хүлээн авагчаас авах нийт мөнгө).
  const totalAmount = input.codAmount + input.deliveryPrice;
  const orderCode = generateOrderCode();

  const payload: Record<string, unknown> = {
    orderCode,
    companyId: input.companyId,
    companyName: input.companyName,
    receiverName: input.receiverName.trim(),
    receiverPhone: input.receiverPhone.trim(),
    receiverAddress: input.receiverAddress.trim(),
    itemName: input.itemName.trim(),
    qty: input.qty,
    deliveryPrice: input.deliveryPrice,
    codAmount: input.codAmount,
    totalAmount,
    status: "pending" as OrderStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (input.productId) payload.productId = input.productId;
  if (input.productName?.trim()) payload.productName = input.productName.trim();
  if (input.note?.trim()) payload.note = input.note.trim();
  if (input.createdByUid) payload.createdByUid = input.createdByUid;

  const ref = await addDoc(collection(db, COLLECTION), payload);
  return { id: ref.id, orderCode };
}

// Захиалгын статус гараар шинэчлэх. delivered болгоход deliveredAt тэмдэглэнэ.
export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<void> {
  const data: Record<string, unknown> = {
    status,
    updatedAt: serverTimestamp(),
  };
  if (status === "delivered") data.deliveredAt = serverTimestamp();
  await updateDoc(doc(db, COLLECTION, id), data);
}

// Тодорхой жолоочид оноогдсон захиалгууд (driver panel).
export function subscribeOrdersByDriver(
  driverId: string,
  onData: (orders: Order[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const q = query(collection(db, COLLECTION), where("driverId", "==", driverId));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => mapOrder(d.id, d.data()));
      list.sort((a, b) => b.createdAt - a.createdAt);
      onData(list);
    },
    (err) => onError?.(err),
  );
}

// Нэг захиалгыг realtime ажиглах (дэлгэрэнгүй хуудас).
export function subscribeOrder(
  id: string,
  onData: (order: Order | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db, COLLECTION, id),
    (snap) => onData(snap.exists() ? mapOrder(snap.id, snap.data()) : null),
    (err) => onError?.(err),
  );
}

// Жолоочийн талаас захиалга шинэчлэх. Статусаас хамаарч timestamp нэмнэ.
export async function driverUpdateOrder(
  id: string,
  fields: { status?: OrderStatus; codCollected?: boolean; driverNote?: string },
): Promise<void> {
  const data: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (fields.status) {
    data.status = fields.status;
    if (fields.status === "picked_up") data.pickedUpAt = serverTimestamp();
    if (fields.status === "delivered") data.deliveredAt = serverTimestamp();
  }
  if (fields.codCollected !== undefined) data.codCollected = fields.codCollected;
  if (fields.driverNote !== undefined) data.driverNote = fields.driverNote.trim();
  await updateDoc(doc(db, COLLECTION, id), data);
}

// Захиалгын мэдээлэл засах (admin аль ч статус; partner зөвхөн pending — rules).
export interface EditOrderInput {
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  note?: string;
  codAmount: number;
  deliveryPrice: number;
}

export async function editOrder(
  id: string,
  input: EditOrderInput,
  editedBy: string,
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    receiverName: input.receiverName.trim(),
    receiverPhone: input.receiverPhone.trim(),
    receiverAddress: input.receiverAddress.trim(),
    note: input.note?.trim() ?? "",
    codAmount: input.codAmount,
    deliveryPrice: input.deliveryPrice,
    totalAmount: input.codAmount + input.deliveryPrice,
    editedAt: serverTimestamp(),
    editedBy,
    updatedAt: serverTimestamp(),
  });
}

// Захиалга цуцлах → status "cancelled".
export async function cancelOrder(
  id: string,
  reason: string,
  cancelledBy: string,
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    status: "cancelled" as OrderStatus,
    cancelReason: reason.trim(),
    cancelledAt: serverTimestamp(),
    cancelledBy,
    updatedAt: serverTimestamp(),
  });
}

// Амжилтгүй болгох (driver/admin) → status "failed" + шалтгаан.
export async function failOrder(
  id: string,
  reason: string,
  failedBy: string,
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    status: "failed" as OrderStatus,
    failedReason: reason.trim(),
    failedAt: serverTimestamp(),
    failedBy,
    updatedAt: serverTimestamp(),
  });
}

// Захиалгад жолооч оноох → статус "assigned" болно.
export async function assignDriver(
  orderId: string,
  driverId: string,
  driverName: string,
  driverPhone: string,
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, orderId), {
    driverId,
    driverName,
    driverPhone,
    status: "assigned" as OrderStatus,
    assignedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

// ⚠️ DEPRECATED (security): orders read нь public биш болсон тул энэ client
// функц нэвтрээгүй хэрэглэгчид ажиллахгүй. Нийтийн tracking-д /api/track-order
// (Admin SDK) ашиглана. Зөвхөн нэвтэрсэн admin-д л ажиллана.
export async function getOrderByCode(orderCode: string): Promise<Order | null> {
  const q = query(
    collection(db, COLLECTION),
    where("orderCode", "==", orderCode.trim().toUpperCase()),
    limit(1),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return mapOrder(d.id, d.data());
}
