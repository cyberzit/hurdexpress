import type { Metadata } from "next";
import LoginHeader from "@/components/login/LoginHeader";
import AboutCard from "@/components/login/AboutCard";
import TrackingSearch from "@/components/tracking/TrackingSearch";
import LoginCard from "@/components/login/LoginCard";
import PWAInstallHint from "@/components/PWAInstallHint";

export const metadata: Metadata = {
  title: "Нэвтрэх — HurdExpress",
  description: "Хүргэлтийн төлөв шалгах болон харилцагчийн нэвтрэх хэсэг",
};

export default function LoginPage() {
  return (
    <div className="relative min-h-screen bg-slate-50 text-navy">
      {/* Бүдэг grid pattern background */}
      <div className="bg-grid pointer-events-none absolute inset-0" aria-hidden />

      {/* Контент grid-ийн дээр */}
      <div className="relative flex min-h-screen flex-col">
        <LoginHeader />

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
          {/* PWA суулгах hint (зөвхөн суулгаагүй үед харагдана) */}
          <div className="mb-6">
            <PWAInstallHint />
          </div>

          <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
            {/* Зүүн багана */}
            <AboutCard />

            {/* Баруун багана — mobile дээр доош нь stack болно */}
            <div className="space-y-6">
              <TrackingSearch />
              <LoginCard />
            </div>
          </div>
        </main>

        <footer className="border-t border-slate-200 bg-white/60 py-5 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} HurdExpress · Хурдан, найдвартай хүргэлт
        </footer>
      </div>
    </div>
  );
}
