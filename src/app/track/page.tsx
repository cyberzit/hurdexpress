"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import TrackForm from "@/components/TrackForm";
import { getShipmentByTrackingNumber } from "@/lib/firebase/shipments";
import { SHIPMENT_STATUS_LABELS, type Shipment } from "@/types";

function TrackResult() {
  const params = useSearchParams();
  const trackingNumber = params.get("n") ?? "";
  // Үр дүнг хайсан дугаартай нь хамт хадгална — ингэснээр loading-г синхрон setState-гүйгээр гаргана.
  const [result, setResult] = useState<{ n: string; shipment: Shipment | null } | null>(null);

  const loading = trackingNumber !== "" && result?.n !== trackingNumber;
  const shipment = result?.n === trackingNumber ? result.shipment : null;
  const searched = result?.n === trackingNumber;

  useEffect(() => {
    if (!trackingNumber) return;
    let active = true;
    getShipmentByTrackingNumber(trackingNumber)
      .then((s) => {
        if (active) setResult({ n: trackingNumber, shipment: s });
      })
      .catch(() => {
        if (active) setResult({ n: trackingNumber, shipment: null });
      });
    return () => {
      active = false;
    };
  }, [trackingNumber]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold">Илгээмж хайх</h1>
      <div className="mt-6">
        <TrackForm />
      </div>

      {loading && (
        <p className="mt-8 text-sm text-black/60 dark:text-white/60">Хайж байна...</p>
      )}

      {!loading && searched && !shipment && (
        <p className="mt-8 rounded-md bg-black/5 px-4 py-3 text-sm dark:bg-white/5">
          «{trackingNumber}» дугаартай илгээмж олдсонгүй.
        </p>
      )}

      {!loading && shipment && (
        <div className="mt-8 rounded-xl border border-black/10 p-6 dark:border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-black/50 dark:text-white/50">
                Tracking дугаар
              </p>
              <p className="font-mono font-semibold">{shipment.trackingNumber}</p>
            </div>
            <span className="rounded-full bg-orange-500/15 px-3 py-1 text-sm font-medium text-orange-600">
              {SHIPMENT_STATUS_LABELS[shipment.status]}
            </span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-black/50 dark:text-white/50">Хаанаас</p>
              <p>{shipment.from.city}, {shipment.from.line1}</p>
            </div>
            <div>
              <p className="text-black/50 dark:text-white/50">Хаашаа</p>
              <p>{shipment.to.city}, {shipment.to.line1}</p>
            </div>
          </div>

          <div className="mt-6">
            <p className="mb-3 text-sm font-medium">Хүргэлтийн түүх</p>
            <ol className="space-y-3">
              {[...shipment.history].reverse().map((ev, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-orange-500" />
                  <div>
                    <p className="font-medium">
                      {SHIPMENT_STATUS_LABELS[ev.status]}
                    </p>
                    <p className="text-black/50 dark:text-white/50">
                      {new Date(ev.at).toLocaleString("mn-MN")}
                      {ev.location ? ` · ${ev.location}` : ""}
                    </p>
                    {ev.note && <p className="text-black/60 dark:text-white/60">{ev.note}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={null}>
          <TrackResult />
        </Suspense>
      </main>
    </>
  );
}
