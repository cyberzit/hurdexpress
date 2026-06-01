import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Address, Shipment, ShipmentStatus, TrackingEvent } from "@/types";

const COLLECTION = "shipments";

// HX-2026-XXXXXX хэлбэрийн tracking дугаар үүсгэх.
function generateTrackingNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `HX-${year}-${rand}`;
}

export interface CreateShipmentInput {
  ownerUid: string;
  from: Address;
  to: Address;
  description?: string;
  weightKg?: number;
  priceMnt?: number;
}

export async function createShipment(input: CreateShipmentInput): Promise<string> {
  const now = Date.now();
  const trackingNumber = generateTrackingNumber();
  const firstEvent: TrackingEvent = { status: "created", at: now };

  const ref = await addDoc(collection(db, COLLECTION), {
    ...input,
    trackingNumber,
    status: "created" as ShipmentStatus,
    history: [firstEvent],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

// Firestore document -> Shipment маппинг.
function mapShipment(id: string, data: Record<string, unknown>): Shipment {
  const toMs = (v: unknown) =>
    typeof v === "object" && v !== null && "toMillis" in v
      ? (v as { toMillis: () => number }).toMillis()
      : (v as number) ?? Date.now();

  return {
    id,
    trackingNumber: data.trackingNumber as string,
    ownerUid: data.ownerUid as string,
    courierUid: data.courierUid as string | undefined,
    status: data.status as ShipmentStatus,
    from: data.from as Address,
    to: data.to as Address,
    description: data.description as string | undefined,
    weightKg: data.weightKg as number | undefined,
    priceMnt: data.priceMnt as number | undefined,
    photoUrl: data.photoUrl as string | undefined,
    history: (data.history as TrackingEvent[]) ?? [],
    createdAt: toMs(data.createdAt),
    updatedAt: toMs(data.updatedAt),
  };
}

// Хэрэглэгчийн өөрийн захиалгууд.
export async function getShipmentsByOwner(ownerUid: string): Promise<Shipment[]> {
  const q = query(
    collection(db, COLLECTION),
    where("ownerUid", "==", ownerUid),
    orderBy("createdAt", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapShipment(d.id, d.data()));
}

// Tracking дугаараар нэг захиалга хайх (нийтэд нээлттэй хайлт).
export async function getShipmentByTrackingNumber(
  trackingNumber: string,
): Promise<Shipment | null> {
  const q = query(
    collection(db, COLLECTION),
    where("trackingNumber", "==", trackingNumber.trim().toUpperCase()),
    limit(1),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return mapShipment(d.id, d.data());
}

export async function getShipmentById(id: string): Promise<Shipment | null> {
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  return mapShipment(snap.id, snap.data());
}

// Захиалгын төлвийг шинэчилж, түүхэнд бичлэг нэмэх.
export async function updateShipmentStatus(
  id: string,
  status: ShipmentStatus,
  event: Omit<TrackingEvent, "status" | "at">,
): Promise<void> {
  const current = await getShipmentById(id);
  if (!current) throw new Error("Захиалга олдсонгүй");

  const newEvent: TrackingEvent = { status, at: Date.now(), ...event };
  await updateDoc(doc(db, COLLECTION, id), {
    status,
    history: [...current.history, newEvent],
    updatedAt: serverTimestamp(),
  });
}
