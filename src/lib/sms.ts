import { getFunctions, httpsCallable } from "firebase/functions";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  type Unsubscribe,
} from "firebase/firestore";
import { app, db } from "@/lib/firebase";
import type { SmsLog, SmsStatus } from "@/types";

// Захиалгын төлөв бүрийн SMS текст (нэг эх сурвалж).
export const SMS_TEMPLATES = {
  created: (code: string) =>
    `Таны ${code} захиалга HurdExpress хүргэлтэд бүртгэгдлээ.`,
  assigned: (code: string) => `Таны ${code} захиалга жолоочид оноогдлоо.`,
  delivered: (code: string) => `Таны ${code} захиалга амжилттай хүргэгдлээ.`,
};

// ⚠️ Бодит SMS илгээх нь зөвхөн Firebase Functions дотор (API key client-д ил гарахгүй).
// Энэ нь admin-ийн "дахин илгээх" товчны callable wrapper.
export interface ResendSmsInput {
  orderId: string;
  orderCode: string;
  phone: string;
  message: string;
}

export async function resendOrderSms(input: ResendSmsInput): Promise<void> {
  if (!app) throw new Error("Firebase тохируулаагүй байна.");
  const functions = getFunctions(app, "us-central1");
  const callable = httpsCallable(functions, "sendOrderSms");
  await callable(input);
}

function toMillis(value: unknown): number {
  if (value && typeof value === "object" && "toMillis" in value) {
    return (value as { toMillis: () => number }).toMillis();
  }
  return typeof value === "number" ? value : Date.now();
}

// SMS лог (admin) — realtime.
export function subscribeSmsLogs(
  onData: (logs: SmsLog[]) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  const q = query(collection(db, "smsLogs"), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snap) =>
      onData(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            orderId: data.orderId ?? "",
            orderCode: data.orderCode ?? "",
            phone: data.phone ?? "",
            message: data.message ?? "",
            provider: data.provider ?? "",
            status: (data.status as SmsStatus) ?? "pending",
            errorMessage: data.errorMessage as string | undefined,
            createdAt: toMillis(data.createdAt),
            sentAt: data.sentAt ? toMillis(data.sentAt) : undefined,
          };
        }),
      ),
    (err) => onError?.(err),
  );
}
