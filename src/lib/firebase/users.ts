import {
  collection,
  deleteField,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { StaffRole, User } from "@/types";

const COLLECTION = "users";

// Профайл үүсгэх/засахад дамжуулах өгөгдөл (Firebase Auth uid аль хэдийн үүссэн).
export interface UserProfileInput {
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: StaffRole;
  companyId?: string; // зөвхөн partner
  driverId?: string; // зөвхөн driver
  isActive: boolean;
}

function toMillis(value: unknown): number {
  if (value && typeof value === "object" && "toMillis" in value) {
    return (value as { toMillis: () => number }).toMillis();
  }
  return typeof value === "number" ? value : Date.now();
}

function mapUser(uid: string, data: Record<string, unknown>): User {
  return {
    uid,
    name: (data.name as string) ?? "",
    email: (data.email as string) ?? "",
    phone: (data.phone as string) ?? "",
    role: (data.role as StaffRole) ?? "driver",
    companyId: data.companyId as string | undefined,
    driverId: data.driverId as string | undefined,
    isActive: Boolean(data.isActive),
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt ?? data.createdAt),
  };
}

// undefined талбаруудыг хасна (Firestore undefined хүлээж авдаггүй).
// Role-оос хамаарч companyId / driverId-г л үлдээнэ.
function buildDoc(input: UserProfileInput): Record<string, unknown> {
  const out: Record<string, unknown> = {
    name: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    role: input.role,
    isActive: input.isActive,
  };
  if (input.role === "partner" && input.companyId?.trim()) {
    out.companyId = input.companyId.trim();
  }
  if (input.role === "driver" && input.driverId?.trim()) {
    out.driverId = input.driverId.trim();
  }
  return out;
}

// Real-time жагсаалт (onSnapshot). Unsubscribe буцаана.
export function subscribeUsers(
  onData: (users: User[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => mapUser(d.id, d.data()))),
    (err) => onError?.(err),
  );
}

// uid-аар нэг профайл байгаа эсэх (давхар үүсгэхээс сэргийлнэ).
export async function userProfileExists(uid: string): Promise<boolean> {
  const snap = await getDoc(doc(db, COLLECTION, uid));
  return snap.exists();
}

// Шинэ профайл үүсгэнэ — users/{uid}. uid нь Firebase Auth-д аль хэдийн үүссэн байх ёстой.
export async function createUserProfile(input: UserProfileInput): Promise<void> {
  const uid = input.uid.trim();
  await setDoc(doc(db, COLLECTION, uid), {
    ...buildDoc(input),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

// Профайл засах — uid, createdAt-г хөндөхгүй. Role солиход хуучин companyId/driverId-г
// устгана (deleteField).
export async function updateUserProfile(
  uid: string,
  input: UserProfileInput,
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, uid), {
    ...buildDoc(input),
    companyId:
      input.role === "partner" && input.companyId?.trim()
        ? input.companyId.trim()
        : deleteField(),
    driverId:
      input.role === "driver" && input.driverId?.trim()
        ? input.driverId.trim()
        : deleteField(),
    updatedAt: serverTimestamp(),
  });
}

// Идэвхтэй/идэвхгүй солих (delete хийхгүй).
export async function setUserActive(uid: string, isActive: boolean): Promise<void> {
  await updateDoc(doc(db, COLLECTION, uid), {
    isActive,
    updatedAt: serverTimestamp(),
  });
}

// Админ хэрэглэгчийн профайл засах (нэр/имэйл/утас/идэвх — role хөндөхгүй).
export interface AdminProfileInput {
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
}

export async function updateAdminUser(
  uid: string,
  input: AdminProfileInput,
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, uid), {
    name: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    isActive: input.isActive,
    updatedAt: serverTimestamp(),
  });
}
