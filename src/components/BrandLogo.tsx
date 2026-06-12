"use client";

import { useEffect, useState } from "react";
import { getSettings } from "@/lib/settings";

// Брэндийн лого — settings.logoUrl байвал зургийг, эс бол HX + нэр fallback.
// tone: "light" = бараан (navy) дэвсгэр дээр, "dark" = цайвар дэвсгэр дээр.
export default function BrandLogo({
  tone = "dark",
  className = "",
}: {
  tone?: "light" | "dark";
  className?: string;
}) {
  const [logoUrl, setLogoUrl] = useState("");
  const [brand, setBrand] = useState("HurdExpress");

  useEffect(() => {
    getSettings()
      .then((s) => {
        if (s?.logoUrl?.trim()) setLogoUrl(s.logoUrl);
        if (s?.brandName?.trim()) setBrand(s.brandName);
      })
      .catch(() => {});
  }, []);

  const nameColor = tone === "light" ? "text-white" : "text-navy";

  // Upload хийсэн лого + хажууд нь брэнд нэр.
  if (logoUrl) {
    return (
      <span className={`flex items-center gap-2.5 ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          alt={brand}
          className={`h-9 w-auto rounded-lg object-contain ${
            tone === "light" ? "bg-white p-1" : ""
          }`}
        />
        <span className={`text-lg font-bold tracking-tight ${nameColor}`}>{brand}</span>
      </span>
    );
  }

  // Fallback — анхдагч HX тэмдэг + нэр.
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand font-bold text-white">
        HX
      </span>
      <span className={`text-lg font-bold tracking-tight ${nameColor}`}>
        Hurd<span className="text-brand">Express</span>
      </span>
    </span>
  );
}
