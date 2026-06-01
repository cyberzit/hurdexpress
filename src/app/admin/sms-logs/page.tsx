"use client";

import { useEffect, useMemo, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import LoadingState from "@/components/ui/LoadingState";
import { resendOrderSms, subscribeSmsLogs } from "@/lib/sms";
import { formatDateTime } from "@/lib/format";
import { SMS_STATUS_LABELS, type SmsLog, type SmsStatus } from "@/types";

const STATUSES = Object.keys(SMS_STATUS_LABELS) as SmsStatus[];
const STATUS_TONE: Record<SmsStatus, "amber" | "green" | "red"> = {
  pending: "amber",
  sent: "green",
  failed: "red",
};

export default function SmsLogsPage() {
  const [logs, setLogs] = useState<SmsLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SmsStatus | "">("");
  const [resending, setResending] = useState("");

  useEffect(() => {
    const unsub = subscribeSmsLogs(
      (list) => {
        setLogs(list);
        setLoading(false);
      },
      () => {
        setError("SMS логийг ачаалахад алдаа гарлаа.");
        setLoading(false);
      },
    );
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((l) => {
      if (statusFilter && l.status !== statusFilter) return false;
      if (!q) return true;
      return (
        l.phone.toLowerCase().includes(q) ||
        l.orderCode.toLowerCase().includes(q)
      );
    });
  }, [logs, search, statusFilter]);

  async function resend(log: SmsLog) {
    setResending(log.id);
    setError("");
    try {
      await resendOrderSms({
        orderId: log.orderId,
        orderCode: log.orderCode,
        phone: log.phone,
        message: log.message,
      });
    } catch {
      setError("Дахин илгээхэд алдаа гарлаа.");
    } finally {
      setResending("");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">SMS лог</h1>
      <p className="mt-1 text-sm text-slate-500">Илгээсэн SMS-ийн түүх ба төлөв</p>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Утас эсвэл захиалгын кодоор хайх…"
          className="w-full max-w-sm rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-navy outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as SmsStatus | "")}
          className="w-full max-w-xs rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-navy outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
        >
          <option value="">Бүх төлөв</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {SMS_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mt-4">
          <ErrorState message={error} />
        </div>
      )}

      <div className="mt-5">
        {loading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="✉️"
            title={search || statusFilter ? "Илэрц олдсонгүй" : "Одоогоор SMS лог алга"}
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3 font-medium">Код</th>
                  <th className="px-4 py-3 font-medium">Утас</th>
                  <th className="px-4 py-3 font-medium">Мессеж</th>
                  <th className="px-4 py-3 font-medium">Огноо</th>
                  <th className="px-4 py-3 font-medium">Төлөв</th>
                  <th className="px-4 py-3 text-right font-medium">Үйлдэл</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr key={l.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 font-mono font-semibold text-navy">
                      {l.orderCode || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{l.phone}</td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className="line-clamp-2 max-w-xs">{l.message}</span>
                      {l.status === "failed" && l.errorMessage && (
                        <span className="block text-xs text-red-500">{l.errorMessage}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {formatDateTime(l.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONE[l.status]}>
                        {SMS_STATUS_LABELS[l.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        loading={resending === l.id}
                        onClick={() => resend(l)}
                      >
                        Дахин илгээх
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
