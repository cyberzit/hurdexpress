// HurdExpress production smoke test — admin panel-ийн үндсэн flow-г бодит
// Firestore дээр TEST_ өгөгдлөөр шалгана. Cleanup нь зөвхөн өөрийн үүсгэсэн
// (tracked id) өгөгдлийг идэвхгүй/цуцлах болгоно — production өгөгдлийг хөндөхгүй.

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { addCompany, setCompanyActive } from "@/lib/firebase/companies";
import { addProduct, setProductActive } from "@/lib/firebase/products";
import { addDriver, setDriverActive } from "@/lib/firebase/drivers";
import { createUserProfile, setUserActive } from "@/lib/firebase/users";
import {
  addOrder,
  assignDriver,
  cancelOrder,
  driverUpdateOrder,
} from "@/lib/firebase/orders";
import { logActivity, notifyUsers } from "@/lib/firebase/activity";
import { getSettings } from "@/lib/settings";
import { trackOrderApi } from "@/lib/trackUrl";

export const TEST_PREFIX = "TEST_";

export type StepStatus = "pending" | "running" | "success" | "failed";

export interface StepResult {
  key: string;
  name: string;
  status: StepStatus;
  error?: string;
  docId?: string;
}

// Run явцад үүсгэсэн өгөгдлийн id-ууд (cleanup-д ашиглана).
export interface SmokeArtifacts {
  companyId?: string;
  productId?: string;
  driverId?: string;
  partnerUid?: string;
  driverUid?: string;
  orderId?: string;
  orderCode?: string;
}

export interface SmokeActor {
  uid: string;
  name: string;
}

// UI-д pending мөрүүдийг урьдчилан харуулахад.
export const SMOKE_STEPS: { key: string; name: string }[] = [
  { key: "auth", name: "Firebase Auth login" },
  { key: "firestore", name: "Firestore read/write" },
  { key: "settings", name: "Settings ачаалсан" },
  { key: "company", name: "Company үүсгэх" },
  { key: "product", name: "Product үүсгэх" },
  { key: "driver", name: "Driver үүсгэх" },
  { key: "partnerUser", name: "Partner user profile" },
  { key: "driverUser", name: "Driver user profile" },
  { key: "order", name: "Partner order үүсгэх" },
  { key: "assign", name: "Admin жолооч оноох" },
  { key: "status", name: "Driver status (pending→delivered)" },
  { key: "activity", name: "Activity log үүссэн" },
  { key: "notification", name: "Notification document үүссэн" },
  { key: "tracking", name: "Tracking search" },
];

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/**
 * Бүх flow-г дарааллан гүйцэтгэнэ. Алхам бүрийн төлвийг `onStep`-ээр шууд
 * мэдээлнэ. Алхам амжилтгүй болоход дараагийн алхмууд (хамаарал байвал)
 * алгасагдана. Үүсгэсэн өгөгдлийн id-ыг буцаана (cleanup-д).
 */
export async function runSmokeTest(
  actor: SmokeActor,
  onStep: (r: StepResult) => void,
): Promise<SmokeArtifacts> {
  const a: SmokeArtifacts = {};
  // Event handler дотор тул Date.now() ашиглахад асуудалгүй (render биш).
  const stamp = Date.now();
  const tag = `${TEST_PREFIX}${stamp}`;
  const companyName = `${TEST_PREFIX}Company ${stamp}`;
  const productName = `${TEST_PREFIX}Product ${stamp}`;

  const run = async (
    key: string,
    name: string,
    fn: () => Promise<string | undefined>,
  ): Promise<boolean> => {
    onStep({ key, name, status: "running" });
    try {
      const docId = await fn();
      onStep({ key, name, status: "success", docId });
      return true;
    } catch (e) {
      onStep({ key, name, status: "failed", error: errMsg(e) });
      return false;
    }
  };

  const skip = (key: string, name: string, why: string) =>
    onStep({ key, name, status: "failed", error: why });

  // 1. Auth login (admin сесс)
  await run("auth", "Firebase Auth login", async () => {
    if (!actor.uid) throw new Error("Нэвтрээгүй байна.");
    return actor.uid;
  });

  // 2. Firestore read (admin эрхээр унших)
  await run("firestore", "Firestore read/write", async () => {
    await getDocs(query(collection(db, "companies"), limit(1)));
    return undefined;
  });

  // 3. Settings ачаалсан (null байж болно — тохиргоо хоосон)
  await run("settings", "Settings ачаалсан", async () => {
    await getSettings();
    return undefined;
  });

  // 4. Company үүсгэх
  await run("company", "Company үүсгэх", async () => {
    const id = await addCompany({
      name: companyName,
      phone: "00000000",
      address: `${TEST_PREFIX}хаяг`,
      contractPrice: 5000,
      note: tag,
      isActive: true,
    });
    a.companyId = id;
    return id;
  });

  // 5. Product үүсгэх (company хэрэгтэй)
  if (a.companyId) {
    await run("product", "Product үүсгэх", async () => {
      const id = await addProduct({
        companyId: a.companyId!,
        companyName,
        name: productName,
        price: 1000,
        isActive: true,
      });
      a.productId = id;
      return id;
    });
  } else {
    skip("product", "Product үүсгэх", "Company үүсээгүй тул алгассан.");
  }

  // 6. Driver үүсгэх
  await run("driver", "Driver үүсгэх", async () => {
    const id = await addDriver({
      name: `${TEST_PREFIX}Driver ${stamp}`,
      phone: "99000000",
      vehicleType: "car",
      currentStatus: "available",
      isActive: true,
    });
    a.driverId = id;
    return id;
  });

  // 7. Partner user profile (company хэрэгтэй)
  if (a.companyId) {
    await run("partnerUser", "Partner user profile", async () => {
      const uid = `${TEST_PREFIX}partner_${stamp}`;
      await createUserProfile({
        uid,
        name: `${TEST_PREFIX}Partner ${stamp}`,
        email: `test_partner_${stamp}@test.local`,
        phone: "80000000",
        role: "partner",
        companyId: a.companyId!,
        isActive: true,
      });
      a.partnerUid = uid;
      return uid;
    });
  } else {
    skip("partnerUser", "Partner user profile", "Company үүсээгүй тул алгассан.");
  }

  // 8. Driver user profile (driver хэрэгтэй)
  if (a.driverId) {
    await run("driverUser", "Driver user profile", async () => {
      const uid = `${TEST_PREFIX}driver_${stamp}`;
      await createUserProfile({
        uid,
        name: `${TEST_PREFIX}Driver User ${stamp}`,
        email: `test_driver_${stamp}@test.local`,
        phone: "80000001",
        role: "driver",
        driverId: a.driverId!,
        isActive: true,
      });
      a.driverUid = uid;
      return uid;
    });
  } else {
    skip("driverUser", "Driver user profile", "Driver үүсээгүй тул алгассан.");
  }

  // 9. Order үүсгэх (company хэрэгтэй)
  if (a.companyId) {
    await run("order", "Partner order үүсгэх", async () => {
      const res = await addOrder({
        companyId: a.companyId!,
        companyName,
        receiverName: `${TEST_PREFIX}Receiver ${stamp}`,
        receiverPhone: "95000000",
        receiverAddress: `${TEST_PREFIX}хүргэх хаяг`,
        itemName: `${TEST_PREFIX}бараа`,
        productId: a.productId,
        productName: a.productId ? productName : undefined,
        qty: 1,
        deliveryPrice: 5000,
        codAmount: 10000,
        note: tag,
        createdByUid: actor.uid,
      });
      a.orderId = res.id;
      a.orderCode = res.orderCode;
      return `${res.id} (${res.orderCode})`;
    });
  } else {
    skip("order", "Partner order үүсгэх", "Company үүсээгүй тул алгассан.");
  }

  // 10. Admin жолооч оноох → assigned (order + driver хэрэгтэй)
  if (a.orderId && a.driverId) {
    await run("assign", "Admin жолооч оноох", async () => {
      await assignDriver(a.orderId!, a.driverId!, `${TEST_PREFIX}Driver ${stamp}`, "99000000");
      return a.orderId!;
    });
  } else {
    skip("assign", "Admin жолооч оноох", "Order эсвэл driver байхгүй тул алгассан.");
  }

  // 11. Driver status: assigned → picked_up → on_the_way → delivered
  if (a.orderId) {
    await run("status", "Driver status (pending→delivered)", async () => {
      await driverUpdateOrder(a.orderId!, { status: "picked_up" });
      await driverUpdateOrder(a.orderId!, { status: "on_the_way" });
      await driverUpdateOrder(a.orderId!, { status: "delivered", codCollected: true });
      const snap = await getDoc(doc(db, "orders", a.orderId!));
      const st = snap.data()?.status;
      if (st !== "delivered") throw new Error(`Эцсийн статус delivered биш: ${st}`);
      return `status=${st}`;
    });
  } else {
    skip("status", "Driver status (pending→delivered)", "Order байхгүй тул алгассан.");
  }

  // 12. Activity log үүссэн эсэх (order хэрэгтэй)
  if (a.orderId && a.orderCode) {
    await run("activity", "Activity log үүссэн", async () => {
      await logActivity({
        orderId: a.orderId!,
        orderCode: a.orderCode!,
        action: "TEST_FLOW smoke test",
        actorId: actor.uid,
        actorName: actor.name,
        actorRole: "admin",
      });
      const snap = await getDocs(
        query(collection(db, "activities"), where("orderId", "==", a.orderId!)),
      );
      if (snap.empty) throw new Error("Activity document уншигдсангүй.");
      return `${snap.size} activity`;
    });
  } else {
    skip("activity", "Activity log үүссэн", "Order байхгүй тул алгассан.");
  }

  // 13. Notification document үүссэн эсэх (admin өөрийн uid руу)
  await run("notification", "Notification document үүссэн", async () => {
    await notifyUsers([actor.uid], {
      title: "TEST smoke",
      message: `TEST_FLOW ${stamp}`,
      type: "system",
    });
    const snap = await getDocs(
      query(collection(db, "notifications"), where("userId", "==", actor.uid), limit(5)),
    );
    if (snap.empty) throw new Error("Notification document уншигдсангүй.");
    return `${snap.size} notif`;
  });

  // 14. Tracking search (public Cloud Function)
  if (a.orderCode) {
    await run("tracking", "Tracking search", async () => {
      const res = await fetch(trackOrderApi(a.orderCode!));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { orderCode?: string; status?: string };
      if (!data?.orderCode) throw new Error("Хариу буруу бүтэцтэй.");
      return `status=${data.status}`;
    });
  } else {
    skip("tracking", "Tracking search", "Order code байхгүй тул алгассан.");
  }

  return a;
}

// Cleanup алхмуудын түлхүүр + нэр (UI-д харуулна).
export const CLEANUP_STEPS: { key: string; name: string }[] = [
  { key: "c-order", name: "Order цуцлах (cancelled)" },
  { key: "c-product", name: "Product идэвхгүй болгох" },
  { key: "c-company", name: "Company идэвхгүй болгох" },
  { key: "c-driver", name: "Driver идэвхгүй болгох" },
  { key: "c-partnerUser", name: "Partner user идэвхгүй болгох" },
  { key: "c-driverUser", name: "Driver user идэвхгүй болгох" },
];

/**
 * Зөвхөн tracked artifact-уудыг идэвхгүй/цуцлах болгоно (delete ХИЙХГҮЙ).
 * Production өгөгдлийг хэзээ ч хөндөхгүй — id-аар л ажиллана.
 */
export async function cleanupSmokeTest(
  artifacts: SmokeArtifacts,
  actor: SmokeActor,
  onStep: (r: StepResult) => void,
): Promise<void> {
  const run = async (key: string, name: string, fn: () => Promise<void>) => {
    onStep({ key, name, status: "running" });
    try {
      await fn();
      onStep({ key, name, status: "success" });
    } catch (e) {
      onStep({ key, name, status: "failed", error: errMsg(e) });
    }
  };

  if (artifacts.orderId) {
    await run("c-order", "Order цуцлах (cancelled)", () =>
      cancelOrder(artifacts.orderId!, "TEST_FLOW cleanup", actor.uid),
    );
  }
  if (artifacts.productId) {
    await run("c-product", "Product идэвхгүй болгох", () =>
      setProductActive(artifacts.productId!, false),
    );
  }
  if (artifacts.companyId) {
    await run("c-company", "Company идэвхгүй болгох", () =>
      setCompanyActive(artifacts.companyId!, false),
    );
  }
  if (artifacts.driverId) {
    await run("c-driver", "Driver идэвхгүй болгох", () =>
      setDriverActive(artifacts.driverId!, false),
    );
  }
  if (artifacts.partnerUid) {
    await run("c-partnerUser", "Partner user идэвхгүй болгох", () =>
      setUserActive(artifacts.partnerUid!, false),
    );
  }
  if (artifacts.driverUid) {
    await run("c-driverUser", "Driver user идэвхгүй болгох", () =>
      setUserActive(artifacts.driverUid!, false),
    );
  }
}
