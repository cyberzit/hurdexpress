"use client";

import { useState, type ReactNode } from "react";
import AdminGuard from "@/components/admin/AdminGuard";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";
import FcmRegistrar from "@/components/FcmRegistrar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AdminGuard>
      <div className="min-h-screen bg-slate-50">
        <FcmRegistrar />
        <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Desktop дээр sidebar-ийн өргөнөөр зай авна */}
        <div className="lg:pl-64 print:pl-0">
          <AdminTopbar onMenuClick={() => setSidebarOpen(true)} />
          <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </AdminGuard>
  );
}
