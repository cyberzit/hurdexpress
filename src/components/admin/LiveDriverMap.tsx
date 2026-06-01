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

  const active = useMemo(
    () => locations.filter((l) => now - l.updatedAt <= ACTIVE_WINDOW_MS),
    [locations, now],
  );

  const markers: MapMarker[] = useMemo(
    () =>
      active.map((l) => ({
        id: l.driverId,
        lat: l.lat,
        lng: l.lng,
        title: l.driverName || l.driverId,
        updatedAt: l.updatedAt,
        speed: l.speed ?? null,
      })),
    [active],
  );

  if (!loaded) return <LoadingState />;
  if (active.length === 0) {
    return (
      <EmptyState
        icon="🛰️"
        title="Идэвхтэй жолооч алга"
        description="Жолооч байршил хуваалцаж эхэлмэгц энд харагдана."
      />
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      {/* Жагсаалт */}
      <div className="space-y-2 lg:col-span-2">
        {active.map((l) => (
          <div
            key={l.driverId}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-navy">{l.driverName || l.driverId}</p>
                <p className="font-mono text-xs text-slate-500">
                  {l.lat.toFixed(5)}, {l.lng.toFixed(5)}
                </p>
                <p className="text-[11px] text-slate-400">{formatDateTime(l.updatedAt)}</p>
                {l.speed != null && (
                  <p className="text-[11px] text-slate-400">
                    {Math.round((l.speed || 0) * 3.6)} км/ц
                  </p>
                )}
              </div>
              <Badge tone="green">online</Badge>
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
