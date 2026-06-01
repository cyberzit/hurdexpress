"use client";

import { type ReactNode } from "react";
import DriverGuard from "@/components/driver/DriverGuard";
import DriverBottomNav from "@/components/driver/DriverBottomNav";
import NotificationBell from "@/components/notifications/NotificationBell";
import FcmRegistrar from "@/components/FcmRegistrar";
import { useAuth } from "@/contexts/AuthContext";

export default function DriverLayout({ children }: { children: ReactNode }) {
  const { profile } = useAuth();

  return (
    <DriverGuard>
      <div className="min-h-screen bg-slate-50">
        <FcmRegistrar />
        {/* Navy header */}
        <header className="pt-safe sticky top-0 z-20 bg-navy px-4 py-3 text-white">
          <div className="mx-auto flex max-w-2xl items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-bold">
                HX
              </div>
              <div>
                <p className="text-sm font-bold leading-tight">Жолоочийн самбар</p>
                <p className="text-xs text-white/70">{profile?.name}</p>
              </div>
            </div>
            <NotificationBell tone="light" />
          </div>
        </header>

        <main className="mx-auto max-w-2xl px-4 py-5 pb-24">{children}</main>

        <DriverBottomNav />
      </div>
    </DriverGuard>
  );
}
