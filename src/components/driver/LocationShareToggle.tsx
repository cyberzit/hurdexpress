"use client";

import { useEffect, useState } from "react";
import { pushDriverLocation } from "@/lib/firebase/locations";

interface Props {
  driverId: string;
  driverName: string;
  hasActiveOrders: boolean;
}

// watchPosition-г зөв (батарей хэмнэх) ашиглах зарчмууд:
//  - enableHighAccuracy: false → GPS-ийн оронд сүлжээ/Wi-Fi (бага эрчим хүч).
//  - watchPosition олон удаа дуудагдаж болох тул Firestore бичилтийг 25 сек тутамд
//    нэг удаа throttle хийнэ (дата/бичилт хэмнэнэ).
//  - maximumAge → саяхны кэшлэсэн байршлыг зөвшөөрнө.
//  - Зөвхөн active order байх үед, toggle унтраахад clearWatch.
const THROTTLE_MS = 25000;

export default function LocationShareToggle({
  driverId,
  driverName,
  hasActiveOrders,
}: Props) {
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled || !hasActiveOrders) return;
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      return;
    }

    let lastSent = 0;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const ts = pos.timestamp || 0;
        // 25 сек throttle — watchPosition олон дуудагдсан ч бичилт хязгаарлана.
        if (ts - lastSent < THROTTLE_MS) return;
        lastSent = ts;
        setError("");
        pushDriverLocation({
          driverId,
          driverName,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy ?? undefined,
          heading: pos.coords.heading ?? undefined,
          speed: pos.coords.speed ?? undefined,
        }).catch(() => {});
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setError(
            "Байршил хуваалцах зөвшөөрөл татгалзагдсан. Хөтчийн тохиргооноос зөвшөөрнө үү.",
          );
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setError("Байршил тодорхойлох боломжгүй байна.");
        } else {
          setError("Байршил авахад алдаа гарлаа. Дахин оролдоно уу.");
        }
      },
      { enableHighAccuracy: false, maximumAge: 20000, timeout: 20000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [enabled, hasActiveOrders, driverId, driverName]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-navy">📍 Байршил хуваалцах</p>
          <p className="text-xs text-slate-500">
            {enabled
              ? hasActiveOrders
                ? "Идэвхтэй — байршил илгээж байна"
                : "Идэвхтэй захиалга байхгүй тул түр зогссон"
              : "Унтраалттай"}
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Байршил хуваалцах"
          onClick={() => setEnabled((v) => !v)}
          className={`relative h-7 w-12 shrink-0 rounded-full transition ${
            enabled ? "bg-brand" : "bg-slate-300"
          }`}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
              enabled ? "left-6" : "left-1"
            }`}
          />
        </button>
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
