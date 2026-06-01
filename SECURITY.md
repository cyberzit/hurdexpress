# HurdExpress — Security & Permissions

Энэ баримт нь HurdExpress-ийн Firestore Security Rules, role permission, нийтийн
tracking-ийн аюулгүй загварыг тайлбарлана.

## Role загвар

Хэрэглэгчийн эрх `users/{uid}` document дээр тодорхойлогдоно:

```
users/{uid} {
  name, email, phone,
  role: "admin" | "partner" | "driver",
  companyId?: string,   // partner — харьяа байгууллага
  driverId?: string,    // driver — drivers document id
  isActive: boolean
}
```

> Бүх эрх `isActive == true` байхыг шаарддаг. `isActive: false` болгосон хэрэглэгч
> ямар ч датад хандах боломжгүй (мөн UI guard /login руу шиднэ).

## Эрхийн матриц

| Collection | Admin | Partner | Driver | Public |
|---|---|---|---|---|
| `users` | бүгд унших, үүсгэх/засах | зөвхөн өөрийн | зөвхөн өөрийн | ✗ |
| `companies` | CRUD | өөрийн company унших | ✗ | ✗ |
| `products` | CRUD | өөрийн companyId унших/үүсгэх/засах | ✗ | ✗ |
| `drivers` | CRUD | ✗ | зөвхөн өөрийн document унших | ✗ |
| `orders` | бүгд унших/засах | өөрийн companyId унших/үүсгэх¹ | өөрийн driverId унших/засах² | ✗³ |
| `notifications` | үүсгэх | өөрийн унших, isRead засах | өөрийн унших, isRead засах | ✗ |
| `activities` | бүгд унших | өөрийн order-ийн унших | өөрийн order-ийн унших | ✗ |

¹ Partner нь `status`, `driverId`, `driverName`, `orderCode`, `companyId/Name`,
`createdByUid`-г **засаж чадахгүй**. Үүсгэхдээ `status == "pending"`, `companyId ==`
өөрийн байх ёстой.

² Driver зөвхөн `status`, `codCollected`, `driverNote`, `pickedUpAt`,
`deliveredAt`, `updatedAt` талбаруудыг засна (`hasOnly` шалгуур). `driverId`,
`companyId`-г өөрчилж чадахгүй.

³ Нийтийн tracking нь Firestore-руу **шууд хандахгүй** — доорх API-г үзнэ үү.

## Нийтийн tracking (public read хийхгүй)

`orders` collection дээр **public read байхгүй**. Хэн ч нэвтрэлгүйгээр Firestore-руу
шууд query хийж бүх захиалгыг харах боломжгүй.

Оронд нь **Next.js API route** (`/api/track-order`) сервер талд Firebase Admin SDK
ашиглан зөвхөн нэг захиалгыг `orderCode`-оор хайж, **хязгаарлагдмал safe талбар**
буцаана:

- ✅ Буцаана: `orderCode`, `status`, `companyName`, `receiverName`, `driverName`,
  `driverPhone`, `createdAt`, `deliveredAt`, мөн `receiverPhoneMasked` (сүүлийн 4 орон)
- ❌ Буцаахгүй: `receiverPhone` бүтнээр, `receiverAddress`, COD дүн, дотоод id-ууд

### Setup — service account

1. Firebase Console → **Project Settings → Service accounts → Generate new private key**
2. Татсан JSON-г **нэг мөр** болгож `.env.local`-д тавина:
   ```
   FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"hurdexpress-49cd2",...}
   ```
3. Энэ түлхүүр нь `NEXT_PUBLIC_` угтваргүй тул зөвхөн серверт уншигдана. **Хэзээ ч
   client bundle-д орохгүй, git-д commit хийхгүй** (`.gitignore` дотор `.env*` бий).

### Урсгал

```
Browser (TrackingSearch) ──GET /api/track-order?code=HX123456──▶ Next.js server
                                                                  │ Admin SDK (rules тойрно)
                                                                  ▼
                                                           orders (orderCode==)
                         ◀──── зөвхөн safe талбар (JSON) ──────────┘
```

## Notifications — production тэмдэглэл

Production rules дээр `notifications` **create нь зөвхөн admin**. Энэ нь дурын
хэрэглэгч бусдад мэдэгдэл (spam) бичихээс сэргийлнэ.

- ✅ Ажиллана: Admin жолооч оноох → жолоочид мэдэгдэл (`AssignDriverModal`).
- ⚠️ Хязгаарлагдсан: Driver статус өөрчлөхөд partner/admin-д мэдэгдэл илгээх нь
  одоо **хоригдсон**. Энэ нь захиалгын өөрчлөлт дээр ажиллах **Cloud Function**
  (Admin SDK)-аар хийгдэх ёстой (fan-out: admin бүрд нэг notification).

> Кодод нөлөөлсөн хэсгүүдийг `⚠️` comment-аар тэмдэглэсэн
> ([DriverStatusActions.tsx](src/components/driver/DriverStatusActions.tsx),
> [orders.ts](src/lib/firebase/orders.ts)).

## Rules deploy

```bash
firebase deploy --only firestore:rules --project hurdexpress-49cd2
```

## Rules тестлэх

### A. Emulator + unit test (зөвлөмж)

```bash
npm i -D @firebase/rules-unit-testing
firebase emulators:start --only firestore
```

```ts
// orders.rules.test.ts (жишээ)
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";

const env = await initializeTestEnvironment({
  projectId: "demo-hurdexpress",
  firestore: { rules: readFileSync("firestore.rules", "utf8") },
});

// admin seed
const admin = env.authenticatedContext("admin1");
await admin.firestore().doc("users/admin1").set({ role: "admin", isActive: true });

// 1) Partner өөрийн companyId захиалгыг уншина
const partner = env.authenticatedContext("p1");
await partner.firestore().doc("users/p1").set({ role: "partner", companyId: "C1", isActive: true });
await assertSucceeds(
  partner.firestore().collection("orders").where("companyId", "==", "C1").get()
);

// 2) Partner бусдын companyId-г уншвал FAIL
await assertFails(
  partner.firestore().collection("orders").where("companyId", "==", "C2").get()
);

// 3) Driver зөвшөөрөгдөөгүй талбар (codAmount) засвал FAIL
const driver = env.authenticatedContext("d1");
await driver.firestore().doc("users/d1").set({ role: "driver", driverId: "D1", isActive: true });
await assertFails(
  driver.firestore().doc("orders/o1").update({ codAmount: 0 })
);

// 4) Нэвтрээгүй хэрэглэгч orders уншвал FAIL (public read байхгүй)
const anon = env.unauthenticatedContext();
await assertFails(anon.firestore().doc("orders/o1").get());
```

### B. Console-ийн Rules Playground

Firebase Console → Firestore → **Rules → Playground**-д:
- Location: `orders/{someId}`, Operation: `get`
- Authenticated эсэх, `auth.uid`-г өөрчилж, partner/driver/admin тохиолдол бүрийг шалга.

### Гол шалгах кейсүүд

| Кейс | Хүлээгдэх |
|---|---|
| Нэвтрээгүй `orders` get | ❌ Deny |
| Partner өөрийн company orders list | ✅ Allow |
| Partner өөр company orders list | ❌ Deny |
| Partner `status` засах | ❌ Deny |
| Driver өөрийн order `status` засах | ✅ Allow |
| Driver `driverId` өөрчлөх | ❌ Deny |
| Driver өөр driver-ийн order унших | ❌ Deny |
| Хэрэглэгч өөр хэн нэгний notification унших | ❌ Deny |
| Driver notification үүсгэх | ❌ Deny (admin only) |
| `isActive:false` хэрэглэгч ямар ч хандалт | ❌ Deny |

## Client код дээрх засвар (rules-тэй уялдуулсан)

| Файл | Өөрчлөлт |
|---|---|
| [TrackingSearch.tsx](src/components/tracking/TrackingSearch.tsx) | Client Firestore query → `/api/track-order` fetch |
| [NotificationBell.tsx](src/components/notifications/NotificationBell.tsx) | Broadcast аудиенс хассан (зөвхөн өөрийн uid) |
| [DriverStatusActions.tsx](src/components/driver/DriverStatusActions.tsx) | Partner/admin notification-г Cloud Function руу зөөхөөр тэмдэглэсэн |
| [orders.ts](src/lib/firebase/orders.ts) | `getOrderByCode` — public-д ашиглахаа больсон (deprecated) |

## Цаашид (production checklist)

- [ ] Notification fan-out-ыг **Cloud Function** (Firestore trigger) болгох
- [ ] Legacy `shipments` collection + `/track` хуудсыг устгах эсвэл аюулгүй болгох
- [ ] App Check идэвхжүүлж API/SDK-г бот-оос хамгаалах
- [ ] `/api/track-order`-д rate limiting нэмэх (orderCode brute-force-оос сэргийлэх)
- [ ] Storage rules-г идэвхжүүлэх үед хянах
