"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import BrandLogo from "@/components/BrandLogo";

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const NAV: NavItem[] = [
  { label: "Миний захиалгууд", href: "/partner/orders", icon: "📦" },
  { label: "Шинэ захиалга", href: "/partner/orders/new", icon: "➕" },
  { label: "Миний бараа", href: "/partner/products", icon: "🛒" },
  { label: "Тооцоо", href: "/partner/settlements", icon: "🧾" },
  { label: "Гүйцэтгэл", href: "/partner/kpi", icon: "📊" },
  { label: "Тайлан", href: "/partner/reports", icon: "📈" },
];

function isActive(pathname: string, href: string) {
  // "/partner/orders" нь "/partner/orders/new"-г идэвхтэй болгохгүй.
  if (href === "/partner/orders") return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

export default function PartnerSidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-navy text-white print:!hidden lg:flex">
        <div className="flex h-16 items-center border-b border-white/10 px-5">
          <BrandLogo tone="light" />
        </div>
        <nav className="space-y-1 px-3 py-4">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                isActive(pathname, item.href)
                  ? "bg-brand text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Mobile bottom navigation */}
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 flex border-t border-slate-200 bg-white print:hidden lg:hidden">
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] transition ${
                active ? "text-brand" : "text-slate-400"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
