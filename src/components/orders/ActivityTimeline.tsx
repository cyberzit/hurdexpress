"use client";

import { useEffect, useState } from "react";
import { subscribeActivities } from "@/lib/firebase/activity";
import type { Activity, StaffRole } from "@/types";

const ROLE_LABELS: Record<StaffRole, string> = {
  admin: "Админ",
  partner: "Харилцагч",
  driver: "Жолооч",
};

function formatTime(ms: number): string {
  return new Date(ms).toLocaleString("mn-MN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ActivityTimeline({ orderId }: { orderId: string }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    const unsub = subscribeActivities(
      orderId,
      (list) => {
        setActivities(list);
        setLoaded(true);
      },
      () => setLoaded(true),
    );
    return () => unsub();
  }, [orderId]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-bold text-navy">Үйл ажиллагааны түүх</h2>

      {!loaded ? (
        <p className="mt-3 text-sm text-slate-400">Ачааллаж байна…</p>
      ) : activities.length === 0 ? (
        <p className="mt-3 text-sm text-slate-400">Бүртгэл алга.</p>
      ) : (
        <ol className="mt-4">
          {activities.map((a, i) => {
            const isLast = i === activities.length - 1;
            return (
              <li key={a.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="mt-1 h-3 w-3 shrink-0 rounded-full border-2 border-brand bg-brand" />
                  {!isLast && <span className="min-h-8 w-0.5 flex-1 bg-slate-200" />}
                </div>
                <div className={isLast ? "" : "pb-5"}>
                  <p className="text-sm font-medium text-navy">{a.action}</p>
                  <p className="text-xs text-slate-500">
                    {a.actorName} · {ROLE_LABELS[a.actorRole] ?? a.actorRole}
                  </p>
                  <p className="text-[11px] text-slate-400">{formatTime(a.createdAt)}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
