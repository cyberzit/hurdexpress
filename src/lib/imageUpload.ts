// Барааны зураг — client дээр resize/compress → WebP → Firebase Storage upload.
// Эх (том) зургийг хадгалахгүй; зөвхөн шахсан webp + thumbnail хадгална.

import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
  uploadBytesResumable,
} from "firebase/storage";
import { storage } from "@/lib/firebase";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_ORIGINAL_BYTES = 15 * 1024 * 1024; // 15MB

// Оруулсан файлыг шалгах. Алдаатай бол монгол мессеж, зөв бол null.
export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Зөвхөн JPEG, PNG, WebP зураг оруулна уу.";
  }
  if (file.size > MAX_ORIGINAL_BYTES) {
    return "Зургийн хэмжээ 15MB-аас ихгүй байх ёстой.";
  }
  return null;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Зураг уншиж чадсангүй."));
    };
    img.src = url;
  });
}

// Хэмжээг maxW×maxH дотор багтаана (томруулахгүй).
function fitWithin(w: number, h: number, maxW: number, maxH: number) {
  const ratio = Math.min(maxW / w, maxH / h, 1);
  return { width: Math.round(w * ratio), height: Math.round(h * ratio) };
}

/**
 * Зургийг canvas-аар жижигрүүлж WebP болгоно.
 */
export async function resizeImageToWebP(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality: number,
  fileName: string,
): Promise<File> {
  const img = await loadImage(file);
  const { width, height } = fitWithin(img.width, img.height, maxWidth, maxHeight);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Энэ browser зураг боловсруулахыг дэмжихгүй байна.");
  ctx.drawImage(img, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", quality),
  );
  if (!blob) throw new Error("Зураг хөрвүүлэхэд алдаа гарлаа.");
  return new File([blob], fileName, { type: "image/webp" });
}

export interface UploadedImage {
  photoUrl: string;
  thumbnailUrl: string;
  imagePath: string;
  thumbnailPath: string;
}

/**
 * Барааны зургийг шахаж (webp) + thumbnail үүсгэн Storage-д байрлуулна.
 * Зам: products/{companyId}/{productId}/main.webp · thumb.webp (давхар бичих = replace).
 */
export async function uploadProductImage(
  companyId: string,
  productId: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<UploadedImage> {
  const validationError = validateImageFile(file);
  if (validationError) throw new Error(validationError);

  const ts = Date.now();
  const main = await resizeImageToWebP(file, 800, 800, 0.75, `product_${ts}.webp`);
  const thumb = await resizeImageToWebP(file, 250, 250, 0.7, `productThumb_${ts}.webp`);

  const base = `products/${companyId}/${productId}`;
  const imagePath = `${base}/main.webp`;
  const thumbnailPath = `${base}/thumb.webp`;

  // Thumbnail (жижиг) — шууд.
  await uploadBytes(ref(storage, thumbnailPath), thumb, { contentType: "image/webp" });

  // Үндсэн зураг — resumable (progress харуулна).
  const task = uploadBytesResumable(ref(storage, imagePath), main, {
    contentType: "image/webp",
  });
  await new Promise<void>((resolve, reject) => {
    task.on(
      "state_changed",
      (snap) => onProgress?.(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      reject,
      () => resolve(),
    );
  });

  const [photoUrl, thumbnailUrl] = await Promise.all([
    getDownloadURL(ref(storage, imagePath)),
    getDownloadURL(ref(storage, thumbnailPath)),
  ]);

  return { photoUrl, thumbnailUrl, imagePath, thumbnailPath };
}

/**
 * Брэндийн лого — webp болгож шахаад branding/logo.webp-д байрлуулна (replace).
 * Download URL буцаана (settings.logoUrl-д хадгална).
 */
export async function uploadLogo(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const validationError = validateImageFile(file);
  if (validationError) throw new Error(validationError);

  const ts = Date.now();
  const webp = await resizeImageToWebP(file, 512, 512, 0.85, `logo_${ts}.webp`);
  const path = "branding/logo.webp";

  const task = uploadBytesResumable(ref(storage, path), webp, {
    contentType: "image/webp",
  });
  await new Promise<void>((resolve, reject) => {
    task.on(
      "state_changed",
      (snap) => onProgress?.(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      reject,
      () => resolve(),
    );
  });
  return getDownloadURL(ref(storage, path));
}

export interface UploadedProof {
  imageUrl: string;
  imagePath: string;
}

/**
 * Хүргэлт / амжилтгүйн баталгаажуулах зураг — webp (max 1200px, q0.8) болгож,
 * delivery-proofs/{orderId}/{timestamp}.webp (эсвэл failed-proofs/…) зам руу байрлуулна.
 * Download URL + Storage зам буцаана (Firestore-д хадгална).
 */
export async function uploadDeliveryProof(
  orderId: string,
  file: File,
  kind: "delivery" | "failed" = "delivery",
  onProgress?: (percent: number) => void,
): Promise<UploadedProof> {
  const validationError = validateImageFile(file);
  if (validationError) throw new Error(validationError);

  const ts = Date.now();
  const webp = await resizeImageToWebP(file, 1200, 1200, 0.8, `proof_${ts}.webp`);
  const folder = kind === "failed" ? "failed-proofs" : "delivery-proofs";
  const imagePath = `${folder}/${orderId}/${ts}.webp`;

  const task = uploadBytesResumable(ref(storage, imagePath), webp, {
    contentType: "image/webp",
  });
  await new Promise<void>((resolve, reject) => {
    task.on(
      "state_changed",
      (snap) => onProgress?.(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      reject,
      () => resolve(),
    );
  });

  const imageUrl = await getDownloadURL(ref(storage, imagePath));
  return { imageUrl, imagePath };
}

export interface UploadedBrochure {
  url: string;
  name: string;
  path: string;
}

const BROCHURE_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const MAX_BROCHURE_BYTES = 20 * 1024 * 1024; // 20MB

export function validateBrochureFile(file: File): string | null {
  if (!BROCHURE_TYPES.includes(file.type)) {
    return "Зөвхөн PDF эсвэл зураг (JPEG, PNG, WebP) оруулна уу.";
  }
  if (file.size > MAX_BROCHURE_BYTES) {
    return "Файлын хэмжээ 20MB-аас ихгүй байх ёстой.";
  }
  return null;
}

/**
 * Танилцуулга (brochure) — PDF/зургийг хэвээр нь (шахалтгүй) Storage-д байрлуулна.
 * Зам: branding/brochure_{ts}.{ext}. URL + файлын нэр буцаана (settings-д хадгална).
 */
export async function uploadBrochure(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<UploadedBrochure> {
  const validationError = validateBrochureFile(file);
  if (validationError) throw new Error(validationError);

  const ts = Date.now();
  const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
  const path = `branding/brochure_${ts}.${ext}`;

  const task = uploadBytesResumable(ref(storage, path), file, {
    contentType: file.type,
  });
  await new Promise<void>((resolve, reject) => {
    task.on(
      "state_changed",
      (snap) => onProgress?.(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      reject,
      () => resolve(),
    );
  });

  const url = await getDownloadURL(ref(storage, path));
  return { url, name: file.name, path };
}

// Storage дахь зургуудыг устгана (байхгүй бол алгасна).
export async function deleteProductImage(paths: {
  imagePath?: string;
  thumbnailPath?: string;
}): Promise<void> {
  const targets = [paths.imagePath, paths.thumbnailPath].filter(Boolean) as string[];
  await Promise.all(
    targets.map((p) => deleteObject(ref(storage, p)).catch(() => {})),
  );
}
