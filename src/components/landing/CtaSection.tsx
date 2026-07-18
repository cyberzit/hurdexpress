"use client";

import { usePublicInfo } from "@/components/landing/usePublicInfo";

export default function CtaSection() {
  const { phone } = usePublicInfo();
  return (
    <section className="bg-slate-50 px-4 py-16 sm:px-6 sm:py-20">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-gradient-to-br from-navy via-navy-light to-navy px-6 py-14 text-center shadow-xl sm:px-12">
        <div className="bg-grid-light pointer-events-none absolute inset-0 opacity-40" aria-hidden />
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand/25 blur-3xl"
          aria-hidden
        />

        <div className="relative">
          <h2 className="mx-auto max-w-2xl text-2xl font-extrabold leading-tight text-white sm:text-3xl lg:text-4xl">
            Өнөөдрөөс хүргэлтээ илүү хялбар удирдаарай
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/70">
            HurdExpress-тэй хамтран бизнесээ өсгөж, хэрэглэгчдээ цаг хугацаанд нь
            найдвартай хүргэцгээе.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#login"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-dark"
            >
              Шинэ харилцагч болох
            </a>
            <a
              href={`tel:${phone}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              📞 {phone}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
