"use client";

import { useEffect, useState } from "react";

// beforeinstallprompt нь TS DOM lib-д байхгүй тул хамгийн бага interface.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallHint() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [hint, setHint] = useState<{ show: boolean; isIOS: boolean }>({
    show: false,
    isIOS: false,
  });
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Аль хэдийн суусан (standalone) бол hint хэрэггүй.
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) return;

    const ua = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua);

    // iOS дээр beforeinstallprompt байхгүй — заавартай шууд харуулна.
    // (Mount дээрх нэг удаагийн платформ шалгалт — hydration-safe.)
    if (ios) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHint({ show: true, isIOS: true });
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setHint({ show: true, isIOS: false });
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const { show, isIOS } = hint;
  if (!show || dismissed) return null;

  async function handleInstall() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setDismissed(true);
  }

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-brand/30 bg-brand/5 px-4 py-3">
      <span className="text-xl">📲</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-navy">
          Утас дээрээ app шиг ашиглах боломжтой
        </p>
        {isIOS ? (
          <p className="mt-0.5 text-xs text-slate-600">
            Safari дээр <span className="font-medium">Share (⬆️)</span> →{" "}
            <span className="font-medium">«Нүүр дэлгэцэнд нэмэх»</span> сонгоно уу.
          </p>
        ) : (
          <p className="mt-0.5 text-xs text-slate-600">
            Доорх товчоор эсвэл хөтчийн цэснээс «Нүүр дэлгэцэнд нэмэх».
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {deferred && (
          <button
            onClick={handleInstall}
            className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-dark"
          >
            Суулгах
          </button>
        )}
        <button
          onClick={() => setDismissed(true)}
          aria-label="Хаах"
          className="rounded-lg p-1 text-slate-400 transition hover:bg-black/5 hover:text-navy"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
