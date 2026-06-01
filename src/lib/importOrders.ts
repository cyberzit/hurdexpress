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

// Template-ийн багана
export interface RawRow {
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  productSku: string;
  qty: number;
  codAmount: number;
  note: string;
}

export interface ValidatedRow extends RawRow {
  ok: boolean;
  error?: string;
  productId?: string;
  productName?: string;
}

// Excel файлыг уншиж эхний sheet-г мөр болгоно.
export async function parseWorkbook(file: File): Promise<RawRow[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
  return json.map((r) => ({
    receiverName: String(r.receiverName ?? "").trim(),
    receiverPhone: String(r.receiverPhone ?? "").trim(),
    receiverAddress: String(r.receiverAddress ?? "").trim(),
    productSku: String(r.productSku ?? "").trim(),
    qty: Number(r.qty),
    codAmount: Number(r.codAmount) || 0,
    note: String(r.note ?? "").trim(),
  }));
}

// Validation + бараа таних (SKU → product).
export function validateRows(rows: RawRow[], products: Product[]): ValidatedRow[] {
  const bySku = new Map<string, Product>();
  for (const p of products) {
    if (p.isActive && p.sku) bySku.set(p.sku.trim().toLowerCase(), p);
  }

  return rows.map((r) => {
    if (!r.receiverName) return { ...r, ok: false, error: "Нэр хоосон" };
    if (!r.receiverPhone) return { ...r, ok: false, error: "Утас хоосон" };
    if (!r.receiverAddress) return { ...r, ok: false, error: "Хаяг хоосон" };
    if (Number.isNaN(r.qty) || r.qty <= 0)
      return { ...r, ok: false, error: "Тоо ширхэг буруу" };

    const product = r.productSku ? bySku.get(r.productSku.toLowerCase()) : undefined;
    if (!product) {
      return { ...r, ok: false, error: `SKU олдсонгүй: ${r.productSku || "(хоосон)"}` };
    }

    return {
      ...r,
      ok: true,
      productId: product.id,
      productName: product.name,
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
      const total = r.codAmount + ctx.defaultDeliveryPrice;
      batch.set(ref, {
        orderCode: generateOrderCode(),
        companyId: ctx.companyId,
        companyName: ctx.companyName,
        createdByUid: ctx.createdByUid,
        receiverName: r.receiverName,
        receiverPhone: r.receiverPhone,
        receiverAddress: r.receiverAddress,
        itemName: r.productName ?? "",
        productId: r.productId,
        productName: r.productName,
        qty: r.qty,
        deliveryPrice: ctx.defaultDeliveryPrice,
        codAmount: r.codAmount,
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
