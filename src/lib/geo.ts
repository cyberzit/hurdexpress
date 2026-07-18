// Browser GPS — best-effort. Алдаа/зөвшөөрөлгүй бол null (баталгаажуулалтыг блоклохгүй).

export interface GeoPoint {
  lat: number;
  lng: number;
}

export function getCurrentPositionSafe(timeoutMs = 8000): Promise<GeoPoint | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, maximumAge: 15000, timeout: timeoutMs },
    );
  });
}
