"use client";

import { useEffect, useState } from "react";

// Барааны зураг — дарвал бүтэн дэлгэцээр томроно.
// URL нь захиалганд хуулагдсан (order.productImageUrl) тул жолооч ч харна.
export default function ProductImageViewer({
  url,
  alt,
  small = false,
}: {
  url: string;
  alt: string;
  // small — барааны жагсаалтын мөрөнд багтах жижиг хувилбар.
  small?: boolean;
}) {
  const [open, setOpen] = useState(false);

  // Нээлттэй үед Esc-ээр хаах + арын хуудсыг гүйлгэхгүй байх.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Барааны зургийг томруулах"
        className={`group relative block shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 ${
          small ? "h-10 w-10" : "h-20 w-20 rounded-xl"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={alt}
          className="h-full w-full object-cover transition group-hover:scale-105"
        />
        {!small && (
          <span className="absolute inset-x-0 bottom-0 bg-black/45 py-0.5 text-center text-[10px] font-medium text-white">
            🔍 томруулах
          </span>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={alt}
        >
          <div className="relative max-h-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={alt}
              className="max-h-[85vh] w-auto rounded-xl object-contain shadow-2xl"
            />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Хаах"
              className="absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg font-bold text-navy shadow-lg transition hover:bg-slate-100"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
