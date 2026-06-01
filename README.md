# HurdExpress 🚚

Хүргэлтийн үйлчилгээний веб апп — Next.js 16 (App Router) + Firebase + TypeScript + Tailwind CSS. **PWA** (утсанд app шиг), **Firebase Hosting (static export)**-д deploy хийхэд бэлэн.

> **Hosting загвар:** Энэ төсөл нь **Firebase Hosting** дээр **static export** (`output: "export"`) хэлбэрээр байрлана. App Hosting (Cloud Run / SSR) **ашиглахгүй**. GitHub repo нь зөвхөн version control-д. Auth / Firestore / Storage нь client SDK-аар, public tracking нь `trackOrder` Cloud Function-аар ажиллана.
>
> Хэрэв өмнө нь App Hosting дээр deploy хийж байсан бол **[4.D хэсэг](#d-хуучин-app-hosting-г-унтраах-auto-deploy-зогсоох)**-ийг үзэж хуучин backend-ийг аюулгүй устгана уу.

> ## ⚠️ Чухал — Production URL & deploy
> - **Production URL зөвхөн** `https://hurdexpress.mn` (Firebase Hosting custom domain).
> - App Hosting-ийн `*.hosted.app` / `*.web.app` урьдчилсан URL-ийг **ашиглахгүй**, нийтэд тараахгүй.
> - **GitHub бол зөвхөн код хадгалах** (version control). `git push` хийхэд **deploy хийгдэхгүй** — auto-rollout байхгүй.
> - Deploy зөвхөн **гар аргаар** локалаас: `npm run deploy` (эсвэл `firebase deploy --only hosting`).

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
| Hosting | Firebase Hosting (static export — `out/`) |

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

# (Заавал биш) FCM, QR домэйн, газрын зураг, tracking функцийн URL
NEXT_PUBLIC_FIREBASE_VAPID_KEY=...
NEXT_PUBLIC_APP_URL=https://hurdexpress.mn
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
NEXT_PUBLIC_TRACK_ORDER_URL=https://us-central1-<project-id>.cloudfunctions.net/trackOrder
```

> Static export тул **бүх** env нь `NEXT_PUBLIC_` (build үед inline хийгдэнэ).
> Серверийн нууц түлхүүр (service account) апп-д хэрэггүй — Firestore-д client SDK +
> security rules-аар, public tracking-д `trackOrder` Cloud Function-аар хандана.

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

> **Зөвхөн эхний admin-г л Console-оос гараар үүсгэнэ.** Үүний дараа бусад
> хэрэглэгчийг **`/admin/users`** хуудаснаас удирдана (доор).

### Дараагийн хэрэглэгчид — `/admin/users` (Хэрэглэгчид цэс)

Эхний admin нэвтэрсний дараа Firestore Console руу орох шаардлагагүй. Шинэ
хэрэглэгчийг 2 алхмаар нэмнэ:

1. **Firebase Console → Authentication → Add user** (имэйл + нууц үг) → үүсэх **UID-г хуулах**.
2. Апп дотор **Хэрэглэгчид (`/admin/users`) → «+ Шинэ хэрэглэгч нэмэх»**:
   - Хуулсан **UID** тавина
   - Нэр, имэйл, утас бөглөнө
   - **Эрх** сонгоно: `admin` / `partner` / `driver`
   - `partner` бол **байгууллага**, `driver` бол **жолооч** сонгоно (companyId / driverId автоматаар бичигдэнэ)
   - **Идэвхтэй** тэмдэглээд **Үүсгэх**

> Энэ нь `users/{uid}` document-ийг доорх бүтэцтэйгээр үүсгэнэ:
> ```json
> {
>   "name": "...", "email": "...", "phone": "...",
>   "role": "admin | partner | driver",
>   "companyId": "(partner үед)", "driverId": "(driver үед)",
>   "isActive": true,
>   "createdAt": "<timestamp>", "updatedAt": "<timestamp>"
> }
> ```
> Эрх засах, идэвхтэй/идэвхгүй болгох, нэр/утсаар хайхыг мөн `/admin/users` дээр хийнэ.

### Production smoke test (deploy дараа)

1. **Admin login** → `/admin/dashboard`
2. **Company create** (`/admin/companies`)
3. **Product create** (`/admin/products`)
4. **Driver create** (`/admin/drivers`)
5. **Partner user create** — Console: Auth user + `users/{uid}` (`role:"partner"`, `companyId`)
6. **Partner order create** (`/partner/orders/new`)
7. **Admin assign driver** (`/admin/orders` → код → жолооч оноох)
8. **Driver delivered** — жолоочоор нэвтэрч статусыг `Хүргэгдсэн` болгох
9. **Public tracking** — `/track/view?code={orderCode}` (утас masked, хаяг нуусан)

> Бүрэн checklist → [DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md)

---

## 3. Firebase CLI холбох

```bash
npm install -g firebase-tools
npm run firebase:login                 # firebase login
firebase use --add                     # төсөл сонгож .firebaserc үүсгэх
```

> Static export тул `webframeworks` туршилт **шаардахгүй**. [firebase.json](firebase.json)
> нь зүгээр л `out/` хавтсыг хост хийж, бүх замыг `/index.html` руу rewrite хийнэ (SPA).

`.firebaserc` (төсөл сонгоход автоматаар үүснэ):

```json
{ "projects": { "default": "<your-project-id>" } }
```

---

## 4. Deploy

Аппыг **static export** хийж Firebase Hosting-д, backend-ийг тусад нь deploy хийнэ.

### Workflow (товчоор)

```bash
# Development
npm run dev

# Build (static export → out/)
npm run build

# Deploy Hosting (out/ → hurdexpress.mn)
firebase deploy --only hosting

# Deploy Rules (Firestore rules + indexes)
firebase deploy --only firestore:rules,firestore:indexes
```

> `git push` нь зөвхөн кодоо GitHub-д хадгална — **deploy trigger БИШ**. Deploy үргэлж
> дээрх командаар гар аргаар хийгдэнэ.

### A. Бүтэн deploy (хамгийн түгээмэл)

```bash
npm run deploy            # next build (→ out/) + firebase deploy --only hosting
```

`npm run deploy` нь дотроо `next build` ажиллуулж `out/` static хавтас үүсгээд,
дараа нь зөвхөн hosting-г deploy хийнэ.

### B. Тус тусад нь

```bash
npm run build             # static export → out/
npm run deploy:hosting    # out/ → Firebase Hosting (hurdexpress.mn)
npm run deploy:functions  # trackOrder + триггер functions (Admin SDK)
npm run deploy:rules      # firestore.rules + firestore.indexes.json
```

**Дараалал (анх удаа):**

1. Кодоо **GitHub repo** руу push (зөвхөн version control).
2. `npm run deploy:functions` — `trackOrder` Cloud Function + Firestore триггерүүд.
3. `npm run deploy:rules` — Firestore rules + indexes.
4. `npm run deploy` — апп build хийж Hosting-д.

**Тэмдэглэл:**
- `NEXT_PUBLIC_*` env нь **build үед** inline хийгддэг тул deploy хийхээсээ өмнө
  `.env.local` (эсвэл CI env)-д зөв утгууд байх ёстой.
- Public tracking ([trackOrder](functions/src/index.ts)) нь CORS-той Cloud Function —
  static апп-аас шууд `fetch` хийнэ ([src/lib/trackUrl.ts](src/lib/trackUrl.ts)).
- Бүх dynamic дэлгэрэнгүй хуудас (order detail / print / track) нь **query-param**
  client route (`?id=` / `?code=`) — static export-д dynamic `[id]` сегмент байхгүй.

### C. Домэйн (hurdexpress.mn) — Firebase **Hosting** дээр

`hurdexpress.mn` нь **Firebase Hosting**-д (App Hosting-д **БИШ**) холбогдоно:

1. **Firebase Console → Hosting → Add custom domain** → `hurdexpress.mn` (+ `www`).
2. Console-оос өгсөн **A / TXT** бичлэгүүдийг домэйн бүртгүүлэгчдээ нэмнэ.
3. SSL сертификат идэвхжихийг хүлээгээд (хэдэн цаг) `https://hurdexpress.mn` амьд болно.
4. `NEXT_PUBLIC_APP_URL=https://hurdexpress.mn` болгож дахин build + `npm run deploy`
   (QR кодын tracking холбоос зөв домэйн рүү заана).

### D. Хуучин App Hosting-г унтраах (auto-deploy зогсоох)

> ℹ️ Энэ хэсэг нь **зөвхөн өмнө нь App Hosting дээр deploy хийж байсан бол** хамаатай.
> Шинээр эхэлж байгаа бол App Hosting backend огт байхгүй тул алгасаж болно.

Өмнө нь App Hosting (Cloud Run) дээр байсан бол **git push бүрт автоматаар rollout**
(release) үүсгэдэг. Үүнийг бүрэн зогсооно.

> ### ⚠️ Устгахын өмнө — домэйнгээ шалга
> Backend-ийг устгахаас **ӨМНӨ** `hurdexpress.mn` custom domain нь **Firebase Hosting**
> дээр холбогдсон, идэвхтэй (SSL ногоон) байгаа эсэхийг заавал шалга (дээрх **C** хэсэг).
> Эс бөгөөс backend устсаны дараа домэйн 404 өгөх эрсдэлтэй. Шилжүүлсний дараа
> `https://hurdexpress.mn` нээгдэж static апп ачаалагдаж байгааг баталгаажуул.

**Console дээрх алхмууд:**

1. **Firebase Console → App Hosting** руу орно.
2. **hurdexpress** backend-ийг сонгоно.
3. **Settings → GitHub** хэсэгт **automatic rollout / deployment connection** байвал
   **Disconnect** дарж GitHub холболтыг салгана (цаашид push хийхэд release үүсэхгүй).
4. Backend-ийг огт ашиглахгүй бол **Settings → Delete backend** дарж бүрэн устгаж болно.

**CLI-аар (нэг хувилбар):**

```bash
# Backend-уудаа жагсаах
firebase apphosting:backends:list --project <project-id>

# GitHub холболт + auto-rollout-той backend-г устгах
firebase apphosting:backends:delete <backend-id> --project <project-id>
```

> Disconnect/Delete хийсний дараа GitHub repo руу push хийхэд **дахин deploy
> хийгдэхгүй** болно (repo нь зөвхөн version control болж үлдэнэ). Production трафик
> зөвхөн дээрх **C** хэсгийн Firebase Hosting домэйн (`hurdexpress.mn`) руу очно.

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
- **Partner** ([/partner/orders/detail](src/app/partner/orders/detail/page.tsx)) — `on_the_way` үед зөвхөн өөрийн захиалгын жолоочийн marker ([order.lastDriverLocation](src/lib/firebase/locations.ts) денормализ).
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
   npm run deploy:functions
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
| `npm run build` | Static export build (→ `out/`) |
| `npm run lint` | ESLint |
| `npm run seed` | Demo дата seed (client SDK) |
| `npm run deploy` | `build` + `firebase deploy --only hosting` |
| `npm run deploy:hosting` | Зөвхөн hosting (`out/`) |
| `npm run deploy:functions` | functions install + deploy |
| `npm run deploy:rules` | Firestore rules + indexes |
| `npm run firebase:login` | Firebase нэвтрэх |
| `npm run firebase:init` | Firebase init |

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
    track/view/             Public tracking (?code= — client, Suspense)
    manifest.ts             PWA manifest
    offline/                Офлайн fallback
  components/               admin/ partner/ driver/ notifications/ tracking/ ...
  contexts/AuthContext.tsx  Firebase auth + role
  lib/                      firebase/, settings, reports, dashboard, ...
functions/src/index.ts      trackOrder Cloud Function (Admin SDK)
firebase.json               Hosting (static out/) + Functions + Firestore
next.config.ts              output:"export" — static export тохиргоо
firestore.rules             Production security rules
firestore.indexes.json      Composite index-үүд
storage.rules               Storage rules
SECURITY.md                 Эрх, rules, tracking аюулгүй байдал
```

## Тэмдэглэл

- Firebase-г тохиргоо байхгүй үед ч унахгүй ([src/lib/firebase.ts](src/lib/firebase.ts) `isFirebaseConfigured`).
- Notification fan-out (driver → partner/admin)-ийг production-д Cloud Function болгох — [SECURITY.md](SECURITY.md).
- Static export тул SSR / API route / server action **байхгүй** — бүх дата client SDK + Cloud Function-аар. Auth-аар хамгаалагдсан хуудаснууд client guard (`AdminGuard`/`PartnerGuard`/`DriverGuard`)-аар хяналттай.
