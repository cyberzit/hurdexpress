"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import type { StaffRole } from "@/types";

function Centered({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-center text-sm text-slate-500">
      <p>{children}</p>
    </main>
  );
}

// Зөвшөөрөгдсөн role-той хэрэглэгчид л children-г харна. Бусад тохиолдолд
// нэвтрэх рүү чиглүүлэх эсвэл тохирох мессеж харуулна.
export default function RoleGuard({
  allow,
  children,
}: {
  allow: StaffRole[];
  children: ReactNode;
}) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading) return <Centered>Уншиж байна…</Centered>;
  if (!user) return null;
  if (!profile) return <Centered>Хэрэглэгчийн профайл олдсонгүй. Админд хандана уу.</Centered>;
  if (profile.isActive === false) return <Centered>Таны эрх идэвхгүй байна.</Centered>;
  if (!allow.includes(profile.role)) {
    return <Centered>Энэ хэсэгт хандах эрхгүй байна.</Centered>;
  }

  return <>{children}</>;
}
