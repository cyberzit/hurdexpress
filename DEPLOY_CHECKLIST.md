# HurdExpress — Production Deploy Checklist

Firebase Hosting дээр online гаргахын өмнө дараах алхмуудыг дараалан гүйцэтгэнэ.

> **Тэмдэглэл:** Deploy нь **гар аргаар** локалаас хийгдэнэ. `git push` нь зөвхөн
> код хадгална — **auto-deploy хийгдэхгүй**. Production URL зөвхөн
> `https://hurdexpress.mn` (Firebase Hosting), App Hosting `*.hosted.app` биш.

## 0. Урьдчилсан бэлтгэл (локал)

- [ ] `npm install`
- [ ] `.env.local` бөглөсөн (доорх env-үүд) — `.env.example` харна уу
- [ ] `npm run lint` — алдаагүй
- [ ] `npm run build` — алдаагүй

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=        # (заавал биш)
NEXT_PUBLIC_FIREBASE_VAPID_KEY=         # (push — заавал биш)
NEXT_PUBLIC_APP_URL=                    # QR кодын домэйн (заавал биш)
NEXT_PUBLIC_TRACK_ORDER_URL=            # trackOrder функцийн URL (заавал биш)
```

> Static export тул бүх env нь `NEXT_PUBLIC_` (build үед inline). Серверийн
> service account түлхүүр апп-д хэрэггүй.

## 1. Firebase project

- [ ] Firebase Console дээр project үүсгэсэн
- [ ] **Authentication** идэвхжүүлж, Email/Password sign-in нээсэн
- [ ] **Firestore Database** үүсгэсэн (production mode)
- [ ] **Hosting** идэвхжүүлсэн
- [ ] **Functions** — Blaze (pay-as-you-go) төлөвлөгөө идэвхжүүлсэн
- [ ] (заавал биш) **Storage** идэвхжүүлсэн

## 2. Firebase CLI

- [ ] `npm i -g firebase-tools`
- [ ] `npm run firebase:login`
- [ ] `firebase use --add` → project сонгож `.firebaserc` үүсгэсэн

## 3. Rules + Indexes deploy

- [ ] `npm run deploy:rules` — `firestore.rules` + `firestore.indexes.json`
- [ ] (Storage хэрэглэвэл) `firebase deploy --only storage`

## 4. Admin user (нэг удаа, гараар)

> Rules нь `users` document-ийг зөвхөн admin үүсгэхийг зөвшөөрдөг тул эхнийхийг Console-оос үүсгэнэ.

- [ ] **Authentication → Users → Add user** (имэйл + нууц үг) → UID хуулах
- [ ] **Firestore → `users` коллекц → Document ID = тэр UID**:

```json
{
  "name": "Admin",
  "email": "admin@hurdexpress.mn",
  "phone": "99999999",
  "role": "admin",
  "isActive": true
}
```

## 5. Functions deploy (push + SMS + tracking)

- [ ] `npm run deploy:functions`
- [ ] (заавал биш) SMS — Admin → Тохиргоо → провайдер/API key
- [ ] (заавал биш) Push — `NEXT_PUBLIC_FIREBASE_VAPID_KEY` тохируулсан

## 6. Hosting deploy

- [ ] `npm run deploy` (build → `out/` → `firebase deploy --only hosting`)
- [ ] `out/` хавтас үүссэн; Hosting URL дээр `/login` ачаалагдаж байна

## 7. Custom domain (заавал биш)

- [ ] Console → Hosting → Add custom domain → DNS тохируулга
- [ ] `NEXT_PUBLIC_APP_URL`-г шинэ домэйнаар тохируулж дахин deploy

## 8. Production smoke test

- [ ] Admin login → `/admin/dashboard`
- [ ] Company create (`/admin/companies`)
- [ ] Product create (`/admin/products`)
- [ ] Driver create (`/admin/drivers`)
- [ ] Partner user create (Console: Auth user + `users/{uid}` `role:"partner"`, `companyId`)
- [ ] Partner login → order create (`/partner/orders/new`)
- [ ] Admin assign driver (`/admin/orders` → код → жолооч оноох)
- [ ] Driver login → status `delivered` болгох
- [ ] Public tracking (`/track/view?code={orderCode}`) — утас masked, хаяг нуусан

## Security баталгаажуулалт

- [ ] Нэвтрээгүй хэрэглэгч `/admin/*` руу орвол `/login` руу шиднэ
- [ ] Partner өөр компанийн захиалга харахгүй
- [ ] Driver өөр жолоочийн захиалга харахгүй
- [ ] SMS API key зэрэг нууц утга client bundle-д ороогүй (зөвхөн functions талд)
- [ ] Туршилтын admin (`admin@hurdexpress.mn` / `HurdAdmin2026!`) нууц үгийг солих эсвэл устгах

> Дэлгэрэнгүй rules тайлбар → [SECURITY.md](SECURITY.md). Тест жагсаалт → [QA_CHECKLIST.md](QA_CHECKLIST.md).
