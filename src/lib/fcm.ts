import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type MessagePayload,
} from "firebase/messaging";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { app, db, isFirebaseConfigured } from "@/lib/firebase";
import type { StaffRole } from "@/types";

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

// FCM token авч userDevices/{token} document-д хадгална.
// Permission өгөөгүй, дэмжээгүй, эсвэл тохиргоо дутуу бол чимээгүй буцна.
export async function registerFcmToken(
  userId: string,
  role: StaffRole,
): Promise<string | null> {
  try {
    if (!isFirebaseConfigured || !VAPID_KEY || !app) return null;
    if (typeof window === "undefined" || !("Notification" in window)) return null;
    if (!(await isSupported())) return null;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const swReg = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js",
    );
    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swReg,
    });
    if (!token) return null;

    // Token-ийг ID болгож upsert → давхцалаас сэргийлнэ.
    await setDoc(
      doc(db, "userDevices", token),
      {
        userId,
        role,
        token,
        platform: "web",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    return token;
  } catch {
    return null;
  }
}

// Апп нээлттэй (foreground) үед ирэх мессеж.
export async function listenForegroundMessages(
  onMessageReceived: (payload: MessagePayload) => void,
): Promise<(() => void) | undefined> {
  if (!isFirebaseConfigured || !app || typeof window === "undefined") return;
  if (!(await isSupported())) return;
  const messaging = getMessaging(app);
  return onMessage(messaging, onMessageReceived);
}
