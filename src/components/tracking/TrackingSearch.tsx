"use client";

import { useEffect, useState } from "react";
import TrackingTimeline from "@/components/tracking/TrackingTimeline";
import { TRACKING_STATUS_LABELS } from "@/lib/tracking-status";
import { trackOrderApi } from "@/lib/trackUrl";
import { getSettings } from "@/lib/settings";
import type { OrderStatus } from "@/types";

// trackOrder Cloud Function-ийн буцаах хязгаарлагдмал DTO.
interface TrackResult {
  orderCode: string;
  status: OrderStatus;
  companyName: string | null;
  receiverName: string | null;
  receiverPhoneMasked: string;
  driverName: string | null;
  driverPhone: string | null;
  createdAt: number | null;
  deliveredAt: number | null;
}

function formatDate(ms: number | null): string {
  if (!ms) return "—";
  return new Date(ms).toLocaleString("mn-MN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-navy">{value}</span>
    </div>
  );
}

export default function TrackingSearch() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [result, setResult] = useState<TrackResult | null>(null);
  const [trackingEnabled, setTrackingEnabled] = useState(true);

  // Tracking идэвхтэй эсэхийг settings-ээс уншина (нийтэд унших боломжтой).
  useEffect(() => {
    getSettings()
      .then((s) => {
        if (s) setTrackingEnabled(s.trackingEnabled);
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!code.trim()) {
      setError("Захиалгын дугаараа оруулна уу.");
      return;
    }

    // Том/жижиг үсэг ялгахгүй — trim + uppercase болгож normalize хийнэ.
    const normalizedCode = code.trim().toUpperCase();

    setLoading(true);
    setSearched(true);
    try {
      // Public tracking — Cloud Function руу шууд (static export).
      const res = await fetch(trackOrderApi(normalizedCode));
      if (res.status === 404) {
        setResult(null);
      } else if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Хайлт хийхэд алдаа гарлаа.");
      } else {
        setResult((await res.json()) as TrackResult);
      }
    } catch {
      setError("Сүлжээний алдаа. Дахин оролдоно уу.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
      <h2 className="flex items-center gap-2 text-lg font-bold text-navy">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 text-brand">
          🔎
        </span>
        Хүргэлтийн төлөв шалгах
      </h2>

      {!trackingEnabled ? (
        <p className="mt-4 rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
          Төлөв шалгах үйлчилгээ түр хаалттай байна.
        </p>
      ) : (
        <>
      <form onSubmit={handleSubmit} className="mt-4">
        <label className="text-sm font-medium text-slate-600" htmlFor="orderCode">
          Захиалгын дугаар
        </label>
        <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
          <input
            id="orderCode"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Жишээ: HX123456"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-navy outline-none transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
          />
          <button
            type="submit"
            disabled={loading}
            className="shrink-0 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-60"
          >
            {loading ? "Шалгаж байна…" : "Хайх"}
          </button>
        </div>
      </form>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {!loading && searched && !result && !error && (
        <p className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          «{code.trim().toUpperCase()}» дугаартай захиалга олдсонгүй.
        </p>
      )}

      {result && (
        <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-sm font-semibold text-navy">
              {result.orderCode}
            </span>
            <span className="rounded-full bg-brand/15 px-3 py-1 text-xs font-semibold text-brand-dark">
              {TRACKING_STATUS_LABELS[result.status]}
            </span>
          </div>

          <div className="mt-4 rounded-xl bg-white p-4">
            <TrackingTimeline status={result.status} />
          </div>

          <div className="mt-4 space-y-2">
            <Row label="Дэлгүүр" value={result.companyName || "—"} />
            <Row label="Хүлээн авагч" value={result.receiverName || "—"} />
            <Row label="Хүлээн авагчийн утас" value={result.receiverPhoneMasked} />
            <Row label="Жолооч" value={result.driverName || "Хараахан оноогоогүй"} />
            {result.driverPhone && (
              <Row label="Жолоочийн утас" value={result.driverPhone} />
            )}
            <Row label="Үүссэн" value={formatDate(result.createdAt)} />
            {result.status === "delivered" && (
              <Row label="Хүргэгдсэн" value={formatDate(result.deliveredAt)} />
            )}
          </div>
        </div>
      )}
        </>
      )}
    </section>
  );
}
