import {
  addDoc,
  collection,
  doc,
  getDoc,
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
  serviceDistricts?: string[]; // үйлчилдэг дүүргүүд (auto-dispatch matching)
  loginEmail?: string; // нэвтрэх имэйл (Auth account-тэй бол)
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
    currentOrderCount: (data.currentOrderCount as number) ?? 0,
    serviceDistricts: Array.isArray(data.serviceDistricts)
      ? (data.serviceDistricts as string[])
      : undefined,
    lastLocation: data.lastLocation
      ? {
          lat: (data.lastLocation as Record<string, unknown>).lat as number,
          lng: (data.lastLocation as Record<string, unknown>).lng as number,
        }
      : undefined,
    authUid: data.authUid as string | undefined,
    loginEmail: data.loginEmail as string | undefined,
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
  if (input.serviceDistricts && input.serviceDistricts.length > 0) {
    out.serviceDistricts = input.serviceDistricts;
  }
  if (input.loginEmail?.trim()) out.loginEmail = input.loginEmail.trim();
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
    currentOrderCount: 0, // auto-dispatch load balancing — анхдагч 0
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

// Идэвхтэй/идэвхгүй солих (delete хийхгүй). Холбоотой Auth хэрэглэгчийг sync.
export async function setDriverActive(id: string, isActive: boolean): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  const snap = await getDoc(ref);
  await updateDoc(ref, { isActive, updatedAt: serverTimestamp() });
  const authUid = snap.data()?.authUid as string | undefined;
  if (authUid) await syncDriverUserActive(authUid, isActive);
}

// users/{authUid}.isActive-г жолоочийн идэвхтэй төлөвтэй sync хийнэ.
export async function syncDriverUserActive(
  authUid: string,
  isActive: boolean,
): Promise<void> {
  await updateDoc(doc(db, "users", authUid), {
    isActive,
    updatedAt: serverTimestamp(),
  }).catch(() => {});
}

export interface DriverLoginInput {
  email: string;
  password: string;
}

/**
 * Тухайн жолоочид Firebase Auth + users/{uid} (role:"driver", driverId) үүсгэж,
 * driver doc-д authUid/loginEmail бичнэ. (Аль хэдийн Auth-тэй жолоочид дахин дуудахгүй.)
 */
export async function createDriverLogin(
  driverId: string,
  driver: { name: string; phone: string },
  login: DriverLoginInput,
): Promise<string> {
  const { createStaffUser } = await import("@/lib/admin-service");
  const uid = await createStaffUser({
    name: driver.name,
    email: login.email,
    phone: driver.phone,
    password: login.password,
    role: "driver",
    driverId,
    isActive: true,
  });
  await updateDoc(doc(db, COLLECTION, driverId), {
    authUid: uid,
    loginEmail: login.email.trim(),
    updatedAt: serverTimestamp(),
  });
  return uid;
}

/**
 * Шинэ жолооч + нэвтрэх эрхийг хамт үүсгэнэ:
 *  1) drivers document  2) Auth user + users/{uid}  3) authUid/loginEmail бичнэ.
 * Auth алдвал driver үлдэнэ — дараа нь "Login account үүсгэх"-ээр нэмж болно.
 */
export async function addDriverWithLogin(
  input: DriverInput,
  login: DriverLoginInput,
): Promise<{ driverId: string; uid: string }> {
  const driverId = await addDriver({ ...input, loginEmail: login.email });
  const uid = await createDriverLogin(
    driverId,
    { name: input.name, phone: input.phone },
    login,
  );
  return { driverId, uid };
}
