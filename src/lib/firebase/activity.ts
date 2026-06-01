import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  Activity,
  AppNotification,
  NotificationType,
  StaffRole,
} from "@/types";

// Бүх admin-д хүрэх broadcast аудиенс.
export const ADMIN_AUDIENCE = "__admins__";

const ACTIVITIES = "activities";
const NOTIFICATIONS = "notifications";

function toMillis(value: unknown): number {
  if (value && typeof value === "object" && "toMillis" in value) {
    return (value as { toMillis: () => number }).toMillis();
  }
  return typeof value === "number" ? value : Date.now();
}

// ─── Activity log ───────────────────────────────────────────

export interface ActivityInput {
  orderId: string;
  orderCode: string;
  action: string;
  actorId: string;
  actorName: string;
  actorRole: StaffRole;
}

export async function logActivity(input: ActivityInput): Promise<void> {
  await addDoc(collection(db, ACTIVITIES), {
    ...input,
    createdAt: serverTimestamp(),
  });
}

export function subscribeActivities(
  orderId: string,
  onData: (activities: Activity[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const q = query(collection(db, ACTIVITIES), where("orderId", "==", orderId));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        orderId: d.data().orderId,
        orderCode: d.data().orderCode,
        action: d.data().action,
        actorId: d.data().actorId,
        actorName: d.data().actorName,
        actorRole: d.data().actorRole,
        createdAt: toMillis(d.data().createdAt),
      })) as Activity[];
      list.sort((a, b) => a.createdAt - b.createdAt); // эртнийх нь эхэнд
      onData(list);
    },
    (err) => onError?.(err),
  );
}

// ─── Notifications ──────────────────────────────────────────

export interface NotificationInput {
  title: string;
  message: string;
  type: NotificationType;
}

// Нэг буюу хэд хэдэн хэрэглэгчид мэдэгдэл үүсгэх.
export async function notifyUsers(
  userIds: string[],
  input: NotificationInput,
): Promise<void> {
  const targets = [...new Set(userIds.filter(Boolean))];
  await Promise.all(
    targets.map((userId) =>
      addDoc(collection(db, NOTIFICATIONS), {
        userId,
        ...input,
        isRead: false,
        createdAt: serverTimestamp(),
      }),
    ),
  );
}

// Тухайн аудиенс (uid-ууд)-д хамаарах мэдэгдлийг realtime ажиглах.
export function subscribeNotifications(
  audienceIds: string[],
  onData: (notifications: AppNotification[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const ids = audienceIds.filter(Boolean).slice(0, 10);
  if (ids.length === 0) {
    onData([]);
    return () => {};
  }
  // orderBy-гүй (composite index шаардахгүй) → client дээр эрэмбэлнэ.
  const q = query(collection(db, NOTIFICATIONS), where("userId", "in", ids));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        userId: d.data().userId,
        title: d.data().title,
        message: d.data().message,
        type: d.data().type,
        isRead: Boolean(d.data().isRead),
        createdAt: toMillis(d.data().createdAt),
      })) as AppNotification[];
      list.sort((a, b) => b.createdAt - a.createdAt);
      onData(list.slice(0, 30));
    },
    (err) => onError?.(err),
  );
}

export async function markNotificationRead(id: string): Promise<void> {
  await updateDoc(doc(db, NOTIFICATIONS, id), { isRead: true });
}

export async function markAllRead(notifications: AppNotification[]): Promise<void> {
  await Promise.all(
    notifications
      .filter((n) => !n.isRead)
      .map((n) => updateDoc(doc(db, NOTIFICATIONS, n.id), { isRead: true })),
  );
}

// driverId (drivers doc id) → тухайн жолоочийн user uid (admin ашиглана).
export async function findUserIdByDriverId(driverId: string): Promise<string | null> {
  const q = query(
    collection(db, "users"),
    where("driverId", "==", driverId),
    limit(1),
  );
  const snap = await getDocs(q);
  return snap.empty ? null : snap.docs[0].id;
}
