# HurdExpress 🚚

Хүргэлтийн үйлчилгээний веб апп — Next.js 16 (App Router) + Firebase + TypeScript + Tailwind CSS. **PWA** (утсанд app шиг), **Firebase Hosting**-д deploy хийхэд бэлэн.

## Боломжууд

- 🔐 **Auth + Role** — admin / partner / driver (role-based redirect)
- 👨‍💼 **Admin панел** — dashboard, харилцагч, бараа, жолооч, захиалга, тайлан, тохиргоо
- 🏪 **Partner панел** — өөрийн захиалга үүсгэх/харах (mobile-first)
- 🚚 **Driver панел** — оноогдсон хүргэлт, статус шинэчлэх (app шиг)
- 🔎 **Public tracking** — orderCode-оор (Cloud Function, хязгаарлагдмал мэдээлэл)
- 🔔 **Notification + Activity log** — realtime
- 🛡️ **Production Firestore Security Rules** ([SECURITY.md](SECURITY.md))
- 📲 **PWA** — home screen icon, offline notice, install hint

## Технологи

| Давхарга | Технологи |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| Backend | Firebase Auth, Firestore, Storage, Cloud Functions (v2) |
| Hosting | Firebase Hosting (web frameworks) |

---

## 1. Локал хөгжүүлэлт

```bash
npm install
cp .env.example .env.local   # дараа нь утгуудыг бөглөнө
npm run dev                  # http://localhost:3000
```

`.env.local` (Firebase Console → Project Settings → Your apps → SDK config):

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# (Заавал биш — локал /api/track-order Next route-д. Production-д Cloud Function ашиглана.)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

---

## 2. Firebase төсөл бэлдэх (нэг удаа)

1. [Firebase Console](https://console.firebase.google.com) → шинэ төсөл.
2. **Authentication** → Sign-in method → **Email/Password** идэвхжүүлэх.
3. **Firestore Database** → Create database (production mode).
4. **Storage** → Get started (зураг хадгалах бол).
5. **Hosting** → Get started.
6. **Functions** ажиллуулахад **Blaze (pay-as-you-go)** төлөвлөгөө шаардлагатай.
7. Project Settings → Your apps → **Web app** нэмж SDK config-г `.env.local`-д хуулах.

### Demo дата seed (туршихад)

Admin SDK ашиглан demo company, бараа, жолооч, захиалга, хэрэглэгч үүсгэнэ:

```bash
# .env.local дотор FIREBASE_SERVICE_ACCOUNT_KEY тохируулсан байх ёстой
npm run seed
```

Үүсгэх бүртгэлүүд (нууц үг `Demo123!`): `admin@demo.hurdexpress.mn`,
`partner@demo.hurdexpress.mn`, `driver@demo.hurdexpress.mn`. Дэлгэрэнгүй
тест жагсаалт → [QA_CHECKLIST.md](QA_CHECKLIST.md).

> `npm run seed` нь эхний admin-г автоматаар үүсгэх тул доорх гар аргыг
> алгасаж болно. Эсвэл production-д гар аргаар үүсгэнэ:

### Эхний admin хэрэглэгч

Rules нь `users` document-ийг **зөвхөн admin** үүсгэхийг зөвшөөрдөг тул эхнийхийг **Console-оос гараар** үүсгэнэ:

1. **Authentication → Users → Add user** (имэйл + нууц үг) → UID хуулах.
2. **Firestore → `users` коллекц → Document ID = тэр UID**:
   ```json
   {
     "name": "Admin",
     "email": "admin@hurdexpress.mn",
     "phone": "99999999",
     "role": "admin",
     "isActive": true
   }
   ```
3. `/login` дээр нэвтрэхэд `/admin/dashboard` руу орно.

> Partner-д `companyId`, driver-д `driverId` талбар нэмж users document үүсгэнэ.

### Production smoke test (deploy дараа)

1. **Admin login** → `/admin/dashboard`
2. **Company create** (`/admin/companies`)
3. **Product create** (`/admin/products`)
4. **Driver create** (`/admin/drivers`)
5. **Partner user create** — Console: Auth user + `users/{uid}` (`role:"partner"`, `companyId`)
6. **Partner order create** (`/partner/orders/new`)
7. **Admin assign driver** (`/admin/orders` → код → жолооч оноох)
8. **Driver delivered** — жолоочоор нэвтэрч статусыг `Хүргэгдсэн` болгох
9. **Public tracking** — `/track/{orderCode}` (утас masked, хаяг нуусан)

> Бүрэн checklist → [DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md)

---

## 3. Firebase CLI холбох

```bash
npm install -g firebase-tools
npm run firebase:login                 # firebase login
firebase use --add                     # төсөл сонгож .firebaserc үүсгэх
firebase experiments:enable webframeworks   # Next.js hosting-д шаардлагатай
```

`.firebaserc` (төсөл сонгоход автоматаар үүснэ):

```json
{ "projects": { "default": "<your-project-id>" } }
```

---

## 4. Deploy

### A. Backend (functions + Firestore rules) — `firebase deploy`

```bash
npm run deploy            # functions + firestore (rules + indexes)
# эсвэл тус тусад нь:
npm run deploy:functions  # trackOrder + триггер functions
npm run deploy:rules      # firestore.rules + firestore.indexes.json
```

### B. Next.js app — Firebase App Hosting

> ⚠️ Next.js **16** нь firebase classic Hosting (web-frameworks)-д дэмжигдэхгүй
> (12–15.0 хүртэл). Тиймээс **App Hosting** (Cloud Run дээр ажилладаг) ашиглана.

1. Кодоо **GitHub repo** руу push хийнэ.
2. Backend үүсгэх (нэг удаа, browser-аар GitHub холбоно):
   ```bash
   firebase apphosting:backends:create --project hurdexpress-49cd2
   ```
   → GitHub repo + branch + region сонгоно. [apphosting.yaml](apphosting.yaml) автоматаар уншигдана.
3. Цаашид тухайн branch руу **git push** хийхэд автоматаар rollout (build + deploy) хийгдэнэ.
   Эсвэл: `firebase apphosting:rollouts:create <backendId>`.
4. App Hosting домэйн гармагц [apphosting.yaml](apphosting.yaml)-д `NEXT_PUBLIC_APP_URL`-г бөглөж дахин push (QR кодын домэйн).

**Тэмдэглэл:**
- `NEXT_PUBLIC_*` env нь [apphosting.yaml](apphosting.yaml)-д (public утгууд).
- `/api/track-order` нь App Hosting (Cloud Run) дээр **default service account (ADC)**-ээр Firestore-д хандана — `FIREBASE_SERVICE_ACCOUNT_KEY` шаардахгүй ([admin.ts](src/lib/firebase/admin.ts) ADC fallback).
- `trackOrder` Cloud Function мөн live (https://us-central1-hurdexpress-49cd2.cloudfunctions.net/trackOrder) — гадны хэрэглээнд боломжтой.

> 📋 Алхам алхмаар бүрэн жагсаалт → **[DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md)**

---

## Google Maps (realtime driver tracking)

Жолоочдын байршлыг газрын зураг дээр marker-аар харуулна.

### Setup

1. [Google Cloud Console](https://console.cloud.google.com/google/maps-apis) → **Maps JavaScript API** идэвхжүүлэх.
2. **APIs & Services → Credentials → Create API key** → түлхүүрийг `.env.local`-д:
   ```
   NEXT_PUBLIC_FIREBASE_VAPID_KEY=...
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...
   ```
3. Аюулгүй байдал: түлхүүрийг **HTTP referrer**-ээр хязгаарлах (өөрийн домэйн + localhost).
4. Серверээ дахин асаах (`NEXT_PUBLIC_*` нь эхлэх үед inline хийгддэг).

### Хэрхэн ажилладаг

- **Driver** ([LocationShareToggle](src/components/driver/LocationShareToggle.tsx)) — "📍 Байршил хуваалцах" toggle → `watchPosition` (enableHighAccuracy:false, 25 сек throttle → батарей хэмнэнэ) → `driverLocations/{driverId}`. Permission татгалзвал монгол алдаа.
- **Admin** ([/admin/live-map](src/app/admin/live-map/page.tsx)) — `onSnapshot`-аар идэвхтэй жолоочдыг marker-аар; сүүлийн 5 минутаас хэтэрвэл хасна. Marker дээр нэр, цаг, хурд, "Open in Google Maps".
- **Partner** ([/partner/orders/[id]](src/app/partner/orders/%5Bid%5D/page.tsx)) — `on_the_way` үед зөвхөн өөрийн захиалгын жолоочийн marker ([order.lastDriverLocation](src/lib/firebase/locations.ts) денормализ).
- API key байхгүй бол газрын зураг fallback (lat/lng + "Open in Google Maps" холбоос) харагдана — апп унахгүй.

> 🔐 Driver зөвхөн өөрийн `driverLocations`-г бичнэ; admin бүгдийг уншина; partner шууд `driverLocations` уншихгүй (order.lastDriverLocation-аар); **public tracking дээр байршил гарахгүй**.

## Push notification (FCM)

Driver-т шинэ хүргэлт, partner-т хүргэгдсэн, admin-д шинэ захиалга гэх мэт push.

### Setup

1. **Console → Cloud Messaging** идэвхжүүлэх.
2. **Project Settings → Cloud Messaging → Web Push certificates → Generate key pair** → "Key pair" утгыг `.env.local`-д:
   ```
   NEXT_PUBLIC_FIREBASE_VAPID_KEY=BPxxxx...
   ```
3. [public/firebase-messaging-sw.js](public/firebase-messaging-sw.js)-ийн `firebase.initializeApp({...})`-д өөрийн public config-оо тааруулах (одоо hurdexpress-49cd2 утгаар бичигдсэн).
4. **Functions deploy** (push илгээгч):
   ```
   npm run firebase:deploy:functions
   ```

### Хэрхэн ажилладаг

- **Нэвтрэхэд** → [FcmRegistrar](src/components/FcmRegistrar.tsx) permission хүсэж, FCM token авч `userDevices/{token}`-д хадгална ([lib/fcm.ts](src/lib/fcm.ts)).
- **Firestore триггер** ([functions/src/index.ts](functions/src/index.ts)):
  - `onOrderCreated` → admin-уудад "Шинэ захиалга"
  - `onOrderUpdated`: жолооч оноогдвол → driver-т "Шинэ хүргэлт"; delivered болоход → partner-т "Захиалга хүргэгдлээ"
- Триггер бүр **notifications doc бичиж** (bell realtime шинэчлэгдэнэ) **+ push илгээнэ** (data-only).
- Background push-г [service worker](public/firebase-messaging-sw.js), foreground-г `onMessage` харуулна.

> 📱 Web push нь **HTTPS** (эсвэл localhost) шаардана. Android Chrome / суулгасан PWA дээр ажиллана. iOS дээр **PWA-г Home Screen-д нэмсэн** үед (iOS 16.4+) push дэмжигдэнэ.

> ⚠️ Functions нь **Blaze** төлөвлөгөө шаардана. Token нь зөвхөн жинхэнэ device + permission олгосон үед үүснэ.

---

## 5. NPM scripts

| Script | Үйлдэл |
| --- | --- |
| `npm run dev` | Локал dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run firebase:login` | Firebase нэвтрэх |
| `npm run firebase:init` | Firebase init |
| `npm run firebase:deploy` | Бүгдийг deploy |
| `npm run firebase:deploy:hosting` | Зөвхөн hosting |
| `npm run firebase:deploy:functions` | Зөвхөн functions |
| `npm run firebase:deploy:rules` | Firestore + Storage rules |

---

## Бүтэц

```
src/
  app/
    login/                  Нэвтрэх + public tracking (PWA hint)
    admin/                  Admin панел (layout = AdminGuard)
      dashboard, companies, products, drivers, orders, reports, settings
    partner/                Partner панел (PartnerGuard, bottom nav)
    driver/                 Driver панел (DriverGuard, bottom nav)
    api/track-order/        Public tracking (локал dev route)
    manifest.ts             PWA manifest
    offline/                Офлайн fallback
  components/               admin/ partner/ driver/ notifications/ tracking/ ...
  contexts/AuthContext.tsx  Firebase auth + role
  lib/                      firebase/, settings, reports, dashboard, ...
functions/src/index.ts      trackOrder Cloud Function (Admin SDK)
firebase.json               Hosting + Functions + Firestore + Storage
firestore.rules             Production security rules
firestore.indexes.json      Composite index-үүд
storage.rules               Storage rules
SECURITY.md                 Эрх, rules, tracking аюулгүй байдал
```

## Тэмдэглэл

- Firebase-г тохиргоо байхгүй үед ч унахгүй ([src/lib/firebase.ts](src/lib/firebase.ts) `isFirebaseConfigured`).
- Notification fan-out (driver → partner/admin)-ийг production-д Cloud Function болгох — [SECURITY.md](SECURITY.md).
- Web frameworks hosting нь Firebase CLI-ийн дэмжих Next хувилбараас хамаарна. Хэрэв deploy дэмжихгүй бол CLI-г шинэчилнэ үү (`npm i -g firebase-tools@latest`).
