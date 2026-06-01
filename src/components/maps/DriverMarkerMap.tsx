"use client";

import { GoogleMap, InfoWindow, Marker } from "@react-google-maps/api";
import { useState } from "react";
import { formatDateTime } from "@/lib/format";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  updatedAt?: number;
  speed?: number | null;
}

// Улаанбаатарын төв — анхдагч center.
const UB_CENTER = { lat: 47.9188, lng: 106.9176 };

export default function DriverMarkerMap({
  markers,
  height = "420px",
}: {
  markers: MapMarker[];
  height?: string;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const center = markers.length
    ? { lat: markers[0].lat, lng: markers[0].lng }
    : UB_CENTER;

  return (
    <GoogleMap
      mapContainerStyle={{ width: "100%", height, borderRadius: "1rem" }}
      center={center}
      zoom={markers.length ? 13 : 11}
      options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
    >
      {markers.map((m) => (
        <Marker
          key={m.id}
          position={{ lat: m.lat, lng: m.lng }}
          title={m.title}
          onClick={() => setActiveId(m.id)}
        >
          {activeId === m.id && (
            <InfoWindow
              position={{ lat: m.lat, lng: m.lng }}
              onCloseClick={() => setActiveId(null)}
            >
              <div style={{ minWidth: 160 }}>
                <p style={{ fontWeight: 700, color: "#0b1b33" }}>{m.title}</p>
                {m.updatedAt && (
                  <p style={{ fontSize: 12, color: "#64748b" }}>
                    Сүүлд: {formatDateTime(m.updatedAt)}
                  </p>
                )}
                {m.speed != null && (
                  <p style={{ fontSize: 12, color: "#64748b" }}>
                    Хурд: {Math.round((m.speed || 0) * 3.6)} км/ц
                  </p>
                )}
                <a
                  href={`https://www.google.com/maps?q=${m.lat},${m.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 12, color: "#f97316", fontWeight: 600 }}
                >
                  Google Maps дээр нээх
                </a>
              </div>
            </InfoWindow>
          )}
        </Marker>
      ))}
    </GoogleMap>
  );
}
