"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/lib/firebase/auth";

export default function DriverBottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  const ordersActive = pathname.startsWith("/driver/orders");
  const routeActive = pathname.startsWith("/driver/route");
  const settlementActive = pathname.startsWith("/driver/settlement");
  const kpiActive = pathname.startsWith("/driver/kpi");

  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-2xl border-t border-slate-200 bg-white">
      <Link
        href="/driver/orders"
        className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs transition ${
          ordersActive ? "text-brand" : "text-slate-400"
        }`}
      >
        <span className="text-lg">📦</span>
        <span>Захиалгууд</span>
      </Link>
      <Link
        href="/driver/route"
        className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs transition ${
          routeActive ? "text-brand" : "text-slate-400"
        }`}
      >
        <span className="text-lg">🗺️</span>
        <span>Маршрут</span>
      </Link>
      <Link
        href="/driver/settlement"
        className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs transition ${
          settlementActive ? "text-brand" : "text-slate-400"
        }`}
      >
        <span className="text-lg">🧾</span>
        <span>Тооцоо</span>
      </Link>
      <Link
        href="/driver/kpi"
        className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs transition ${
          kpiActive ? "text-brand" : "text-slate-400"
        }`}
      >
        <span className="text-lg">📊</span>
        <span>Гүйцэтгэл</span>
      </Link>
      <button
        onClick={handleLogout}
        className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs text-slate-400 transition hover:text-navy"
      >
        <span className="text-lg">🚪</span>
        <span>Гарах</span>
      </button>
    </nav>
  );
}
