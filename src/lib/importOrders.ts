import {
  collection,
  doc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import * as XLSX from "xlsx";
import { db } from "@/lib/firebase";
import { generateOrderCode } from "@/lib/firebase/orders";
import type { Product } from "@/types";

// Template-ийн багана — шинэ захиалгын маягттай нэг мөр.
// Хүлээн авагчийн НЭР байхгүй (маягт дээр ч хасагдсан — утас нь таних тэмдэг),
// үнэ нь бараанаас автоматаар бодогдоно (гараар оруулахгүй).
export interface RawRow {
  receiverPhone: string;
  cityDistrict: string;
  addressNote: string;
  productName: string;
  qty: number;
  discount: number;
  note: string;
}

export interface ValidatedRow extends RawRow {
  ok: boolean;
  error?: string;
  productId?: string;
  productImageUrl?: string;
  price?: number; // нэгжийн үнэ (бараанаас)
  codAmount?: number; // price × qty
}

// Excel файлыг уншиж эхний sheet-г мөр болгоно.
// Толгойн мөр нь монгол нэртэй тул баганы ДАРААЛЛААР уншина:
//   A=утас, B=дүүрэг, C=хаягийн дэлгэрэнгүй, D=барааны нэр, E=тоо,
//   F=хөнгөлөх дүн, G=тэмдэглэл
export async function parseWorkbook(file: File): Promise<RawRow[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "" });

  return rows
    .slice(1) // толгойн мөрийг алгасна
    .map((r) => ({
      receiverPhone: String(r[0] ?? "").trim(),
      cityDistrict: String(r[1] ?? "").trim(),
      addressNote: String(r[2] ?? "").trim(),
      productName: String(r[3] ?? "").trim(),
      qty: Number(r[4]),
      discount: Number(r[5]) || 0,
      note: String(r[6] ?? "").trim(),
    }))
    // Бүрэн хоосон мөрийг хаяна (Excel-д доор нь хоосон мөр үлддэг).
    .filter((r) => r.receiverPhone || r.addressNote || r.productName);
}

// Validation + бараа таних (нэрээр → product).
export function validateRows(rows: RawRow[], products: Product[]): ValidatedRow[] {
  const byName = new Map<string, Product>();
  for (const p of products) {
    if (p.isActive) byName.set(p.name.trim().toLowerCase(), p);
  }

  return rows.map((r) => {
    if (!r.receiverPhone) return { ...r, ok: false, error: "Утас хоосон" };
    if (!r.cityDistrict) return { ...r, ok: false, error: "Дүүрэг хоосон" };
    if (!r.addressNote) return { ...r, ok: false, error: "Хаягийн дэлгэрэнгүй хоосон" };
    if (Number.isNaN(r.qty) || r.qty <= 0)
      return { ...r, ok: false, error: "Тоо ширхэг буруу" };

    const product = r.productName ? byName.get(r.productName.toLowerCase()) : undefined;
    if (!product) {
      return { ...r, ok: false, error: `Бараа олдсонгүй: ${r.productName || "(хоосон)"}` };
    }

    const available = product.availableQty ?? 0;
    if (r.qty > available) {
      return { ...r, ok: false, error: `Үлдэгдэл хүрэлцэхгүй (боломжит ${available} ш)` };
    }

    return {
      ...r,
      ok: true,
      productId: product.id,
      productName: product.name,
      productImageUrl: product.thumbnailUrl || product.photoUrl,
      price: product.price,
      codAmount: product.price * r.qty,
    };
  });
}

export interface ImportContext {
  companyId: string;
  companyName: string;
  defaultDeliveryPrice: number;
  createdByUid: string;
}

// Зөвхөн valid мөрүүдийг batch-аар үүсгэнэ (chunk бүрт progress).
export async function importOrders(
  rows: ValidatedRow[],
  ctx: ImportContext,
  onProgress?: (done: number, total: number) => void,
): Promise<{ success: number }> {
  const valid = rows.filter((r) => r.ok);
  const CHUNK = 20;
  let done = 0;

  for (let i = 0; i < valid.length; i += CHUNK) {
    const slice = valid.slice(i, i + CHUNK);
    const batch = writeBatch(db);
    for (const r of slice) {
      const ref = doc(collection(db, "orders"));
      const cod = r.codAmount ?? 0;
      const discount = Math.max(0, r.discount || 0);
      const total = cod + ctx.defaultDeliveryPrice - discount;
      // Маягттай ижил бүтэц: нэрийн оронд утас, бүтэцлэгдсэн хаяг.
      const receiverAddress = `${r.cityDistrict} дүүрэг, ${r.addressNote}`;

      batch.set(ref, {
        orderCode: generateOrderCode(),
        companyId: ctx.companyId,
        companyName: ctx.companyName,
        createdByUid: ctx.createdByUid,
        receiverName: r.receiverPhone,
        receiverPhone: r.receiverPhone,
        receiverAddress,
        deliveryType: "city",
        cityDistrict: r.cityDistrict,
        addressNote: r.addressNote,
        itemName: r.productName ?? "",
        productId: r.productId,
        productName: r.productName,
        ...(r.productImageUrl ? { productImageUrl: r.productImageUrl } : {}),
        qty: r.qty,
        deliveryPrice: ctx.defaultDeliveryPrice,
        codAmount: cod,
        discount,
        totalAmount: total,
        status: "pending",
        ...(r.note ? { note: r.note } : {}),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
    done += slice.length;
    onProgress?.(done, valid.length);
  }

  return { success: valid.length };
}
