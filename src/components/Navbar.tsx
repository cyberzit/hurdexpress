"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { logout } from "@/lib/firebase/auth";

export default function Navbar() {
  const { user, loading } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <header className="border-b border-black/10 dark:border-white/10">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight">
          Hurd<span className="text-orange-500">Express</span>
        </Link>

        <div className="flex items-center gap-4 text-sm">
          <Link href="/track" className="hover:underline">
            Хайх
          </Link>

          {loading ? null : user ? (
            <>
              <Link href="/dashboard" className="hover:underline">
                Хяналтын самбар
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-md bg-black px-3 py-1.5 text-white hover:bg-black/80 dark:bg-white dark:text-black"
              >
                Гарах
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-md bg-orange-500 px-3 py-1.5 text-white hover:bg-orange-600"
            >
              Нэвтрэх
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
