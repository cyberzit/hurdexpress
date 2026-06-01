"use client";

import { useEffect, useMemo, useState } from "react";
import NotificationDropdown from "@/components/notifications/NotificationDropdown";
import { useAuth } from "@/contexts/AuthContext";
import {
  markAllRead,
  markNotificationRead,
  subscribeNotifications,
} from "@/lib/firebase/activity";
import type { AppNotification } from "@/types";

export default function NotificationBell({
  tone = "dark",
}: {
  tone?: "light" | "dark";
}) {
  const { profile } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);

  // Production rules: хэрэглэгч зөвхөн өөрийн userId-тай мэдэгдэл уншина.
  // (Admin-д fan-out мэдэгдэл хэрэгтэй бол Cloud Function ашиглана — SECURITY.md.)
  const audience = useMemo(() => {
    return profile?.uid ? [profile.uid] : [];
  }, [profile]);

  const audienceKey = audience.join(",");

  useEffect(() => {
    if (audience.length === 0) return;
    const unsub = subscribeNotifications(audience, setItems, () => {});
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audienceKey]);

  const unread = items.filter((n) => !n.isRead).length;

  const iconColor = tone === "light" ? "text-white" : "text-navy";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Мэдэгдэл"
        className={`relative rounded-lg p-2 transition ${
          tone === "light" ? "hover:bg-white/10" : "hover:bg-slate-100"
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
          stroke="currentColor"
          className={`h-6 w-6 ${iconColor}`}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
          />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[11px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <NotificationDropdown
          notifications={items}
          onClose={() => setOpen(false)}
          onMarkAll={() => markAllRead(items)}
          onRead={(n) => {
            if (!n.isRead) markNotificationRead(n.id);
          }}
        />
      )}
    </div>
  );
}
