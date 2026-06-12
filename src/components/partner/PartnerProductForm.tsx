"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { fieldClass } from "@/components/ui/Input";
import {
  createProductWithId,
  generateProductId,
  updateProduct,
  type ProductInput,
} from "@/lib/firebase/products";
import { deleteProductImage, uploadProductImage } from "@/lib/imageUpload";
import ImageUpload, { type ImageUploadState } from "@/components/ui/ImageUpload";
import type { Product } from "@/types";

interface Props {
  initial?: Product | null; // байвал засах горим
  companyId: string;
  companyName: string;
  onClose: () => void;
}

const labelClass = "text-sm font-medium text-slate-600";
const input = `mt-1.5 border-slate-200 focus:border-brand ${fieldClass}`;

export default function PartnerProductForm({
  initial,
  companyId,
  companyName,
  onClose,
}: Props) {
  const isEdit = Boolean(initial);
  const [name, setName] = useState(initial?.name ?? "");
  const [sku, setSku] = useState(initial?.sku ?? "");
  const [price, setPrice] = useState(initial ? String(initial.price) : "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [image, setImage] = useState<ImageUploadState>({ file: null, cleared: false });
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Барааны нэр заавал бөглөнө.");
    const priceNum = Number(price);
    if (!price.trim() || Number.isNaN(priceNum) || priceNum < 0) {
      return setError("Үнэ зөв тоо байх ёстой.");
    }

    // companyId/companyName нь partner-ийн өөрийнхөөс автоматаар.
    const base = { companyId, companyName, name, sku, price: priceNum, description, isActive };

    setBusy(true);
    try {
      const productId = isEdit && initial ? initial.id : generateProductId();

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
      if (isEdit && initial) {
        await updateProduct(initial.id, payload);
      } else {
        await createProductWithId(productId, payload);
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
    <Modal
      title={isEdit ? "Бараа засах" : "Шинэ бараа нэмэх"}
      subtitle={companyName}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5" noValidate>
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <div>
          <label className={labelClass}>Барааны нэр *</label>
          <input className={input} value={name} onChange={(e) => setName(e.target.value)} disabled={busy} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>SKU / код</label>
            <input className={input} value={sku} onChange={(e) => setSku(e.target.value)} disabled={busy} />
          </div>
          <div>
            <label className={labelClass}>Үнэ (₮) *</label>
            <input
              className={input}
              type="number"
              min={0}
              step={100}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={busy}
            />
          </div>
        </div>

        {/* Үлдэгдэл — зөвхөн read-only (admin л өөрчилнө) */}
        {isEdit && initial && (
          <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-center">
            <div>
              <p className="text-base font-bold text-navy">{initial.stockQty ?? 0}</p>
              <p className="text-xs text-slate-500">Нийт үлдэгдэл</p>
            </div>
            <div>
              <p className="text-base font-bold text-amber-600">{initial.reservedQty ?? 0}</p>
              <p className="text-xs text-slate-500">Түгжигдсэн</p>
            </div>
            <div>
              <p className="text-base font-bold text-green-600">{initial.availableQty ?? 0}</p>
              <p className="text-xs text-slate-500">Боломжит</p>
            </div>
          </div>
        )}

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
            className={`${input} min-h-20 resize-y`}
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

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="outline" fullWidth onClick={onClose} disabled={busy}>
            Болих
          </Button>
          <Button type="submit" fullWidth loading={busy}>
            {isEdit ? "Хадгалах" : "Нэмэх"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
