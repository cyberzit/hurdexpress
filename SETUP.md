# HurdExpress — Өөр компьютер дээр ажиллуулах заавар

GitHub: `https://github.com/cyberzit/hurdexpress`
Live: `https://hurdexpress.mn` (Firebase Hosting — static export)
Project: `hurdexpress-49cd2`

---

## 0. Урьдчилсан шаардлага

- **Node.js 20+** ([nodejs.org](https://nodejs.org))
- **Git**
- (Deploy хийх бол) **Firebase CLI** — `npm install -g firebase-tools`

---

## 1. Код татах + суулгах

```bash
git clone https://github.com/cyberzit/hurdexpress.git
cd hurdexpress
npm install
```

---

## 2. `.env.local` файл үүсгэх ⚠️ (хамгийн чухал)

Энэ файл **GitHub-д ОРООГҮЙ** (нууц учраас). Project-ийн үндэс хавтаст
`.env.local` нэртэй шинэ файл үүсгээд дараахыг бөглөнө:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=hurdexpress-49cd2.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=hurdexpress-49cd2
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=hurdexpress-49cd2.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_VAPID_KEY=...
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...
NEXT_PUBLIC_APP_URL=https://hurdexpress.mn
```

> 💡 Хамгийн амар арга: **одоогийн компьютерийнхаа `.env.local` файлыг хуулж**
> (USB / мессеж / нот) шинэ компьютерт тавь. Бүтэц нь [.env.example](.env.example)-д бий.
>
> Утгуудыг Firebase Console → Project Settings → Your apps → SDK config-оос,
> Maps key-г Google Cloud Console → Keys & Credentials-аас авна.

---

## 3. Локал ажиллуулах

```bash
npm run dev
```
→ http://localhost:3000 нээгдэнэ.

`.env.local` зөв бол шууд ажиллана — өөр тохиргоо хэрэггүй.

---

## 4. Deploy хийх (заавал биш)

```bash
firebase login            # эхний удаа — Google account
```
> `.firebaserc`-д project (`hurdexpress-49cd2`) бичигдсэн тул `firebase use` хэрэггүй.

| Команд | Үүрэг |
| --- | --- |
| `npm run deploy` | App build (`out/`) + Hosting deploy |
| `firebase deploy --only firestore:rules` | Firestore rules |
| `firebase deploy --only storage` | Storage rules (зураг/лого) |
| `npm run deploy:functions` | Cloud Functions (notification, auto-dispatch, inventory) |

**Бүх зүйлийг deploy хийх (томоохон өөрчлөлтийн дараа):**
```bash
npm run deploy:functions
firebase deploy --only firestore:rules,storage
npm run deploy
```

---

## 5. NPM scripts

| Script | Үйлдэл |
| --- | --- |
| `npm run dev` | Локал dev server |
| `npm run build` | Static export build (→ `out/`) |
| `npm run lint` | ESLint шалгах |
| `npm run deploy` | build + hosting |
| `npm run deploy:functions` | functions install + deploy |
| `npm run deploy:rules` | firestore rules + indexes |

---

## 6. Анхаарах зүйл

- **`.env.local` хэзээ ч git-д commit хийхгүй** (gitignore-д бий, нууц түлхүүртэй).
- GitHub push нь **auto-deploy хийхгүй** — deploy үргэлж гар аргаар (`npm run deploy`).
- Production URL зөвхөн **`https://hurdexpress.mn`** (App Hosting `*.hosted.app` биш).
- Cloud Function / rules өөрчилбөл **заавал тусад нь deploy** хийнэ (`npm run deploy` зөвхөн app-ыг шинэчилнэ).
- Firebase Console → Authentication → **Email/Password** идэвхтэй байх ёстой (нэвтрэлт, хэрэглэгч үүсгэхэд).

---

## 7. Товч (TL;DR)

```bash
git clone https://github.com/cyberzit/hurdexpress.git
cd hurdexpress
npm install
# .env.local файлаа тавих (хуучин компьютерээсээ хуулах)
npm run dev          # локал
npm run deploy       # live болгох (firebase login хийсний дараа)
```
