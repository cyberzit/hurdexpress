import { HttpsError, onCall, onRequest } from "firebase-functions/v2/https";
import {
  onDocumentCreated,
  onDocumentUpdated,
} from "firebase-functions/v2/firestore";
import { getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { sendSms, type SmsConfig } from "./sms";

// Functions runtime-д default service account ашиглана (тусдаа түлхүүр хэрэггүй).
if (!getApps().length) initializeApp();
const db = getFirestore();

// Утсыг бүтнээр буцаахгүй — зөвхөн сүүлийн 4 орон.
function maskPhone(phone?: string): string {
  const digits = (phone ?? "").replace(/\D/g, "");
  return digits.length >= 4 ? `••••${digits.slice(-4)}` : "••••";
}

function toMillis(value: unknown): number | null {
  return value instanceof Timestamp ? value.toMillis() : null;
}

/**
 * Public tracking — GET/POST /api/track-order?code=HX123456
 * orders collection-оос orderCode-оор хайж, зөвхөн хязгаарлагдмал safe талбар буцаана.
 * (receiverAddress буцаахгүй, receiverPhone masked.)
 */
export const trackOrder = onRequest(
  { cors: true, region: "us-central1" },
  async (req, res) => {
    const code = String(req.query.code ?? req.body?.code ?? "")
      .trim()
      .toUpperCase();

    if (!code) {
      res.status(400).json({ error: "Захиалгын дугаар (code) шаардлагатай." });
      return;
    }

    try {
      const snap = await db
        .collection("orders")
        .where("orderCode", "==", code)
        .limit(1)
        .get();

      if (snap.empty) {
        res.status(404).json({ found: false });
        return;
      }

      const d = snap.docs[0].data();
      res.json({
        found: true,
        orderCode: d.orderCode,
        status: d.status,
        companyName: d.companyName ?? null,
        receiverName: d.receiverName ?? null,
        receiverPhoneMasked: maskPhone(d.receiverPhone),
        driverName: d.driverName ?? null,
        driverPhone: d.driverPhone ?? null,
        createdAt: toMillis(d.createdAt),
        deliveredAt: toMillis(d.deliveredAt),
      });
    } catch {
      res.status(500).json({ error: "Серверийн алдаа гарлаа." });
    }
  },
);

// ── Push notification helpers ────────────────────────────────

// Хэрэглэгчид notification doc бичиж, бүртгэлтэй төхөөрөмжүүд рүү push илгээнэ.
async function notifyUser(
  userId: string,
  title: string,
  body: string,
  type: "order" | "driver" | "system",
): Promise<void> {
  // 1. Notification center-т харагдах doc (bell realtime шинэчлэгдэнэ).
  await db.collection("notifications").add({
    userId,
    title,
    message: body,
    type,
    isRead: false,
    createdAt: FieldValue.serverTimestamp(),
  });

  // 2. Бүртгэлтэй FCM token-ууд руу push (data-only — SW render хийнэ).
  const devices = await db
    .collection("userDevices")
    .where("userId", "==", userId)
    .get();
  const tokens = devices.docs
    .map((d) => d.data().token as string)
    .filter(Boolean);
  if (tokens.length === 0) return;

  const resp = await getMessaging().sendEachForMulticast({
    tokens,
    data: { title, body, type },
  });

  // Хүчингүй token-уудыг цэвэрлэнэ.
  const stale: Promise<unknown>[] = [];
  resp.responses.forEach((r, i) => {
    const code = r.error?.code;
    if (
      !r.success &&
      (code === "messaging/registration-token-not-registered" ||
        code === "messaging/invalid-argument")
    ) {
      stale.push(devices.docs[i].ref.delete());
    }
  });
  await Promise.all(stale);
}

async function notifyAdmins(
  title: string,
  body: string,
  type: "order" | "driver" | "system",
): Promise<void> {
  const admins = await db
    .collection("users")
    .where("role", "==", "admin")
    .get();
  await Promise.all(
    admins.docs
      .filter((d) => d.data().isActive !== false)
      .map((d) => notifyUser(d.id, title, body, type)),
  );
}

// ── SMS helpers ──────────────────────────────────────────────

// Тохиргоог унших: settings/general (нууц биш) + settings/sms (apiKey).
async function loadSmsConfig(): Promise<SmsConfig> {
  const [general, secret] = await Promise.all([
    db.doc("settings/general").get(),
    db.doc("settings/sms").get(),
  ]);
  const g = general.data() || {};
  const s = secret.data() || {};
  return {
    enabled: g.smsEnabled === true,
    provider: g.smsProvider === "custom" ? "custom" : "mock",
    apiUrl: g.smsApiUrl,
    apiKey: s.smsApiKey,
  };
}

// SMS log doc үүсгээд илгээж, status шинэчилнэ.
async function doSendSms(
  config: SmsConfig,
  payload: { orderId: string; orderCode: string; phone: string; message: string },
): Promise<void> {
  const logRef = await db.collection("smsLogs").add({
    orderId: payload.orderId,
    orderCode: payload.orderCode,
    phone: payload.phone,
    message: payload.message,
    provider: config.provider,
    status: "pending",
    createdAt: FieldValue.serverTimestamp(),
  });

  const result = await sendSms(payload.phone, payload.message, config);
  await logRef.update({
    status: result.success ? "sent" : "failed",
    provider: result.provider,
    ...(result.success ? { sentAt: FieldValue.serverTimestamp() } : {}),
    ...(result.error ? { errorMessage: result.error } : {}),
  });
}

// smsEnabled бол л автомат илгээх (триггерүүдэд).
async function sendAndLogSms(payload: {
  orderId: string;
  orderCode: string;
  phone: string;
  message: string;
}): Promise<void> {
  if (!payload.phone) return;
  const config = await loadSmsConfig();
  if (!config.enabled) return;
  await doSendSms(config, payload);
}

// ── Order triggers ───────────────────────────────────────────

// Шинэ захиалга → admin-уудад мэдэгдэл + хүлээн авагчид SMS.
export const onOrderCreated = onDocumentCreated(
  "orders/{orderId}",
  async (event) => {
    const o = event.data?.data();
    if (!o) return;
    await notifyAdmins(
      "Шинэ захиалга",
      `${o.orderCode} захиалга үүслээ`,
      "order",
    );
    await sendAndLogSms({
      orderId: event.params.orderId,
      orderCode: o.orderCode,
      phone: o.receiverPhone,
      message: `Таны ${o.orderCode} захиалга HurdExpress хүргэлтэд бүртгэгдлээ.`,
    });
  },
);

// Захиалга шинэчлэгдэхэд:
//  - жолооч шинээр оноогдвол → driver-т
//  - delivered болгоход → partner-т
export const onOrderUpdated = onDocumentUpdated(
  "orders/{orderId}",
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;

    // Жолооч шинээр оноогдсон
    if (after.driverId && before.driverId !== after.driverId) {
      const users = await db
        .collection("users")
        .where("driverId", "==", after.driverId)
        .limit(1)
        .get();
      if (!users.empty) {
        await notifyUser(
          users.docs[0].id,
          "Шинэ хүргэлт",
          `${after.orderCode} захиалга танд оноогдлоо`,
          "driver",
        );
      }
      // Хүлээн авагчид SMS
      await sendAndLogSms({
        orderId: event.params.orderId,
        orderCode: after.orderCode,
        phone: after.receiverPhone,
        message: `Таны ${after.orderCode} захиалга жолоочид оноогдлоо.`,
      });
    }

    // Хүргэгдсэн
    if (
      after.status === "delivered" &&
      before.status !== "delivered"
    ) {
      if (after.createdByUid) {
        await notifyUser(
          after.createdByUid,
          "Захиалга хүргэгдлээ",
          `${after.orderCode} хүргэлт амжилттай дууслаа`,
          "order",
        );
      }
      // Хүлээн авагчид SMS
      await sendAndLogSms({
        orderId: event.params.orderId,
        orderCode: after.orderCode,
        phone: after.receiverPhone,
        message: `Таны ${after.orderCode} захиалга амжилттай хүргэгдлээ.`,
      });
    }

    // Амжилтгүй болсон → partner-т мэдэгдэл
    if (
      after.status === "failed" &&
      before.status !== "failed" &&
      after.createdByUid
    ) {
      await notifyUser(
        after.createdByUid,
        "Захиалга амжилтгүй",
        `${after.orderCode}: ${after.failedReason || "Амжилтгүй болсон"}`,
        "order",
      );
    }

    // Цуцлагдсан → admin-уудад мэдэгдэл (partner цуцалсныг хянана)
    if (after.status === "cancelled" && before.status !== "cancelled") {
      await notifyAdmins(
        "Захиалга цуцлагдсан",
        `${after.orderCode}: ${after.cancelReason || "Цуцлагдсан"}`,
        "order",
      );
    }
  },
);

// Admin "дахин илгээх" — callable. smsEnabled-ээс үл хамааран илгээнэ.
export const sendOrderSms = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Нэвтрэх шаардлагатай.");
  const userDoc = await db.doc(`users/${uid}`).get();
  if (userDoc.data()?.role !== "admin") {
    throw new HttpsError("permission-denied", "Зөвхөн админ.");
  }

  const { orderId, orderCode, phone, message } = request.data || {};
  if (!phone || !message) {
    throw new HttpsError("invalid-argument", "phone болон message шаардлагатай.");
  }

  const config = await loadSmsConfig();
  await doSendSms(config, {
    orderId: orderId || "",
    orderCode: orderCode || "",
    phone,
    message,
  });
  return { ok: true };
});
