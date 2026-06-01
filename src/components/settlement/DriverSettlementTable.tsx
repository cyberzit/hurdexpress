"use client";

import { useState } from "react";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  DRIVER_SETTLEMENT_STATUS_LABELS,
  type DriverSettlement,
  type DriverSettlementStatus,
} from "@/types";

const STATUS_STYLES: Record<DriverSettlementStatus, string> = {
  open: "bg-slate-100 text-slate-500",
  submitted: "bg-amber-50 text-amber-700",
  approved: "bg-green-50 text-green-700",
};

interface Props {
  settlements: DriverSettlement[];
  busyId?: string;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onSaveNote: (id: string, note: string) => void;
}

function DiffBadge({ value }: { value: number }) {
  const zero = value === 0;
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
        zero ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
      }`}
    >
      {formatCurrency(value)}
    </span>
  );
}

export default function DriverSettlementTable({
  settlements,
  busyId,
  onApprove,
  onReject,
  onSaveNote,
}: Props) {
  const [noteId, setNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  function openNote(s: DriverSettlement) {
    setNoteId(s.id);
    setNoteText(s.note ?? "");
  }
  function saveNote() {
    if (noteId) onSaveNote(noteId, noteText);
    setNoteId(null);
  }

  function Actions({ s }: { s: DriverSettlement }) {
    const busy = busyId === s.id;
    return (
      <div className="flex flex-wrap items-center justify-end gap-1.5">
        {s.status === "submitted" && (
          <>
            <button
              onClick={() => onApprove(s.id)}
              disabled={busy}
              className="rounded-lg bg-green-600 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-green-700 disabled:opacity-60"
            >
              Батлах
            </button>
            <button
              onClick={() => onReject(s.id)}
              disabled={busy}
              className="rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-60"
            >
              Буцаах
            </button>
          </>
        )}
        <button
          onClick={() => openNote(s)}
          className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-navy transition hover:bg-slate-50"
        >
          ✎ Тэмдэглэл
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Desktop */}
      <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3 font-medium">Жолооч</th>
              <th className="px-4 py-3 font-medium">Огноо</th>
              <th className="px-4 py-3 font-medium">COD</th>
              <th className="px-4 py-3 font-medium">Тушаасан</th>
              <th className="px-4 py-3 font-medium">Зөрүү</th>
              <th className="px-4 py-3 font-medium">Статус</th>
              <th className="px-4 py-3 text-right font-medium">Үйлдэл</th>
            </tr>
          </thead>
          <tbody>
            {settlements.map((s) => (
              <tr key={s.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                <td className="px-4 py-3 font-medium text-navy">{s.driverName}</td>
                <td className="px-4 py-3 text-slate-600">{formatDate(s.date)}</td>
                <td className="px-4 py-3 text-slate-600">{formatCurrency(s.codCollected)}</td>
                <td className="px-4 py-3 text-slate-600">{formatCurrency(s.handedAmount)}</td>
                <td className="px-4 py-3">
                  <DiffBadge value={s.differenceAmount} />
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[s.status]}`}>
                    {DRIVER_SETTLEMENT_STATUS_LABELS[s.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Actions s={s} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="space-y-3 md:hidden">
        {settlements.map((s) => (
          <div key={s.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-navy">{s.driverName}</p>
                <p className="text-xs text-slate-400">{formatDate(s.date)}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[s.status]}`}>
                {DRIVER_SETTLEMENT_STATUS_LABELS[s.status]}
              </span>
            </div>
            <div className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">COD</span>
                <span className="text-navy">{formatCurrency(s.codCollected)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Тушаасан</span>
                <span className="text-navy">{formatCurrency(s.handedAmount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Зөрүү</span>
                <DiffBadge value={s.differenceAmount} />
              </div>
            </div>
            {s.note && <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">📝 {s.note}</p>}
            <div className="mt-3">
              <Actions s={s} />
            </div>
          </div>
        ))}
      </div>

      {/* Note editor modal */}
      {noteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-sm font-bold text-navy">Тэмдэглэл</h3>
            <textarea
              className="mt-3 min-h-24 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-navy outline-none focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
            <div className="mt-3 flex gap-3">
              <button
                onClick={() => setNoteId(null)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-navy transition hover:bg-slate-50"
              >
                Болих
              </button>
              <button
                onClick={saveNote}
                className="flex-1 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
              >
                Хадгалах
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
