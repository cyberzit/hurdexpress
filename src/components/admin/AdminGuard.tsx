"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

function LoadingScreen({ label = "Уншиж байна…" }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50">
      <div className="flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand font-bold text-white">
          HX
        </div>
        <span className="text-lg font-bold text-navy">
          Hurd<span className="text-brand">Express</span>
        </span>
      </div>
      <div className="mt-6 h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-brand" />
      <p className="mt-3 text-sm text-slate-500">{label}</p>
    </div>
  );
}

// Firebase auth + users/{uid} role шалгаж, зөвхөн идэвхтэй admin-г оруулна.
export default function AdminGuard({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  const authorized =
    !!user && !!profile && profile.role === "admin" && profile.isActive !== false;

  useEffect(() => {
    if (loading) return;
    if (!authorized) router.replace("/login");
  }, [loading, authorized, router]);

  if (loading) return <LoadingScreen />;
  if (!authorized) return <LoadingScreen label="Чиглүүлж байна…" />;

  return <>{children}</>;
}
