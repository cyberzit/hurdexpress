import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { StaffRole, UserDoc } from "@/types";

export interface LoggedInUser extends UserDoc {
  uid: string;
}

// Нэвтрэх явцад гарах алдааг ялгахын тулд тусгай Error.
export class AuthError extends Error {}

// Email/password-оор нэвтэрч, users/{uid} document-ийг уншина.
export async function loginAndLoadUser(
  email: string,
  password: string,
): Promise<LoggedInUser> {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);

  const snap = await getDoc(doc(db, "users", cred.user.uid));
  if (!snap.exists()) {
    throw new AuthError("Хэрэглэгчийн мэдээлэл системд бүртгэлгүй байна.");
  }

  const data = snap.data() as Partial<UserDoc>;

  if (!data.role) {
    throw new AuthError("Таны эрх тодорхойлогдоогүй байна. Админд хандана уу.");
  }
  if (data.isActive === false) {
    throw new AuthError("Таны эрх идэвхгүй байна.");
  }

  return { uid: cred.user.uid, ...(data as UserDoc) };
}

// Role-оос хамаарч чиглүүлэх зам.
export function rolePath(role: StaffRole): string {
  switch (role) {
    case "admin":
      return "/admin/dashboard";
    case "partner":
      return "/partner/orders";
    case "driver":
      return "/driver/orders";
    default:
      return "/login";
  }
}

// Firebase Auth-ийн алдааны кодыг монгол мессеж болгох.
export function mapAuthError(error: unknown): string {
  // Бидний өөрсдийн AuthError мессежийг шууд буцаана.
  if (error instanceof AuthError) return error.message;

  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : "";

  switch (code) {
    case "auth/invalid-email":
      return "Имэйл хаяг буруу байна.";
    case "auth/user-disabled":
      return "Энэ бүртгэл түр хаагдсан байна.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Имэйл эсвэл нууц үг буруу байна.";
    case "auth/email-already-in-use":
      return "Энэ имэйл аль хэдийн бүртгэгдсэн байна.";
    case "auth/weak-password":
      return "Нууц үг хэтэрхий богино байна (6+ тэмдэгт).";
    case "auth/operation-not-allowed":
      return "Email/Password нэвтрэлт Firebase дээр идэвхжээгүй байна. Console > Authentication > Sign-in method дээр идэвхжүүлнэ үү.";
    case "auth/too-many-requests":
      return "Хэт олон удаа оролдлоо. Түр хүлээгээд дахин оролдоно уу.";
    case "auth/network-request-failed":
      return "Сүлжээний алдаа. Интернэт холболтоо шалгана уу.";
    case "permission-denied":
      return "Firestore-д бичих эрх хүрэлцэхгүй байна (security rules-ээ шалгана уу).";
    case "unavailable":
      return "Firestore холбогдсонгүй. Database үүсгэсэн эсэхээ шалгана уу.";
    default:
      return code
        ? `Алдаа гарлаа: ${code}`
        : "Алдаа гарлаа. Дахин оролдоно уу.";
  }
}
