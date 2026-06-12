"use client";

import { type ReactNode } from "react";
import { useRouter } from "next/navigation";
import PartnerGuard from "@/components/partner/PartnerGuard";
import PartnerSidebar from "@/components/partner/PartnerSidebar";
import BrandLogo from "@/components/BrandLogo";
import NotificationBell from "@/components/notifications/NotificationBell";
import FcmRegistrar from "@/components/FcmRegistrar";
import { useAuth } from "@/contexts/AuthContext";
import { logout } from "@/lib/firebase/auth";

export default function PartnerLayout({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <PartnerGuard>
      <div className="min-h-screen bg-slate-50">
        <FcmRegistrar />
        <PartnerSidebar />

        <div className="lg:pl-60 print:pl-0">
          {/* Navy header */}
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 bg-navy px-4 text-white print:hidden sm:px-6">
            <div className="lg:hidden">
              <BrandLogo tone="light" />
            </div>
            <div className="hidden lg:block">
              <p className="text-sm font-semibold">Харилцагчийн самбар</p>
            </div>

            <div className="flex items-center gap-3">
              <NotificationBell tone="light" />
              <span className="hidden text-sm text-white/80 sm:block">
                {profile?.name}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-white/20 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Гарах
              </button>
            </div>
          </header>

          {/* Mobile дээр bottom nav-д зориулж доор зай үлдээнэ */}
          <main className="mx-auto max-w-3xl px-4 py-6 pb-24 sm:px-6 lg:pb-8">
            {children}
          </main>
        </div>
      </div>
    </PartnerGuard>
  );
}
