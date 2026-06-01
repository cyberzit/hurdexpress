import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Офлайн — HurdExpress",
};

// Service worker нэмэгдсэн үед navigation fallback болгон ашиглаж болно.
export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <div className="flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand font-bold text-white">
          HX
        </div>
        <span className="text-lg font-bold text-navy">
          Hurd<span className="text-brand">Express</span>
        </span>
      </div>
      <p className="mt-6 text-4xl">📡</p>
      <h1 className="mt-3 text-xl font-bold text-navy">Холболт алга</h1>
      <p className="mt-1 max-w-xs text-sm text-slate-500">
        Интернет холболтоо шалгаад дахин оролдоно уу.
      </p>
    </main>
  );
}
