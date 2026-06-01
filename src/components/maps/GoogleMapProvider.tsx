"use client";

import { useJsApiLoader } from "@react-google-maps/api";
import type { ReactNode } from "react";

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

function Message({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full min-h-64 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
      {children}
    </div>
  );
}

// Google Maps JS API-г нэг удаа ачаалж, бэлэн болсон үед children-г харуулна.
// API key байхгүй бол fallback (эсвэл анхдагч мессеж).
export default function GoogleMapProvider({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "hurdexpress-gmaps",
    googleMapsApiKey: MAPS_KEY,
  });

  if (!MAPS_KEY) {
    return (
      <>
        {fallback ?? (
          <Message>
            Газрын зураг харуулахын тулд NEXT_PUBLIC_GOOGLE_MAPS_API_KEY тохируулна уу.
          </Message>
        )}
      </>
    );
  }
  if (loadError) return <Message>Газрын зураг ачаалахад алдаа гарлаа.</Message>;
  if (!isLoaded) return <Message>Газрын зураг ачаалж байна…</Message>;

  return <>{children}</>;
}
