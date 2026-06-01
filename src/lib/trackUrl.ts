// Public tracking нь Cloud Function руу ШУУД хандана.
// (Static export — Next API route байхгүй. trackOrder функц нь CORS-той.)
export const TRACK_ORDER_URL =
  process.env.NEXT_PUBLIC_TRACK_ORDER_URL ||
  "https://us-central1-hurdexpress-49cd2.cloudfunctions.net/trackOrder";

export function trackOrderApi(code: string): string {
  return `${TRACK_ORDER_URL}?code=${encodeURIComponent(code)}`;
}
