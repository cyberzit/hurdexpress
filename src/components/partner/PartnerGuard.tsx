"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

function CenterScreen({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <div className="flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand font-bold text-white">
          HX
        </div>
        <span className="text-lg font-bold text-navy">
          Hurd<span className="text-brand">Express</span>
        </span>
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}

export default function PartnerGuard({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  const allowed =
    !!user && !!profile && profile.role === "partner" && profile.isActive !== false;

  useEffect(() => {
    if (!loading && !allowed) router.replace("/login");
  }, [loading, allowed, router]);

  if (loading) {
    return (
      <CenterScreen>
        <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-brand" />
        <p className="mt-3 text-sm text-slate-500">Уншиж байна…</p>
      </CenterScreen>
    );
  }

  if (!allowed) {
    return (
      <CenterScreen>
        <p className="text-sm text-slate-500">Чиглүүлж байна…</p>
      </CenterScreen>
    );
  }

  // role/идэвх зөв ч байгууллага холбогдоогүй бол алдаа.
  if (!profile?.companyId) {
    return (
      <CenterScreen>
        <p className="font-medium text-navy">Танд байгууллага холбогдоогүй байна</p>
        <p className="mt-1 text-sm text-slate-500">
          Системийн админд хандаж байгууллагаа холбуулна уу.
        </p>
      </CenterScreen>
    );
  }

  return <>{children}</>;
}
