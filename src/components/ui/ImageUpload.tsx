"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { validateImageFile } from "@/lib/imageUpload";

export interface ImageUploadState {
  file: File | null; // шинээр сонгосон файл
  cleared: boolean; // одоо байгаа зургийг устгахаар тэмдэглэсэн эсэх
}

interface Props {
  existingUrl?: string; // хадгалагдсан зургийн URL (preview)
  onChange: (state: ImageUploadState) => void;
  disabled?: boolean;
  progress?: number | null; // 0..100 — upload явц
}

export default function ImageUpload({
  existingUrl,
  onChange,
  disabled,
  progress,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [cleared, setCleared] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  // Сонгосон файлын preview URL (memo — render бүрт дахин үүсгэхгүй).
  const objUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    return () => {
      if (objUrl) URL.revokeObjectURL(objUrl);
    };
  }, [objUrl]);

  const previewUrl = objUrl ?? (cleared ? null : existingUrl || null);

  function select(f: File | null) {
    if (!f) return;
    const err = validateImageFile(f);
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setFile(f);
    setCleared(false);
    onChange({ file: f, cleared: false });
  }

  function remove() {
    setFile(null);
    setCleared(true);
    setError("");
    onChange({ file: null, cleared: true });
    if (inputRef.current) inputRef.current.value = "";
  }

  const uploading = progress != null;

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        disabled={disabled}
        onChange={(e) => select(e.target.files?.[0] ?? null)}
      />

      {previewUrl ? (
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Барааны зураг"
            className="mx-auto max-h-48 w-full object-contain"
          />
          {!disabled && (
            <div className="absolute right-2 top-2 flex gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="rounded-lg bg-white/90 px-2.5 py-1 text-xs font-medium text-navy shadow transition hover:bg-white"
              >
                Солих
              </button>
              <button
                type="button"
                onClick={remove}
                className="rounded-lg bg-red-500/90 px-2.5 py-1 text-xs font-medium text-white shadow transition hover:bg-red-600"
              >
                Устгах
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            select(e.dataTransfer.files?.[0] ?? null);
          }}
          className={`flex w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-4 py-8 text-sm transition ${
            dragOver
              ? "border-brand bg-brand/5 text-brand"
              : "border-slate-300 bg-slate-50 text-slate-500 hover:border-brand/50"
          }`}
        >
          <span className="text-2xl">🖼️</span>
          <span className="font-medium">Зураг сонгох эсвэл чирж оруулах</span>
          <span className="text-xs text-slate-400">JPEG, PNG, WebP · 15MB хүртэл</span>
        </button>
      )}

      {/* Upload progress */}
      {uploading && (
        <div className="mt-2">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-brand transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-slate-400">Хуулж байна… {progress}%</p>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
