# HurdExpress — QA Test Checklist

Firebase deploy хийхээс өмнө бүх flow-г шалгах жагсаалт.
Эхлээд **demo дата seed** хийнэ:

```bash
npm run seed
```

Demo бүртгэлүүд (нууц үг: `Demo123!`):

| Имэйл | Role | Чиглүүлэх |
| --- | --- | --- |
| admin@demo.hurdexpress.mn | admin | /admin/dashboard |
| partner@demo.hurdexpress.mn | partner (Hurd Fashion) | /partner/orders |
| driver@demo.hurdexpress.mn | driver (Бат) | /driver/orders |

---

## 1. Login test
- [ ] `/login` хуудас зөв ачаалагдана (navy + orange, mobile responsive)
- [ ] Хоосон имэйл/нууц үгээр → validation алдаа
- [ ] Буруу нууц үг → "Имэйл эсвэл нууц үг буруу байна"
- [ ] admin нэвтрэхэд → `/admin/dashboard`
- [ ] partner нэвтрэхэд → `/partner/orders`
- [ ] driver нэвтрэхэд → `/driver/orders`
- [ ] `isActive:false` хэрэглэгч → "Таны эрх идэвхгүй байна"
- [ ] role-гүй/companyId-гүй partner → тохирох алдаа

## 2. Admin test
- [ ] Dashboard 8 stat card бодит тоо харуулна (өнөөдрийн захиалга, COD г.м.)
- [ ] Статус summary progress bar зөв хувь
- [ ] Сүүлийн захиалгууд table харагдана
- [ ] **Company нэмэх** → жагсаалтад realtime гарч ирнэ
- [ ] Company засах / active toggle
- [ ] **Product нэмэх** → company dropdown active компаниудыг харуулна
- [ ] Барааг нэр/SKU-аар хайх, company filter
- [ ] **Driver нэмэх** → тээврийн төрөл, статус
- [ ] Driver-ийг нэр/утсаар хайх, status filter
- [ ] **Order харах** — бүх захиалга, search (код/утас/нэр/байгууллага)
- [ ] Status / company / driver filter ажиллана
- [ ] **Driver оноох** modal → жолооч сонгоход status `assigned` болно
- [ ] Inline статус өөрчлөлт → `delivered` болгоход deliveredAt
- [ ] **Report** — огнооны муж (өнөөдөр/7 хоног/сар/custom)
- [ ] Report cards болон 3 table зөв тоо
- [ ] CSV татах ажиллана (Excel дээр кирилл зөв)
- [ ] **Settings** хадгалах → success toast, realtime унших

## 3. Partner test
- [ ] Зөвхөн өөрийн (Hurd Fashion) захиалгууд харагдана
- [ ] Бусад компанийн захиалга **харагдахгүй**
- [ ] **Шинэ захиалга** — байгууллага түгжээтэй (өөрийнх)
- [ ] Бараа dropdown зөвхөн өөрийн **active** бараа
- [ ] Бараа сонгоход itemName + COD авто бөглөгдөнө
- [ ] Хүргэлтийн үнэ default = settings.defaultDeliveryPrice
- [ ] Validation: нэр/утас/хаяг/тоо/үнэ
- [ ] Хадгалахад orderCode үүсч, `/partner/orders` руу буцна
- [ ] Шинэ захиалга жагсаалтад realtime орно
- [ ] Mobile bottom navigation ажиллана

## 4. Driver test
- [ ] Зөвхөн өөрт (Бат) оноогдсон захиалгууд харагдана
- [ ] Статус chip filter ажиллана
- [ ] **Дэлгэрэнгүй** → захиалгын мэдээлэл
- [ ] **Залгах** товч `tel:` нээнэ
- [ ] **Google Maps** товч `maps/search?api=1&query=` нээнэ
- [ ] "Бараа авсан" → `picked_up` + pickedUpAt
- [ ] "Замдаа" → `on_the_way`
- [ ] "Хүргэгдсэн" → `delivered` + deliveredAt
- [ ] "Амжилтгүй" → `failed`
- [ ] **COD авсан** checkbox + тэмдэглэл хадгалагдана
- [ ] Activity timeline шинэ үйлдлүүдийг харуулна
- [ ] Том товч, touch-friendly (mobile)

## 5. Tracking test
- [ ] `/login` дээрх tracking хэсэгт orderCode оруулж хайна
- [ ] Олдсон захиалгын төлөв timeline харагдана
- [ ] Олдохгүй код → "захиалга олдсонгүй"
- [ ] Хоосон → validation алдаа
- [ ] **receiverPhone masked** (•••• + сүүлийн 4 орон)
- [ ] **receiverAddress огт харагдахгүй**
- [ ] failed/cancelled → warning state
- [ ] settings.trackingEnabled=false → "Төлөв шалгах үйлчилгээ түр хаалттай"

## 6. Notification test
- [ ] Admin driver онооход → жолоочийн 🔔-д мэдэгдэл
- [ ] Bell дээр unread тоо realtime шинэчлэгдэнэ
- [ ] Dropdown жагсаалт, "Бүгдийг уншсан"
- [ ] Мэдэгдэл уншсаны дараа тоо буурна

## 7. Security rules test
> Console → Firestore → Rules Playground эсвэл emulator (SECURITY.md)
- [ ] Нэвтрээгүй хэрэглэгч `orders` шууд уншиж **чадахгүй**
- [ ] Partner **өөр компанийн** orders уншиж чадахгүй
- [ ] Driver **өөр жолоочийн** orders уншиж чадахгүй
- [ ] Driver `driverId`/`companyId` өөрчилж чадахгүй
- [ ] Partner `status`/`driverId` засаж чадахгүй
- [ ] Хэрэглэгч өөр хүний notification уншиж чадахгүй
- [ ] Driver/partner notification **үүсгэж чадахгүй** (зөвхөн admin)
- [ ] Unauthenticated `/admin/*` → `/login` руу redirect

## 8. Mobile / PWA test
- [ ] Manifest зөв (`/manifest.webmanifest`), icon 192/512
- [ ] Chrome DevTools → Application → Manifest алдаагүй
- [ ] Lighthouse → PWA installable
- [ ] Android: "Install" / "Нүүр дэлгэцэнд нэмэх"
- [ ] iOS Safari: Share → Add to Home Screen hint
- [ ] Standalone горимд install hint **харагдахгүй**
- [ ] Safe-area (notch / home indicator) padding зөв
- [ ] Офлайн болгоход улаан "Интернет холболтоо шалгана уу" банер

## 9. Firebase Hosting deploy test
- [ ] `npm run build` алдаагүй
- [ ] `npm run lint` цэвэр
- [ ] `firebase experiments:enable webframeworks`
- [ ] `npm run firebase:deploy:rules` амжилттай
- [ ] `npm run firebase:deploy:functions` (Blaze) — trackOrder deploy
- [ ] `npm run firebase:deploy:hosting` — Next.js app
- [ ] Hosting URL дээр `/login` ачаалагдана
- [ ] `/admin/*`, `/partner/*`, `/driver/*` dynamic route ажиллана
- [ ] `/api/track-order?code=...` → trackOrder function хариулна
- [ ] Production дээр tracking утас masked, хаяг нуусан

---

## Дата цэвэрлэх
Seed дата нь `seed-*` ID-тай тул Firestore Console-оос хайж устгаж болно.
Demo Auth хэрэглэгчдийг Authentication → Users-ээс устгана.
