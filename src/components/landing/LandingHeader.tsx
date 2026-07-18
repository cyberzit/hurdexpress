"use client";

import { useEffect, useState } from "react";
import BrandLogo from "@/components/BrandLogo";
import { usePublicInfo } from "@/components/landing/usePublicInfo";

const NAV = [
  { href: "#home", label: "Нүүр" },
  { href: "#services", label: "Үйлчилгээ" },
  { href: "#why", label: "Давуу тал" },
  { href: "#cooperation", label: "Хамтрах" },
  { href: "#track", label: "Хүргэлт шалгах" },
];

export default function LandingHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { brochureUrl } = usePublicInfo();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b transition ${
        scrolled
          ? "border-slate-200 bg-white/90 backdrop-blur shadow-sm"
          : "border-transparent bg-white/70 backdrop-blur"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <a href="#home" aria-label="Нүүр">
          <BrandLogo tone="dark" />
        </a>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-navy"
            >
              {n.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {brochureUrl && (
            <a
              href={brochureUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-navy transition hover:bg-slate-50 md:inline-block"
            >
              ⬇ Танилцуулга татах
            </a>
          )}
          <a
            href="#login"
            className="hidden rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-navy-light sm:inline-block"
          >
            Нэвтрэх
          </a>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Цэс"
            aria-expanded={open}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-navy transition hover:bg-slate-50 lg:hidden"
          >
            <span className="text-lg">{open ? "✕" : "☰"}</span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 lg:hidden">
          <nav className="flex flex-col gap-1">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                {n.label}
              </a>
            ))}
            {brochureUrl && (
              <a
                href={brochureUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                ⬇ Танилцуулга татах
              </a>
            )}
            <a
              href="#login"
              onClick={() => setOpen(false)}
              className="mt-1 rounded-xl bg-navy px-3 py-2.5 text-center text-sm font-semibold text-white"
            >
              Нэвтрэх
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
