"use client";

import { useEffect, useMemo, useState } from "react";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import LoadingState from "@/components/ui/LoadingState";
import GoogleMapProvider from "@/components/maps/GoogleMapProvider";
import DriverMarkerMap, { type MapMarker } from "@/components/maps/DriverMarkerMap";
import { subscribeDriverLocations } from "@/lib/firebase/locations";
import { formatDateTime } from "@/lib/format";
import type { DriverLocation } from "@/types";

// Сүүлийн 5 минутад шинэчилсэн бол "идэвхтэй".
const ACTIVE_WINDOW_MS = 5 * 60 * 1000;

export default function LiveDriverMap() {
  const [locations, setLocations] = useState<DriverLocation[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [now, setNow] = useState(0);

  useEffect(() => {
    const unsub = subscribeDriverLocations(
      (list) => {
        setLocations(list);
        setLoaded(true);
      },
      () => setLoaded(true),
    );
    return () => unsub();
  }, []);

  // "now"-г render дотор биш, интервалаар (purity дүрэм).
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const t = setInterval(tick, 30000);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, []);

  // Бүх жолоочийг online/offline-аар нь ялгаж эрэмбэлнэ (online эхэнд).
  const ranked = useMemo(() => {
    return [...locations]
      .map((l) => ({ loc: l, online: now - l.updatedAt <= ACTIVE_WINDOW_MS }))
      .sort((a, b) => {
        if (a.online !== b.online) return a.online ? -1 : 1;
        return b.loc.updatedAt - a.loc.updatedAt;
      });
  }, [locations, now]);

  const onlineCount = useMemo(() => ranked.filter((r) => r.online).length, [ranked]);

  // Газрын зураг дээр зөвхөн online жолоочдыг харуулна.
  const markers: MapMarker[] = useMemo(
    () =>
      ranked
        .filter((r) => r.online)
        .map(({ loc: l }) => ({
          id: l.driverId,
          lat: l.lat,
          lng: l.lng,
          title: l.driverName || l.driverId,
          updatedAt: l.updatedAt,
          speed: l.speed ?? null,
        })),
    [ranked],
  );

  if (!loaded) return <LoadingState />;
  if (locations.length === 0) {
    return (
      <EmptyState
        icon="🛰️"
        title="Байршлын мэдээлэл алга"
        description="Жолооч байршил хуваалцаж эхэлмэгц энд харагдана."
      />
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      {/* Жагсаалт */}
      <div className="space-y-2 lg:col-span-2">
        <p className="text-xs text-slate-500">
          🚚 {onlineCount} online · {locations.length - onlineCount} offline
        </p>
        {ranked.map(({ loc: l, online }) => (
          <div
            key={l.driverId}
            className={`rounded-xl border bg-white px-4 py-3 ${
              online ? "border-slate-200" : "border-slate-200 opacity-70"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-navy">🚚 {l.driverName || l.driverId}</p>
                <p className="font-mono text-xs text-slate-500">
                  {l.lat.toFixed(5)}, {l.lng.toFixed(5)}
                </p>
                <p className="text-[11px] text-slate-400">{formatDateTime(l.updatedAt)}</p>
                {online && l.speed != null && (
                  <p className="text-[11px] text-slate-400">
                    {Math.round((l.speed || 0) * 3.6)} км/ц
                  </p>
                )}
              </div>
              {online ? <Badge tone="green">online</Badge> : <Badge tone="slate">Сүлжээгүй</Badge>}
            </div>
            <a
              href={`https://www.google.com/maps?q=${l.lat},${l.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-xs font-medium text-brand hover:underline"
            >
              Google Maps дээр нээх
            </a>
          </div>
        ))}
      </div>

      {/* Газрын зураг */}
      <div className="lg:col-span-3">
        <GoogleMapProvider>
          <DriverMarkerMap markers={markers} />
        </GoogleMapProvider>
      </div>
    </div>
  );
}
