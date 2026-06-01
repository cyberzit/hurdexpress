import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Product } from "@/types";

const COLLECTION = "products";

export interface ProductInput {
  companyId: string;
  companyName: string;
  name: string;
  sku?: string;
  price: number;
  photoUrl?: string;
  thumbnailUrl?: string;
  imagePath?: string;
  thumbnailPath?: string;
  description?: string;
  isActive: boolean;
}

function toMillis(value: unknown): number {
  if (value && typeof value === "object" && "toMillis" in value) {
    return (value as { toMillis: () => number }).toMillis();
  }
  return typeof value === "number" ? value : Date.now();
}

function mapProduct(id: string, data: Record<string, unknown>): Product {
  return {
    id,
    companyId: (data.companyId as string) ?? "",
    companyName: (data.companyName as string) ?? "",
    name: (data.name as string) ?? "",
    sku: data.sku as string | undefined,
    price: (data.price as number) ?? 0,
    photoUrl: data.photoUrl as string | undefined,
    thumbnailUrl: data.thumbnailUrl as string | undefined,
    imagePath: data.imagePath as string | undefined,
    thumbnailPath: data.thumbnailPath as string | undefined,
    description: data.description as string | undefined,
    isActive: Boolean(data.isActive),
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
  };
}

// undefined талбаруудыг хасна (Firestore undefined хүлээж авдаггүй).
function buildDoc(input: ProductInput): Record<string, unknown> {
  const out: Record<string, unknown> = {
    companyId: input.companyId,
    companyName: input.companyName,
    name: input.name.trim(),
    price: input.price,
    isActive: input.isActive,
  };
  if (input.sku?.trim()) out.sku = input.sku.trim();
  if (input.description?.trim()) out.description = input.description.trim();
  // Зургийн талбаруудыг үргэлж бичнэ (устгах үед "" болгож цэвэрлэхэд).
  out.photoUrl = input.photoUrl?.trim() ?? "";
  out.thumbnailUrl = input.thumbnailUrl?.trim() ?? "";
  out.imagePath = input.imagePath?.trim() ?? "";
  out.thumbnailPath = input.thumbnailPath?.trim() ?? "";
  return out;
}

// Real-time жагсаалт (onSnapshot). Unsubscribe буцаана.
export function subscribeProducts(
  onData: (products: Product[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => mapProduct(d.id, d.data()))),
    (err) => onError?.(err),
  );
}

// Тодорхой байгууллагын БҮХ бараа (partner "Миний бараа" удирдлага — idэвхгүйг ч).
export function subscribeProductsByCompanyAll(
  companyId: string,
  onData: (products: Product[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const q = query(collection(db, COLLECTION), where("companyId", "==", companyId));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => mapProduct(d.id, d.data()));
      list.sort((a, b) => b.createdAt - a.createdAt);
      onData(list);
    },
    (err) => onError?.(err),
  );
}

// Тодорхой байгууллагын active бараанууд (захиалга үүсгэх dropdown).
export function subscribeProductsByCompany(
  companyId: string,
  onData: (products: Product[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const q = query(collection(db, COLLECTION), where("companyId", "==", companyId));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs
        .map((d) => mapProduct(d.id, d.data()))
        .filter((p) => p.isActive);
      list.sort((a, b) => b.createdAt - a.createdAt);
      onData(list);
    },
    (err) => onError?.(err),
  );
}

export async function addProduct(input: ProductInput): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTION), {
    ...buildDoc(input),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

// Урьдчилан id үүсгэх — Storage зам (products/{companyId}/{productId})-д хэрэгтэй.
export function generateProductId(): string {
  return doc(collection(db, COLLECTION)).id;
}

// Тодорхой id-тай бараа үүсгэх (зургийг эхэлж тэр id-аар upload хийсний дараа).
export async function createProductWithId(
  id: string,
  input: ProductInput,
): Promise<void> {
  await setDoc(doc(db, COLLECTION, id), {
    ...buildDoc(input),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateProduct(id: string, input: ProductInput): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    ...buildDoc(input),
    updatedAt: serverTimestamp(),
  });
}

// Идэвхтэй/идэвхгүй солих (delete хийхгүй).
export async function setProductActive(id: string, isActive: boolean): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    isActive,
    updatedAt: serverTimestamp(),
  });
}
