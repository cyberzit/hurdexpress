import { HttpsError, onCall, onRequest } from "firebase-functions/v2/https";
import {
  onDocumentCreated,
  onDocumentUpdated,
  onDocumentWritten,
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

// ── Auto-dispatch (жолооч авто-оноох) ────────────────────────

interface DriverCandidate {
  id: string;
  name: string;
  phone?: string;
  serviceDistricts?: string[];
  currentOrderCount?: number;
  isActive?: boolean;
}

// Орон нутгийн хүргэлтийн терминал дүүрэг (зүүн→Баянзүрх, баруун→Баянгол).
// Зүүн аймгийн хүргэлт Баянзүрх дүүргийн Тэнгэр ХТ-өөс, баруун аймгийнх
// Баянгол дүүргийн Драгон терминалаас унаанд тавигдана.
const EASTERN_PROVINCES = ["Дорнод", "Сүхбаатар", "Хэнтий"];
const WESTERN_PROVINCES = ["Баян-Өлгий", "Ховд", "Увс", "Завхан", "Говь-Алтай"];

function terminalDistrictForProvince(province?: string): string | undefined {
  if (!province) return undefined;
  if (EASTERN_PROVINCES.includes(province)) return "Баянзүрх";
  if (WESTERN_PROVINCES.includes(province)) return "Баянгол";
  return undefined;
}

// Хоёр цэгийн зай (км) — Haversine.
function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

// Захиалгатай холбоотой агуулахын хөдөлгөөн (reserve/release/out) — атомаар.
//  - reserve: захиалга үүсэхэд reservedQty += qty
//  - release: цуцлагдсан/амжилтгүйд reservedQty -= qty
//  - out: хүргэгдсэнд stockQty -= qty, reservedQty -= qty
async function applyStockMovement(
  productId: string,
  type: "reserve" | "release" | "out",
  qty: number,
  orderId: string,
): Promise<void> {
  if (!productId || !qty || qty <= 0) return;
  const productRef = db.doc(`products/${productId}`);
  const movementRef = db.collection("inventoryMovements").doc();
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(productRef);
    if (!snap.exists) return;
    const d = snap.data() || {};
    const stock = (d.stockQty as number) ?? 0;
    const reserved = (d.reservedQty as number) ?? 0;

    let newStock = stock;
    let newReserved = reserved;
    let beforeQty: number;
    let afterQty: number;

    if (type === "reserve") {
      newReserved = reserved + qty;
      beforeQty = reserved;
      afterQty = newReserved;
    } else if (type === "release") {
      newReserved = Math.max(0, reserved - qty);
      beforeQty = reserved;
      afterQty = newReserved;
    } else {
      // out (хүргэгдсэн)
      newStock = Math.max(0, stock - qty);
      newReserved = Math.max(0, reserved - qty);
      beforeQty = stock;
      afterQty = newStock;
    }

    tx.update(productRef, {
      stockQty: newStock,
      reservedQty: newReserved,
      availableQty: Math.max(0, newStock - newReserved),
      updatedAt: FieldValue.serverTimestamp(),
    });
    tx.set(movementRef, {
      productId,
      companyId: (d.companyId as string) ?? "",
      type,
      qty,
      beforeQty,
      afterQty,
      orderId,
      actorId: "system",
      actorName: "Систем (авто)",
      createdAt: FieldValue.serverTimestamp(),
    });
  });
}

// Жолоочийн идэвхтэй захиалгын тоог +/- (0-оос доош болохгүй).
async function adjustDriverCount(driverId: string, delta: number): Promise<void> {
  const ref = db.doc(`drivers/${driverId}`);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;
    const cur = (snap.data()?.currentOrderCount as number) ?? 0;
    tx.update(ref, {
      currentOrderCount: Math.max(0, cur + delta),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
}

/**
 * autoAssignEnabled бол шинэ захиалгад хамгийн боломжит жолоочийг сонгож онооно.
 * Сонголт: available + идэвхтэй → бүс тохирвол урьдална → хамгийн бага
 * currentOrderCount → (city + байршилтай бол) хамгийн ойр.
 * Зөвхөн захиалгын doc-ийг шинэчилнэ; count нэмэгдүүлэх + driver мэдэгдлийг
 * onOrderUpdated хариуцна (давхар хийхгүй).
 */
async function autoAssignOrder(
  orderId: string,
  o: FirebaseFirestore.DocumentData,
): Promise<void> {
  const general = (await db.doc("settings/general").get()).data() || {};
  if (general.autoAssignEnabled !== true) return;
  if (o.driverId) return; // аль хэдийн оноогдсон
  if (o.status && o.status !== "pending") return;

  const snap = await db
    .collection("drivers")
    .where("currentStatus", "==", "available")
    .get();
  const candidates: DriverCandidate[] = snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<DriverCandidate, "id">) }))
    .filter((d) => d.isActive !== false);
  if (candidates.length === 0) return; // сул жолооч алга — pending хэвээр

  // Зорилтот дүүрэг (city → захиалгын дүүрэг, province → бүсийн терминал дүүрэг).
  const targetDistrict =
    o.deliveryType === "province"
      ? terminalDistrictForProvince(o.province)
      : (o.cityDistrict as string | undefined);
  const matched = targetDistrict
    ? candidates.filter((c) => (c.serviceDistricts ?? []).includes(targetDistrict))
    : [];
  const pool = matched.length ? matched : candidates;

  // Ойролцоо байдал (зөвхөн city + захиалгын байршилтай үед).
  const locById: Record<string, { lat: number; lng: number }> = {};
  if (o.location && o.deliveryType === "city") {
    const locs = await Promise.all(
      pool.map((c) => db.doc(`driverLocations/${c.id}`).get()),
    );
    locs.forEach((ls, i) => {
      const d = ls.data();
      if (ls.exists && d) locById[pool[i].id] = { lat: d.lat, lng: d.lng };
    });
  }
  const dist = (c: DriverCandidate): number => {
    const l = locById[c.id];
    return o.location && l ? haversineKm(o.location, l) : Number.POSITIVE_INFINITY;
  };

  pool.sort((a, b) => {
    const ca = a.currentOrderCount ?? 0;
    const cb = b.currentOrderCount ?? 0;
    if (ca !== cb) return ca - cb; // 1) хамгийн бага ачаалал
    return dist(a) - dist(b); // 2) хамгийн ойр
  });
  const pick = pool[0];

  await db.doc(`orders/${orderId}`).update({
    driverId: pick.id,
    driverName: pick.name,
    driverPhone: pick.phone ?? "",
    autoAssigned: true,
    status: "assigned",
    assignedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
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

    // Барааны үлдэгдэл түгжих (reserve) — productId-тэй захиалгад.
    try {
      if (o.productId) {
        await applyStockMovement(o.productId, "reserve", o.qty ?? 0, event.params.orderId);
      }
    } catch (err) {
      console.error("reserve stock failed", err);
    }

    // Авто-оноолт (settings.autoAssignEnabled бол). Захиалгыг шинэчлэх нь
    // onOrderUpdated-г өдөөж, тэндээс жолоочид мэдэгдэл + count нэмэгдэнэ.
    try {
      await autoAssignOrder(event.params.orderId, o);
    } catch (err) {
      console.error("autoAssignOrder failed", err);
    }
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

    // Жолооч шинээр оноогдсон (авто эсвэл гараар) / дахин оноогдсон
    if (after.driverId && before.driverId !== after.driverId) {
      // Load balancing: шинэ жолоочид +1, хуучин жолоочоос -1.
      await adjustDriverCount(after.driverId, 1);
      if (before.driverId) await adjustDriverCount(before.driverId, -1);

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

    // Захиалга дуусгавар болоход (delivered/failed/cancelled) жолоочийн
    // идэвхтэй тоог -1 (load balancing-ийг чөлөөлнө).
    const TERMINAL = ["delivered", "failed", "cancelled"];
    const becameTerminal =
      TERMINAL.includes(after.status) && !TERMINAL.includes(before.status);

    if (after.driverId && becameTerminal) {
      await adjustDriverCount(after.driverId, -1);
    }

    // Барааны үлдэгдэл: хүргэгдсэн → out (stock-), цуцлагдсан/амжилтгүй → release.
    if (after.productId && becameTerminal) {
      try {
        if (after.status === "delivered") {
          await applyStockMovement(after.productId, "out", after.qty ?? 0, event.params.orderId);
        } else {
          await applyStockMovement(after.productId, "release", after.qty ?? 0, event.params.orderId);
        }
      } catch (err) {
        console.error("stock movement on terminal failed", err);
      }
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

// ── Driver settlement trigger (COD тушаалт / өдөр хаалт) ─────
// Жолооч өдөр хаахад (submitted) → admin-уудад; admin батлахад (approved) →
// тухайн жолоочид мэдэгдэл.
export const onDriverSettlementWritten = onDocumentWritten(
  "driverSettlements/{id}",
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!after) return; // устгасан

    // Жолооч өдөр хаалт илгээсэн
    if (after.status === "submitted" && before?.status !== "submitted") {
      const diff = (after.codCollected ?? 0) - (after.handedAmount ?? 0);
      const diffNote = diff !== 0 ? ` (зөрүү ${diff.toLocaleString("mn-MN")}₮)` : "";
      await notifyAdmins(
        "Жолооч өдөр хаалаа",
        `${after.driverName}: ${(after.handedAmount ?? 0).toLocaleString("mn-MN")}₮ тушаах хүсэлт${diffNote}`,
        "system",
      );
    }

    // Admin баталсан
    if (after.status === "approved" && before?.status !== "approved") {
      const users = await db
        .collection("users")
        .where("driverId", "==", after.driverId)
        .limit(1)
        .get();
      if (!users.empty) {
        await notifyUser(
          users.docs[0].id,
          "Тооцоо батлагдлаа",
          `${after.dateKey} өдрийн тооцоо батлагдлаа.`,
          "system",
        );
      }
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
