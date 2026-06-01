"use client";

import type { AppNotification } from "@/types";

function formatTime(ms: number): string {
  return new Date(ms).toLocaleString("mn-MN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface Props {
  notifications: AppNotification[];
  onClose: () => void;
  onMarkAll: () => void;
  onRead: (n: AppNotification) => void;
}

export default function NotificationDropdown({
  notifications,
  onClose,
  onMarkAll,
  onRead,
}: Props) {
  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <>
      {/* Гадна талыг дарвал хаагдана */}
      <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden />

      <div className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white text-navy shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <span className="text-sm font-bold">Мэдэгдэл</span>
          {hasUnread && (
            <button
              onClick={onMarkAll}
              className="text-xs font-medium text-brand hover:underline"
            >
              Бүгдийг уншсан
            </button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-400">
              Мэдэгдэл алга
            </p>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => onRead(n)}
                className={`flex w-full items-start gap-3 border-b border-slate-50 px-4 py-3 text-left transition hover:bg-slate-50 ${
                  n.isRead ? "" : "bg-brand/5"
                }`}
              >
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                    n.isRead ? "bg-transparent" : "bg-brand"
                  }`}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-navy">{n.title}</span>
                  <span className="block text-xs text-slate-500">{n.message}</span>
                  <span className="mt-0.5 block text-[11px] text-slate-400">
                    {formatTime(n.createdAt)}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
}
