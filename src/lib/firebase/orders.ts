import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { isFinalOrderStatus } from "@/lib/status";
import type {
  DeliveryProof,
  DeliveryType,
  Order,
  OrderItem,
  OrderStatus,
} from "@/types";

const COLLECTION = "orders";

export interface OrderInput {
  companyId: string;
  companyName: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  // Хүргэлтийн бүс + бүтэцлэгдсэн хаяг (заавал биш — хуучин урсгалтай нийцэнэ).
  deliveryType?: DeliveryType;
  cityDistrict?: string;
  cityKhoroo?: string;
  street?: string;
  building?: string;
  entrance?: string;
  entranceCode?: string;
  addressNote?: string;
  province?: string;
  soum?: string;
  terminalName?: string;
  location?: { lat: number; lng: number };
  items?: OrderItem[]; // олон бараа — өгөгдвөл itemName/qty/codAmount үүнээс бодогдоно
  itemName: string;
  productId?: string;
  productName?: string;
  productImageUrl?: string;
  qty: number;
  deliveryPrice: number;
  codAmount: number;
  discount?: number; // хөнгөлөх дүн — нийт төлбөрөөс хасагдана
  prepaid?: boolean; // төлбөр урьдчилж төлөгдсөн — жолооч мөнгө авахгүй
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
    productImageUrl: data.productImageUrl as string | undefined,
    items: (data.items as OrderItem[] | undefined) ?? undefined,
    qty: (data.qty as number) ?? 0,
    deliveryPrice: (data.deliveryPrice as number) ?? 0,
    codAmount: (data.codAmount as number) ?? 0,
    discount: data.discount as number | undefined,
    totalAmount: (data.totalAmount as number) ?? 0,
    note: data.note as string | undefined,
    deliveryType: data.deliveryType as DeliveryType | undefined,
    cityDistrict: data.cityDistrict as string | undefined,
    cityKhoroo: data.cityKhoroo as string | undefined,
    street: data.street as string | undefined,
    building: data.building as string | undefined,
    entrance: data.entrance as string | undefined,
    entranceCode: data.entranceCode as string | undefined,
    addressNote: data.addressNote as string | undefined,
    province: data.province as string | undefined,
    soum: data.soum as string | undefined,
    terminalName: data.terminalName as string | undefined,
    location: data.location
      ? {
          lat: (data.location as Record<string, unknown>).lat as number,
          lng: (data.location as Record<string, unknown>).lng as number,
        }
      : undefined,
    routeOrder: data.routeOrder as number | undefined,
    deliveryProofs: (data.deliveryProofs as DeliveryProof[] | undefined) ?? undefined,
    failedProofs: (data.failedProofs as DeliveryProof[] | undefined) ?? undefined,
    status: (data.status as OrderStatus) ?? "pending",
    createdByUid: data.createdByUid as string | undefined,
    driverId: data.driverId as string | undefined,
    driverName: data.driverName as string | undefined,
    driverPhone: data.driverPhone as string | undefined,
    autoAssigned: data.autoAssigned as boolean | undefined,
    assignedAt: data.assignedAt ? toMillis(data.assignedAt) : undefined,
    pickedUpAt: data.pickedUpAt ? toMillis(data.pickedUpAt) : undefined,
    deliveredAt: data.deliveredAt ? toMillis(data.deliveredAt) : undefined,
    codCollected: data.codCollected as boolean | undefined,
    prepaid: Boolean(data.prepaid),
    cashPaid: data.cashPaid as number | undefined,
    transferPaid: data.transferPaid as number | undefined,
    driverNote: data.driverNote as string | undefined,
    cancelReason: data.cancelReason as string | undefined,
    failedReason: data.failedReason as string | undefined,
    editedAt: data.editedAt ? toMillis(data.editedAt) : undefined,
    editedBy: data.editedBy as string | undefined,
    cancelledAt: data.cancelledAt ? toMillis(data.cancelledAt) : undefined,
    cancelledBy: data.cancelledBy as string | undefined,
    failedAt: data.failedAt ? toMillis(data.failedAt) : undefined,
    failedBy: data.failedBy as string | undefined,
    failedNote: data.failedNote as string | undefined,
    // Хойшлуулалт — эдгээрийг уншихгүй бол огноо/тэмдэглэл хаана ч харагдахгүй.
    scheduledDate: data.scheduledDate as string | undefined,
    postponedAt: data.postponedAt ? toMillis(data.postponedAt) : undefined,
    postponedNote: data.postponedNote as string | undefined,
    postponeProofs: (data.postponeProofs as DeliveryProof[] | undefined) ?? undefined,
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
  const items = input.items?.filter((it) => it.productName.trim() && it.qty > 0) ?? [];
  const hasItems = items.length > 0;

  // Олон бараатай бол дүн/тоо/нэрийг мөрүүдээс бодно; эс бөгөөс хуучин талбарууд.
  const codAmount = hasItems
    ? items.reduce((s, it) => s + it.subtotal, 0)
    : input.codAmount;
  const qty = hasItems ? items.reduce((s, it) => s + it.qty, 0) : input.qty;
  const itemName = hasItems
    ? items.map((it) => `${it.productName} ×${it.qty}`).join(", ")
    : input.itemName.trim();

  const discount = Math.max(0, input.discount ?? 0);
  const totalAmount = codAmount + input.deliveryPrice - discount;
  const orderCode = generateOrderCode();

  const payload: Record<string, unknown> = {
    orderCode,
    companyId: input.companyId,
    companyName: input.companyName,
    receiverName: input.receiverName.trim(),
    receiverPhone: input.receiverPhone.trim(),
    receiverAddress: input.receiverAddress.trim(),
    itemName,
    qty,
    deliveryPrice: input.deliveryPrice,
    codAmount,
    discount,
    totalAmount,
    status: "pending" as OrderStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (hasItems) {
    payload.items = items;
    // Жагсаалт/картад эхний барааны нэр, зургийг харуулна (denormalized).
    payload.productName = items[0].productName;
    if (items[0].productId) payload.productId = items[0].productId;
    if (items[0].productImageUrl) payload.productImageUrl = items[0].productImageUrl;
  } else {
    if (input.productId) payload.productId = input.productId;
    if (input.productName?.trim()) payload.productName = input.productName.trim();
    if (input.productImageUrl) payload.productImageUrl = input.productImageUrl;
  }
  if (input.prepaid) payload.prepaid = true;
  if (input.note?.trim()) payload.note = input.note.trim();
  if (input.createdByUid) payload.createdByUid = input.createdByUid;

  // Хүргэлтийн бүс + бүтэцлэгдсэн хаяг (хоосон биш утгуудыг л бичнэ).
  if (input.deliveryType) payload.deliveryType = input.deliveryType;
  if (input.cityDistrict?.trim()) payload.cityDistrict = input.cityDistrict.trim();
  if (input.cityKhoroo?.trim()) payload.cityKhoroo = input.cityKhoroo.trim();
  if (input.street?.trim()) payload.street = input.street.trim();
  if (input.building?.trim()) payload.building = input.building.trim();
  if (input.entrance?.trim()) payload.entrance = input.entrance.trim();
  if (input.entranceCode?.trim()) payload.entranceCode = input.entranceCode.trim();
  if (input.addressNote?.trim()) payload.addressNote = input.addressNote.trim();
  if (input.province?.trim()) payload.province = input.province.trim();
  if (input.soum?.trim()) payload.soum = input.soum.trim();
  if (input.terminalName?.trim()) payload.terminalName = input.terminalName.trim();
  if (input.location) payload.location = input.location;

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
  fields: {
    status?: OrderStatus;
    cashPaid?: number;
    transferPaid?: number;
    driverNote?: string;
  },
): Promise<void> {
  const data: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (fields.status) {
    data.status = fields.status;
    if (fields.status === "picked_up") data.pickedUpAt = serverTimestamp();
    if (fields.status === "delivered") data.deliveredAt = serverTimestamp();
  }
  if (fields.cashPaid !== undefined) data.cashPaid = fields.cashPaid;
  if (fields.transferPaid !== undefined) data.transferPaid = fields.transferPaid;
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

// Амжилтгүй болгох (driver/admin) → status "failed" + шалтгаан (+ баталгаажуулах зураг).
export async function failOrder(
  id: string,
  reason: string,
  failedBy: string,
  proofs?: DeliveryProof[],
  note?: string,
): Promise<void> {
  const data: Record<string, unknown> = {
    status: "failed" as OrderStatus,
    failedReason: reason.trim(),
    failedAt: serverTimestamp(),
    failedBy,
    updatedAt: serverTimestamp(),
  };
  if (proofs && proofs.length > 0) data.failedProofs = arrayUnion(...proofs);
  const trimmed = note?.trim();
  if (trimmed) data.failedNote = trimmed;
  await updateDoc(doc(db, COLLECTION, id), data);
}

// Захиалгыг БҮРМӨСӨН устгах (зөвхөн admin — firestore.rules).
// Нэг document тул харилцагч, жолоочийн дэлгэцээс нэгэн зэрэг алга болно.
// Түгжигдсэн үлдэгдэл ба жолоочийн ачааллыг onOrderDeleted функц чөлөөлнө.
export async function deleteOrder(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

// Санамсаргүй "Амжилтгүй" дарсныг буцаах (driver/admin). Захиалга дахин идэвхтэй
// болж, амжилтгүйн мэдээлэл (шалтгаан/тайлбар/зураг) устана.
export async function revertFailedOrder(id: string, backTo: OrderStatus = "on_the_way") {
  await updateDoc(doc(db, COLLECTION, id), {
    status: backTo,
    failedReason: deleteField(),
    failedAt: deleteField(),
    failedBy: deleteField(),
    failedNote: deleteField(),
    failedProofs: deleteField(),
    updatedAt: serverTimestamp(),
  });
}

// "Дараа авна" → захиалгыг хойшлуулна. Амжилтгүй БОЛГОХГҮЙ: төлөв "assigned" руу
// буцаж, жолооч сонгосон өдөр нь хүргэлтийн урсгалыг дахин эхлүүлнэ.
export async function postponeOrder(
  id: string,
  scheduledDate: string,
  proofs?: DeliveryProof[],
  note?: string,
): Promise<void> {
  const data: Record<string, unknown> = {
    status: "assigned" as OrderStatus,
    scheduledDate,
    postponedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (proofs && proofs.length > 0) data.postponeProofs = arrayUnion(...proofs);
  const trimmed = note?.trim();
  if (trimmed) data.postponedNote = trimmed;
  await updateDoc(doc(db, COLLECTION, id), data);
}

// Хүргэгдсэн болгох + баталгаажуулах зураг (driver). Дор хаяж 1 зураг шаардана.
export async function deliverOrderWithProof(
  id: string,
  proofs: DeliveryProof[],
  fields?: { cashPaid?: number; transferPaid?: number; driverNote?: string },
): Promise<void> {
  if (!proofs || proofs.length === 0) {
    throw new Error("Хүргэлтийг баталгаажуулах дор хаяж 1 зураг шаардлагатай.");
  }
  const data: Record<string, unknown> = {
    status: "delivered" as OrderStatus,
    deliveredAt: serverTimestamp(),
    deliveryProofs: arrayUnion(...proofs),
    updatedAt: serverTimestamp(),
  };
  if (fields?.cashPaid !== undefined) data.cashPaid = fields.cashPaid;
  if (fields?.transferPaid !== undefined) data.transferPaid = fields.transferPaid;
  if (fields?.driverNote !== undefined) data.driverNote = fields.driverNote.trim();
  await updateDoc(doc(db, COLLECTION, id), data);
}

// Захиалгад жолооч оноох → статус "assigned" болно.
export async function assignDriver(
  orderId: string,
  driverId: string,
  driverName: string,
  driverPhone: string,
): Promise<void> {
  const ref = doc(db, COLLECTION, orderId);
  // Дууссан (delivered/failed/cancelled) захиалгад жолооч дахин оноохгүй.
  const snap = await getDoc(ref);
  const current = snap.data()?.status as OrderStatus | undefined;
  if (current && isFinalOrderStatus(current)) {
    throw new Error("Дууссан захиалгад жолооч дахин оноох боломжгүй.");
  }
  await updateDoc(ref, {
    driverId,
    driverName,
    driverPhone,
    autoAssigned: false, // гараар оноосон (Cloud Function авто-онооход true болгоно)
    status: "assigned" as OrderStatus,
    assignedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export interface BulkAssignResult {
  assigned: string[]; // амжилттай оноогдсон order id-ууд
  skipped: string[]; // дууссан тул алгассан order id-ууд
}

// Олон захиалгад нэг жолооч оноох (batch). Дууссан захиалгыг алгасна.
export async function bulkAssignDriver(
  orderIds: string[],
  driverId: string,
  driverName: string,
  driverPhone: string,
): Promise<BulkAssignResult> {
  const assigned: string[] = [];
  const skipped: string[] = [];
  const batch = writeBatch(db);

  for (const orderId of orderIds) {
    const ref = doc(db, COLLECTION, orderId);
    const snap = await getDoc(ref);
    const current = snap.data()?.status as OrderStatus | undefined;
    if (!snap.exists() || (current && isFinalOrderStatus(current))) {
      skipped.push(orderId);
      continue;
    }
    batch.update(ref, {
      driverId,
      driverName,
      driverPhone,
      autoAssigned: false,
      status: "assigned" as OrderStatus,
      assignedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    assigned.push(orderId);
  }

  if (assigned.length > 0) await batch.commit();
  return { assigned, skipped };
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
