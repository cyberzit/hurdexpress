import { deleteApp, initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db, firebaseConfig } from "@/lib/firebase";
import type { StaffRole, UserDoc } from "@/types";

export interface NewStaffInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: StaffRole;
  companyId?: string;
  driverId?: string;
  isActive: boolean;
}

export interface StaffListItem extends UserDoc {
  uid: string;
}

/**
 * Шинэ ажилтан үүсгэнэ.
 *
 * Анхаарах зүйл: `createUserWithEmailAndPassword`-г үндсэн апп дээр дуудвал
 * админ автоматаар шинэ хэрэглэгчээр солигдон нэвтэрчихдэг. Үүнээс сэргийлж
 * түр зуурын "secondary" Firebase апп дээр хэрэглэгчийг үүсгээд тэр даруй
 * гаргана. Firestore document-ийг үндсэн (админ) сесс дээр бичих тул rules-ийн
 * `isAdmin()` шалгуур ажиллана.
 */
export async function createStaffUser(input: NewStaffInput): Promise<string> {
  // Өвөрмөц нэр — дараалан үүсгэхэд нэр давхцахаас сэргийлнэ.
  const secondary = initializeApp(firebaseConfig, `staff-creator-${Date.now()}`);
  const secondaryAuth = getAuth(secondary);

  try {
    const cred = await createUserWithEmailAndPassword(
      secondaryAuth,
      input.email.trim(),
      input.password,
    );
    const uid = cred.user.uid;

    // Firestore-ийг үндсэн (админ) сессээр бичнэ → rules: isAdmin().
    await setDoc(doc(db, "users", uid), {
      name: input.name.trim(),
      email: input.email.trim(),
      phone: input.phone.trim(),
      role: input.role,
      ...(input.companyId?.trim() ? { companyId: input.companyId.trim() } : {}),
      ...(input.driverId?.trim() ? { driverId: input.driverId.trim() } : {}),
      isActive: input.isActive,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return uid;
  } finally {
    // Секондар сессийг цэвэрлэнэ (админы үндсэн сесст нөлөөлөхгүй).
    await signOut(secondaryAuth).catch(() => {});
    await deleteApp(secondary).catch(() => {});
  }
}

// Бүх ажилтны жагсаалт (зөвхөн admin унших эрхтэй — rules).
export async function listStaff(): Promise<StaffListItem[]> {
  const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ uid: d.id, ...(d.data() as UserDoc) }));
}

// Ажилтны идэвхтэй эсэхийг солих.
export async function setStaffActive(uid: string, isActive: boolean): Promise<void> {
  await updateDoc(doc(db, "users", uid), { isActive });
}

// Нууц үг сэргээх имэйл илгээх (password reset flow — UI-д дараа холбоно).
// Firebase Auth өөрөө reset линк бүхий имэйл илгээнэ.
export async function sendStaffPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}
