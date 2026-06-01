"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import TrackingTimeline from "@/components/tracking/TrackingTimeline";
import { TRACKING_STATUS_LABELS } from "@/lib/tracking-status";
import { trackOrderApi } from "@/lib/trackUrl";
import { formatDateTime } from "@/lib/format";
import type { OrderStatus } from "@/types";

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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-navy">{value}</span>
    </div>
  );
}

function TrackView() {
  // Том/жижиг үсэг ялгахгүй — trim + uppercase болгож normalize хийнэ.
  const code = (useSearchParams().get("code") ?? "").trim().toUpperCase();

  const [result, setResult] = useState<TrackResult | null>(null);
  const [loading, setLoading] = useState(!!code);
  const [notFound, setNotFound] = useState(!code);

  useEffect(() => {
    if (!code) return;
    let active = true;
    fetch(trackOrderApi(code))
      .then(async (res) => {
        if (!active) return;
        if (res.ok) setResult((await res.json()) as TrackResult);
        else setNotFound(true);
      })
      .catch(() => active && setNotFound(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [code]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-xl font-bold text-navy">Хүргэлтийн төлөв</h1>
      <p className="mt-1 font-mono text-sm text-slate-500">{code}</p>

      <div className="mt-6">
        {loading ? (
          <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-16 text-sm text-slate-500 shadow-sm">
            <span className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-brand" />
            Хайж байна…
          </div>
        ) : notFound || !result ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
            <p className="text-3xl">🔍</p>
            <p className="mt-2 font-medium text-navy">Захиалга олдсонгүй</p>
            <p className="mt-1 text-sm text-slate-500">«{code}» дугаар буруу байж магадгүй.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-sm font-semibold text-navy">
                {result.orderCode}
              </span>
              <span className="rounded-full bg-brand/15 px-3 py-1 text-xs font-semibold text-brand-dark">
                {TRACKING_STATUS_LABELS[result.status]}
              </span>
            </div>

            <div className="mt-4 rounded-xl bg-slate-50 p-4">
              <TrackingTimeline status={result.status} />
            </div>

            <div className="mt-4 space-y-2">
              <Row label="Дэлгүүр" value={result.companyName || "—"} />
              <Row label="Хүлээн авагч" value={result.receiverName || "—"} />
              <Row label="Утас" value={result.receiverPhoneMasked} />
              <Row label="Жолооч" value={result.driverName || "Хараахан оноогоогүй"} />
              {result.driverPhone && <Row label="Жолоочийн утас" value={result.driverPhone} />}
              <Row label="Үүссэн" value={formatDateTime(result.createdAt)} />
              {result.status === "delivered" && (
                <Row label="Хүргэгдсэн" value={formatDateTime(result.deliveredAt)} />
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function PublicTrackPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-4">
          <Link href="/login" className="text-lg font-bold text-navy">
            Hurd<span className="text-brand">Express</span>
          </Link>
          <Link href="/login" className="text-sm font-medium text-brand hover:underline">
            Нэвтрэх
          </Link>
        </div>
      </header>
      <Suspense fallback={<div className="py-16 text-center text-sm text-slate-500">Ачааллаж байна…</div>}>
        <TrackView />
      </Suspense>
    </div>
  );
}
