"use client";

import { useState } from "react";
import {
  createProductWithId,
  generateProductId,
  updateProduct,
  type ProductInput,
} from "@/lib/firebase/products";
import { deleteProductImage, uploadProductImage } from "@/lib/imageUpload";
import { setLowStockAlert } from "@/lib/firebase/inventory";
import ImageUpload, { type ImageUploadState } from "@/components/ui/ImageUpload";
import type { Company, Product } from "@/types";

interface Props {
  initial?: Product | null; // байвал засах горим
  companies: Company[]; // сонгох боломжтой (active) байгууллагууд
  onClose: () => void;
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-navy outline-none transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20";

const labelClass = "text-sm font-medium text-slate-600";

export default function ProductForm({ initial, companies, onClose }: Props) {
  const isEdit = Boolean(initial);

  const [companyId, setCompanyId] = useState(initial?.companyId ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [price, setPrice] = useState(initial ? String(initial.price) : "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [image, setImage] = useState<ImageUploadState>({ file: null, cleared: false });
  const [progress, setProgress] = useState<number | null>(null);
  // Үлдэгдэл: шинээр үүсгэх үед эхний тоо; босго хоёр горимд засна.
  const [initialStock, setInitialStock] = useState("0");
  const [lowStockAlert, setLowStockAlertQty] = useState(
    initial ? String(initial.lowStockAlertQty ?? 0) : "0",
  );

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Засаж буй барааны байгууллага идэвхгүй болж жагсаалтад үгүй бол түүнийг нэмж харуулна.
  const options = [...companies];
  if (initial && !options.some((c) => c.id === initial.companyId)) {
    options.unshift({
      ...({} as Company),
      id: initial.companyId,
      name: initial.companyName,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!companyId) return setError("Харилцагч байгууллага сонгоно уу.");
    if (!name.trim()) return setError("Барааны нэр заавал бөглөнө.");
    const priceNum = Number(price);
    if (!price.trim() || Number.isNaN(priceNum) || priceNum < 0) {
      return setError("Үнэ зөв тоо байх ёстой.");
    }

    const companyName =
      options.find((c) => c.id === companyId)?.name ?? initial?.companyName ?? "";

    const base = {
      companyId,
      companyName,
      name,
      price: priceNum,
      description,
      isActive,
    };

    setBusy(true);
    try {
      const productId = isEdit && initial ? initial.id : generateProductId();

      // Зургийг шийдвэрлэх: шинэ upload / устгах / хэвээр.
      let img = {
        photoUrl: initial?.photoUrl ?? "",
        thumbnailUrl: initial?.thumbnailUrl ?? "",
        imagePath: initial?.imagePath ?? "",
        thumbnailPath: initial?.thumbnailPath ?? "",
      };
      if (image.file) {
        setProgress(0);
        img = await uploadProductImage(companyId, productId, image.file, setProgress);
      } else if (image.cleared) {
        if (initial?.imagePath) {
          await deleteProductImage({
            imagePath: initial.imagePath,
            thumbnailPath: initial.thumbnailPath,
          });
        }
        img = { photoUrl: "", thumbnailUrl: "", imagePath: "", thumbnailPath: "" };
      }

      const payload: ProductInput = { ...base, ...img };
      const alertQty = Math.max(0, Number(lowStockAlert) || 0);
      if (isEdit && initial) {
        await updateProduct(initial.id, payload);
        // Босго өөрчлөгдсөн бол шинэчилнэ (stockQty-г энд хөндөхгүй — adjust modal-аар).
        if (alertQty !== (initial.lowStockAlertQty ?? 0)) {
          await setLowStockAlert(initial.id, alertQty);
        }
      } else {
        await createProductWithId(productId, payload, {
          stockQty: Math.max(0, Number(initialStock) || 0),
          lowStockAlertQty: alertQty,
        });
      }
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Хадгалахад алдаа гарлаа. Дахин оролдоно уу.",
      );
      setProgress(null);
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-navy">
            {isEdit ? "Бараа засах" : "Шинэ бараа нэмэх"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Хаах"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-navy"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5" noValidate>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <div>
            <label className={labelClass}>Харилцагч байгууллага *</label>
            <select
              className={inputClass}
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              disabled={busy}
            >
              <option value="">— Сонгох —</option>
              {options.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Барааны нэр *</label>
            <input
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={busy}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Үнэ (₮) *</label>
              <input
                className={inputClass}
                type="number"
                min={0}
                step={100}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={busy}
              />
            </div>
          </div>

          {/* Агуулахын үлдэгдэл */}
          <div className="grid gap-4 sm:grid-cols-2">
            {isEdit ? (
              <div className="rounded-xl bg-slate-50 px-4 py-2.5">
                <p className="text-xs text-slate-500">Одоогийн үлдэгдэл</p>
                <p className="text-sm font-semibold text-navy">
                  {initial?.stockQty ?? 0} ш{" "}
                  <span className="font-normal text-slate-400">
                    (боломжит {initial?.availableQty ?? 0}, түгжсэн{" "}
                    {initial?.reservedQty ?? 0})
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  Үлдэгдэл өөрчлөхдөө «Үлдэгдэл» товчоор тохируулна.
                </p>
              </div>
            ) : (
              <div>
                <label className={labelClass}>Эхний үлдэгдэл (ш)</label>
                <input
                  className={inputClass}
                  type="number"
                  min={0}
                  value={initialStock}
                  onChange={(e) => setInitialStock(e.target.value)}
                  disabled={busy}
                />
              </div>
            )}
            <div>
              <label className={labelClass}>Бага үлдэгдлийн анхааруулга (ш)</label>
              <input
                className={inputClass}
                type="number"
                min={0}
                value={lowStockAlert}
                onChange={(e) => setLowStockAlertQty(e.target.value)}
                disabled={busy}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Барааны зураг</label>
            <div className="mt-1.5">
              <ImageUpload
                existingUrl={initial?.photoUrl}
                onChange={setImage}
                disabled={busy}
                progress={progress}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Тайлбар</label>
            <textarea
              className={`${inputClass} min-h-20 resize-y`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={busy}
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              disabled={busy}
              className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/30"
            />
            <span className="text-sm text-navy">Идэвхтэй</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-navy transition hover:bg-slate-50 disabled:opacity-60"
            >
              Болих
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex-1 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-60"
            >
              {busy ? "Хадгалж байна…" : isEdit ? "Хадгалах" : "Нэмэх"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
