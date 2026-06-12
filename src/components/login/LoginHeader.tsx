import BrandLogo from "@/components/BrandLogo";

export default function LoginHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Зүүн тал — лого */}
        <BrandLogo tone="dark" />

        {/* Дунд — хувилбар (зөвхөн дэлгэц өргөн үед) */}
        <span className="hidden rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500 md:inline-block">
          Хувилбар: v1.0.0
        </span>

        {/* Баруун тал — товчнууд */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-navy transition hover:bg-slate-50 sm:text-sm"
          >
            Танилцуулга татах
          </button>
          <button
            type="button"
            className="rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-dark sm:text-sm"
          >
            Шинэ харилцагч
          </button>
        </div>
      </div>
    </header>
  );
}
