"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: "📊" },
  { label: "Захиалгууд", href: "/admin/orders", icon: "📦" },
  { label: "Шинэ захиалга", href: "/admin/orders/new", icon: "➕" },
  { label: "Харилцагч байгууллага", href: "/admin/companies", icon: "🏢" },
  { label: "Бараа бүтээгдэхүүн", href: "/admin/products", icon: "🛒" },
  { label: "Жолооч нар", href: "/admin/drivers", icon: "🚚" },
  { label: "Байршил (live)", href: "/admin/live-map", icon: "🛰️" },
  { label: "Тооцоо / нэхэмжлэл", href: "/admin/settlements", icon: "🧾" },
  { label: "Тайлан", href: "/admin/reports", icon: "📈" },
  { label: "SMS лог", href: "/admin/sms-logs", icon: "✉️" },
  { label: "Тохиргоо", href: "/admin/settings", icon: "⚙️" },
];

export default function AdminSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      <div
        onClick={onClose}
        aria-hidden
        className={`fixed inset-0 z-30 bg-black/40 transition-opacity print:hidden lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Sidebar / drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-navy text-white transition-transform duration-200 print:hidden lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center gap-2.5 border-b border-white/10 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand font-bold text-white">
            HX
          </div>
          <span className="text-lg font-bold tracking-tight">
            Hurd<span className="text-brand">Express</span>
          </span>
        </div>

        <nav className="space-y-1 px-3 py-4">
          {NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                  active
                    ? "bg-brand text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
