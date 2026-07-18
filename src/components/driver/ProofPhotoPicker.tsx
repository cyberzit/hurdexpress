"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { validateImageFile } from "@/lib/imageUpload";

interface Props {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
  max?: number;
}

// Жолоочийн баталгаажуулах зураг сонгогч — олон зураг (камер/галерей), preview + устгах.
export default function ProofPhotoPicker({ files, onChange, disabled, max = 4 }: Props) {
  // Камер / галерей тус тусдаа input — камерынх `capture`-тай тул шууд камер нээнэ,
  // галерейнх атрибутгүй тул утасны зургийн сангаас сонгуулна.
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  // Preview URL-уудыг файл бүрт үүсгэж, unmount/солилт дээр цэвэрлэнэ.
  const urls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => {
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [urls]);

  function addFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    const incoming = Array.from(list);
    const valid: File[] = [];
    for (const f of incoming) {
      const err = validateImageFile(f);
      if (err) {
        setError(err);
        continue;
      }
      valid.push(f);
    }
    if (valid.length === 0) return;
    setError("");
    const merged = [...files, ...valid].slice(0, max);
    onChange(merged);
    // Хоёуланг нь цэвэрлэнэ — ижил файлыг дараалан сонгоход change эвент асахгүй байхаас сэргийлнэ.
    if (cameraRef.current) cameraRef.current.value = "";
    if (galleryRef.current) galleryRef.current.value = "";
  }

  function removeAt(i: number) {
    onChange(files.filter((_, idx) => idx !== i));
  }

  const canAdd = files.length < max && !disabled;

  return (
    <div>
      <input
        ref={cameraRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="hidden"
        disabled={disabled}
        onChange={(e) => addFiles(e.target.files)}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        disabled={disabled}
        onChange={(e) => addFiles(e.target.files)}
      />

      <div className={urls.length > 0 ? "mb-2 grid grid-cols-3 gap-2" : ""}>
        {urls.map((u, i) => (
          <div
            key={u}
            className="relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={u} alt={`Баталгаа ${i + 1}`} className="h-full w-full object-cover" />
            {!disabled && (
              <button
                type="button"
                onClick={() => removeAt(i)}
                aria-label="Устгах"
                className="absolute right-1 top-1 rounded-lg bg-red-500/90 px-1.5 py-0.5 text-xs font-medium text-white shadow"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {canAdd && (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-slate-600 transition hover:border-brand/50"
          >
            <span className="text-lg">📷</span>
            <span className="text-sm font-medium">Камер нээх</span>
          </button>
          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-slate-600 transition hover:border-brand/50"
          >
            <span className="text-lg">🖼️</span>
            <span className="text-sm font-medium">Галерей сонгох</span>
          </button>
        </div>
      )}

      <p className="mt-1.5 text-xs text-slate-400">
        {files.length}/{max} зураг
        {!canAdd && !disabled && " · дээд хязгаарт хүрсэн"}
      </p>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
