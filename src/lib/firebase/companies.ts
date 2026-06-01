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
import type { Company } from "@/types";

const COLLECTION = "companies";

// Форм/үүсгэх, засахад дамжуулах өгөгдөл (id, timestamp-гүй).
export interface CompanyInput {
  name: string;
  phone: string;
  email?: string;
  address: string;
  contractPrice: number;
  contactPerson?: string;
  note?: string;
  managerName?: string;
  managerEmail?: string;
  isActive: boolean;
}

function toMillis(value: unknown): number {
  if (value && typeof value === "object" && "toMillis" in value) {
    return (value as { toMillis: () => number }).toMillis();
  }
  return typeof value === "number" ? value : Date.now();
}

function mapCompany(id: string, data: Record<string, unknown>): Company {
  return {
    id,
    name: (data.name as string) ?? "",
    phone: (data.phone as string) ?? "",
    email: data.email as string | undefined,
    address: (data.address as string) ?? "",
    contractPrice: (data.contractPrice as number) ?? 0,
    contactPerson: data.contactPerson as string | undefined,
    note: data.note as string | undefined,
    managerName: data.managerName as string | undefined,
    managerEmail: data.managerEmail as string | undefined,
    isActive: Boolean(data.isActive),
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
  };
}

// undefined талбаруудыг хасна (Firestore undefined хүлээж авдаггүй).
function buildDoc(input: CompanyInput): Record<string, unknown> {
  const out: Record<string, unknown> = {
    name: input.name.trim(),
    phone: input.phone.trim(),
    address: input.address.trim(),
    contractPrice: input.contractPrice,
    isActive: input.isActive,
  };
  if (input.email?.trim()) out.email = input.email.trim();
  if (input.contactPerson?.trim()) out.contactPerson = input.contactPerson.trim();
  if (input.note?.trim()) out.note = input.note.trim();
  if (input.managerName?.trim()) out.managerName = input.managerName.trim();
  if (input.managerEmail?.trim()) out.managerEmail = input.managerEmail.trim();
  return out;
}

// Real-time жагсаалт (onSnapshot). Unsubscribe буцаана.
export function subscribeCompanies(
  onData: (companies: Company[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => mapCompany(d.id, d.data()))),
    (err) => onError?.(err),
  );
}

// Нэг байгууллага унших (partner-д companyName авахад).
export async function getCompany(id: string): Promise<Company | null> {
  const snap = await getDoc(doc(db, COLLECTION, id));
  return snap.exists() ? mapCompany(snap.id, snap.data()) : null;
}

export async function addCompany(input: CompanyInput): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTION), {
    ...buildDoc(input),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

// Партнер менежерийн нэвтрэх мэдээлэл.
export interface PartnerManagerInput {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface CreatedCompanyPartner {
  companyId: string;
  uid: string;
  email: string;
}

/**
 * Шинэ харилцагч + партнер хэрэглэгчийг хамт үүсгэнэ:
 *  1) company document (managerName/managerEmail-тэй)
 *  2) Firebase Auth хэрэглэгч + users/{uid} (role:"partner", companyId)
 * Хэрэв хэрэглэгч үүсгэхэд алдвал company үлдэнэ — партнерийг дараа нь
 * /admin/users-аас тухайн companyId-аар нэмж болно.
 */
export async function createCompanyWithPartner(
  input: CompanyInput,
  manager: PartnerManagerInput,
): Promise<CreatedCompanyPartner> {
  // Динамик import — admin-service зөвхөн энд хэрэгтэй (Auth secondary app).
  const { createStaffUser } = await import("@/lib/admin-service");

  const companyId = await addCompany({
    ...input,
    managerName: manager.name,
    managerEmail: manager.email,
  });

  const uid = await createStaffUser({
    name: manager.name,
    email: manager.email,
    phone: manager.phone,
    password: manager.password,
    role: "partner",
    companyId,
    isActive: true,
  });

  return { companyId, uid, email: manager.email.trim() };
}

export async function updateCompany(id: string, input: CompanyInput): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    ...buildDoc(input),
    updatedAt: serverTimestamp(),
  });
}

// Идэвхтэй/идэвхгүй солих (delete хийхгүй).
export async function setCompanyActive(id: string, isActive: boolean): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    isActive,
    updatedAt: serverTimestamp(),
  });
}
