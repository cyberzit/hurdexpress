import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { AppUser, UserRole } from "@/types";

const googleProvider = new GoogleAuthProvider();

// Firestore-д хэрэглэгчийн профайл байхгүй бол үүсгэнэ.
async function ensureUserDoc(
  uid: string,
  data: { email: string | null; displayName: string | null; role?: UserRole },
) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      email: data.email,
      displayName: data.displayName,
      role: data.role ?? "customer",
      createdAt: serverTimestamp(),
    });
  }
}

export async function registerWithEmail(
  email: string,
  password: string,
  displayName: string,
) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });
  await ensureUserDoc(cred.user.uid, { email, displayName });
  return cred.user;
}

export async function loginWithEmail(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function loginWithGoogle() {
  const cred = await signInWithPopup(auth, googleProvider);
  await ensureUserDoc(cred.user.uid, {
    email: cred.user.email,
    displayName: cred.user.displayName,
  });
  return cred.user;
}

export async function logout() {
  await signOut(auth);
}

// Firestore-оос хэрэглэгчийн профайлыг (role зэрэг) авах.
export async function fetchUserProfile(uid: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    uid,
    email: data.email ?? null,
    displayName: data.displayName ?? null,
    phone: data.phone,
    role: (data.role as UserRole) ?? "customer",
    createdAt: data.createdAt?.toMillis?.() ?? Date.now(),
  };
}
