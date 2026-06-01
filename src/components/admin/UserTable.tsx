"use client";

import { formatDate } from "@/lib/format";
import type { User } from "@/types";

interface Props {
  users: User[];
  onEdit: (user: User) => void;
  onToggleActive: (user: User) => void;
}

export default function UserTable({ users, onEdit, onToggleActive }: Props) {
  return (
    <>
      {/* Desktop — table */}
      <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3 font-medium">Нэр</th>
              <th className="px-4 py-3 font-medium">Имэйл</th>
              <th className="px-4 py-3 font-medium">Утас</th>
              <th className="px-4 py-3 font-medium">Идэвхтэй</th>
              <th className="px-4 py-3 font-medium">Үүсгэсэн огноо</th>
              <th className="px-4 py-3 text-right font-medium">Үйлдэл</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u.uid}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
              >
                <td className="px-4 py-3 font-medium text-navy">{u.name}</td>
                <td className="px-4 py-3 text-slate-600">{u.email}</td>
                <td className="px-4 py-3 text-slate-600">{u.phone}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onToggleActive(u)}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                      u.isActive
                        ? "bg-green-50 text-green-700 hover:bg-green-100"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    {u.isActive ? "Идэвхтэй" : "Идэвхгүй"}
                  </button>
                </td>
                <td className="px-4 py-3 text-slate-500">{formatDate(u.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => onEdit(u)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-navy transition hover:bg-slate-50"
                  >
                    Засах
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile — card list */}
      <div className="space-y-3 md:hidden">
        {users.map((u) => (
          <div
            key={u.uid}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-navy">{u.name}</p>
                <p className="truncate text-xs text-slate-500">{u.email}</p>
                <p className="text-xs text-slate-500">{u.phone}</p>
              </div>
              <button
                onClick={() => onToggleActive(u)}
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition ${
                  u.isActive
                    ? "bg-green-50 text-green-700 hover:bg-green-100"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {u.isActive ? "Идэвхтэй" : "Идэвхгүй"}
              </button>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Үүсгэсэн: {formatDate(u.createdAt)}
              </span>
              <button
                onClick={() => onEdit(u)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-navy transition hover:bg-slate-50"
              >
                Засах
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
