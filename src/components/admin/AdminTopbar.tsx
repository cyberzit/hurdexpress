"use client";

import { useRouter } from "next/navigation";
import NotificationBell from "@/components/notifications/NotificationBell";
import { useAuth } from "@/contexts/AuthContext";
import { logout } from "@/lib/firebase/auth";

export default function AdminTopbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { profile } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  const initials = (profile?.name?.trim()?.[0] ?? "A").toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 print:hidden sm:px-6">
      <div className="flex items-center gap-3">
        {/* Hamburger — зөвхөн mobile */}
        <button
          onClick={onMenuClick}
          aria-label="Цэс нээх"
          className="rounded-lg p-2 text-navy transition hover:bg-slate-100 lg:hidden"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.8}
            stroke="currentColor"
            className="h-6 w-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
        </button>
        <h1 className="text-base font-semibold text-navy">Админ удирдлага</h1>
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell tone="dark" />
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium leading-tight text-navy">
            {profile?.name ?? "Админ"}
          </p>
          <p className="text-xs text-slate-400">Админ</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-sm font-semibold text-white">
          {initials}
        </div>
        <button
          onClick={handleLogout}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-navy transition hover:bg-slate-50"
        >
          Гарах
        </button>
      </div>
    </header>
  );
}
