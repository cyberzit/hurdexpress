"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Нүүр хуудас → нэвтрэх/tracking хуудас руу чиглүүлнэ.
// (Static export — server redirect() ажиллахгүй тул client-side хийнэ.)
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
      <span className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-brand" />
      Ачааллаж байна…
    </div>
  );
}
