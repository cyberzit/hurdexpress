"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function TrackForm() {
  const [value, setValue] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed) router.push(`/track?n=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Tracking дугаар (жишээ: HX-2026-123456)"
        className="flex-1 rounded-md border border-black/15 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-orange-500 dark:border-white/15"
      />
      <button
        type="submit"
        className="rounded-md bg-orange-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-600"
      >
        Хайх
      </button>
    </form>
  );
}
