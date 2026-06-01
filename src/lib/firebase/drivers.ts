import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Driver, DriverStatus, VehicleType } from "@/types";

const COLLECTION = "drivers";

export interface DriverInput {
  name: string;
  phone: string;
  email?: string;
  vehicleType: VehicleType;
  plateNumber?: string;
  currentStatus: DriverStatus;
  isActive: boolean;
}

function toMillis(value: unknown): number {
  if (value && typeof value === "object" && "toMillis" in value) {
    return (value as { toMillis: () => number }).toMillis();
  }
  return typeof value === "number" ? value : Date.now();
}

function mapDriver(id: string, data: Record<string, unknown>): Driver {
  return {
    id,
    name: (data.name as string) ?? "",
    phone: (data.phone as string) ?? "",
    email: data.email as string | undefined,
    vehicleType: (data.vehicleType as VehicleType) ?? "car",
    plateNumber: data.plateNumber as string | undefined,
    currentStatus: (data.currentStatus as DriverStatus) ?? "offline",
    isActive: Boolean(data.isActive),
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
  };
}

// undefined талбаруудыг хасна (Firestore undefined хүлээж авдаггүй).
function buildDoc(input: DriverInput): Record<string, unknown> {
  const out: Record<string, unknown> = {
    name: input.name.trim(),
    phone: input.phone.trim(),
    vehicleType: input.vehicleType,
    currentStatus: input.currentStatus,
    isActive: input.isActive,
  };
  if (input.email?.trim()) out.email = input.email.trim();
  if (input.plateNumber?.trim()) out.plateNumber = input.plateNumber.trim();
  return out;
}

// Real-time жагсаалт (onSnapshot). Unsubscribe буцаана.
export function subscribeDrivers(
  onData: (drivers: Driver[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => mapDriver(d.id, d.data()))),
    (err) => onError?.(err),
  );
}

export async function addDriver(input: DriverInput): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTION), {
    ...buildDoc(input),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateDriver(id: string, input: DriverInput): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    ...buildDoc(input),
    updatedAt: serverTimestamp(),
  });
}

// Идэвхтэй/идэвхгүй солих (delete хийхгүй).
export async function setDriverActive(id: string, isActive: boolean): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    isActive,
    updatedAt: serverTimestamp(),
  });
}
