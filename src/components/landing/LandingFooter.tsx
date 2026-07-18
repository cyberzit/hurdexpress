"use client";

import BrandLogo from "@/components/BrandLogo";
import { usePublicInfo } from "@/components/landing/usePublicInfo";

export default function LandingFooter() {
  const { phone, secondaryPhone, email, address, facebookUrl, brochureUrl } = usePublicInfo();

  return (
    <footer className="bg-navy text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <BrandLogo tone="light" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">
              HurdExpress — онлайн дэлгүүр болон бизнес байгууллагуудыг хэрэглэгчтэй нь
              хурдан, найдвартай холбодог хүргэлтийн цогц шийдэл.
            </p>
            {brochureUrl && (
              <a
                href={brochureUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
              >
                ⬇ Танилцуулга татах
              </a>
            )}
          </div>

          {/* Холбоо барих */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-white/80">
              Холбоо барих
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-white/70">
              <li>
                <a href={`tel:${phone}`} className="flex items-center gap-2 transition hover:text-brand">
                  <span>📞</span> {phone}
                  {secondaryPhone ? `, ${secondaryPhone}` : ""}
                </a>
              </li>
              {email && (
                <li>
                  <a
                    href={`mailto:${email}`}
                    className="flex items-center gap-2 break-all transition hover:text-brand"
                  >
                    <span>✉️</span> {email}
                  </a>
                </li>
              )}
              {facebookUrl && (
                <li>
                  <a
                    href={facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 transition hover:text-brand"
                  >
                    <span>📘</span> Facebook хуудас
                  </a>
                </li>
              )}
              {address && (
                <li className="flex items-start gap-2">
                  <span>📍</span> {address}
                </li>
              )}
            </ul>
          </div>

          {/* Холбоосууд */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-white/80">Холбоос</h3>
            <ul className="mt-4 space-y-3 text-sm text-white/70">
              <li>
                <a href="#services" className="transition hover:text-brand">
                  Үйлчилгээ
                </a>
              </li>
              <li>
                <a href="#why" className="transition hover:text-brand">
                  Давуу тал
                </a>
              </li>
              <li>
                <a href="#cooperation" className="transition hover:text-brand">
                  Хамтрах
                </a>
              </li>
              <li>
                <a href="#track" className="transition hover:text-brand">
                  Хүргэлт шалгах
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-white/50">
          © 2026 HurdExpress · Хурдан, найдвартай хүргэлт
        </div>
      </div>
    </footer>
  );
}
