"use client";

import { usePublicInfo } from "@/components/landing/usePublicInfo";

// Танилцуулга татах хэсэг — admin-аас upload хийсэн brochure байвал л харагдана.
export default function BrochureSection() {
  const { brochureUrl, brochureName } = usePublicInfo();
  if (!brochureUrl) return null;

  return (
    <section className="bg-white px-4 py-12 sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-5 rounded-3xl border border-slate-200 bg-slate-50 px-6 py-8 text-center shadow-sm sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-3xl">
            📄
          </span>
          <div>
            <h3 className="text-lg font-bold text-navy">Манай танилцуулга</h3>
            <p className="mt-1 text-sm text-slate-500">
              Үйлчилгээ, үнэ, хамтын ажиллагааны нөхцөлийг дэлгэрэнгүй танилцуулга-аас үзнэ үү.
            </p>
          </div>
        </div>
        <a
          href={brochureUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-dark"
        >
          ⬇ {brochureName || "Танилцуулга татах"}
        </a>
      </div>
    </section>
  );
}
