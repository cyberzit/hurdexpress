// Барааг Excel-ээр бөөнөөр оруулах — загвар үүсгэх, унших, шалгах, хадгалах.
import { collection, doc, serverTimestamp, writeBatch } from "firebase/firestore";
import * as XLSX from "xlsx";
import { db } from "@/lib/firebase";
import type { Product } from "@/types";
const COLLECTION = "products";
// Загварын багануудын толгой. parseWorkbook эдгээр нэрээр уншина.
const HEADERS = ["name", "price", "description"] as const;
const HEADER_LABELS: Record<(typeof HEADERS)[number], string> = {
  name: "Барааны нэр (заавал)",
  price: "Үнэ (₮, заавал)",
  description: "Тайлбар",
};
export interface RawProductRow {
  name: string;
  price: number;
  description: string;
}
export interface ValidatedProductRow extends RawProductRow {
  ok: boolean;
  error?: string;
}
// Загвар .xlsx үүсгэж татуулна. Статик файл биш — parser-тэй үргэлж таарна.
//
// "Бараа" хуудсанд ЗӨВХӨН толгойн мөр байна. Жишээг тусдаа "Заавар" хуудсанд
// тавьсан — эс бөгөөс хэрэглэгч устгахаа мартаад жишээ мөр бодит бараа болно.
export function downloadTemplate(): void {
  const wb = XLSX.utils.book_new();

  const ws = XLSX.utils.aoa_to_sheet([HEADERS.map((h) => HEADER_LABELS[h])]);
  ws["!cols"] = [{ wch: 32 }, { wch: 16 }, { wch: 36 }];
  XLSX.utils.book_append_sheet(wb, ws, "Бараа");

  // Импорт эхний хуудсыг л уншдаг тул энэ хуудас өгөгдөлд нөлөөлөхгүй.
  const guide = XLSX.utils.aoa_to_sheet([
    ["ЗААВАР — энэ хуудсыг импорт УНШИХГҮЙ"],
    [],
    ['1. "Бараа" хуудас руу шилжинэ үү.'],
    ["2. 2-р мөрнөөс эхлэн бараагаа бичнэ (1-р мөр буюу толгойг битгий устгаарай)."],
    ["3. Хадгалаад .xlsx файлаа системд оруулна."],
    [],
    ["Жишээ:"],
    [...HEADERS.map((h) => HEADER_LABELS[h])],
    ["Торон дотоож", 35000, "Хар өнгө, L размер"],
    ["Аяны аяга", 12500, ""],
    [],
    ["Анхаар:"],
    ["· Барааны нэр давхардах ёсгүй."],
    ["· Үнийг зөвхөн тоогоор бичнэ (₮ тэмдэг, таслал хэрэггүй)."],
    ["· Тайлбар заавал биш."],
  ]);
  guide["!cols"] = [{ wch: 34 }, { wch: 16 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, guide, "Заавар");

  XLSX.writeFile(wb, "hurdexpress-baraa-zagvar.xlsx");
}
// Excel-ийн эхний sheet-ийг мөр болгоно. Толгойн мөр нь монгол нэртэй тул
// баганы ДАРААЛЛААР уншина (A=name, B=price, C=description).
export async function parseProductWorkbook(file: File): Promise<RawProductRow[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "" });
  return rows
    .slice(1) // толгойн мөрийг алгасна
    .map((r) => ({
      name: String(r[0] ?? "").trim(),
      price: Number(r[1]) || 0,
      description: String(r[2] ?? "").trim(),
    }))
    .filter((r) => r.name || r.price); // бүрэн хоосон мөрийг хаяна
}
export function validateProductRows(
  rows: RawProductRow[],
  existing: Product[],
): ValidatedProductRow[] {
  // Захиалгын Excel импорт барааг НЭРЭЭР таьдаг тул нэр давхардах ёсгүй.
  const existingNames = new Set(existing.map((p) => p.name.trim().toLowerCase()));
  const seenName = new Set<string>();
  return rows.map((r) => {
    if (!r.name) return { ...r, ok: false, error: "Барааны нэр хоосон" };
    if (!Number.isFinite(r.price) || r.price <= 0) {
      return { ...r, ok: false, error: "Үнэ буруу (0-ээс их тоо байх ёстой)" };
    }
    const nameKey = r.name.toLowerCase();
    if (existingNames.has(nameKey)) {
      return { ...r, ok: false, error: `Ийм нэртэй бараа аль хэдийн бүртгэлтэй: ${r.name}` };
    }
    if (seenName.has(nameKey)) {
      return { ...r, ok: false, error: `Файл дотор нэр давхардсан: ${r.name}` };
    }
    seenName.add(nameKey);
    return { ...r, ok: true };
  });
}
// Зөв мөрүүдийг багцаар хадгална. Firestore batch дээд хязгаар 500 тул хуваана.
export async function importProducts(
  rows: ValidatedProductRow[],
  ctx: { companyId: string; companyName: string },
): Promise<number> {
  const valid = rows.filter((r) => r.ok);
  if (valid.length === 0) return 0;
  const CHUNK = 400;
  for (let i = 0; i < valid.length; i += CHUNK) {
    const batch = writeBatch(db);
    for (const r of valid.slice(i, i + CHUNK)) {
      const ref = doc(collection(db, COLLECTION));
      batch.set(ref, {
        companyId: ctx.companyId,
        companyName: ctx.companyName,
        name: r.name,
        price: r.price,
        ...(r.description ? { description: r.description } : {}),
        // Агуулахын үлдэгдэл — admin дараа нь оруулна.
        stockQty: 0,
        reservedQty: 0,
        availableQty: 0,
        lowStockAlertQty: 0,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
  }
  return valid.length;
}
