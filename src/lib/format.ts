// Форматын нэгдсэн туслахууд.

// Мөнгөн дүн — "12,000₮"
export function formatCurrency(value: number | null | undefined): string {
  return `${(value ?? 0).toLocaleString("mn-MN")}₮`;
}

// Огноо + цаг — "2026/05/31 14:30"
export function formatDateTime(ms: number | null | undefined): string {
  if (!ms) return "—";
  return new Date(ms).toLocaleString("mn-MN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Зөвхөн огноо — "2026/05/31"
export function formatDate(ms: number | null | undefined): string {
  if (!ms) return "—";
  return new Date(ms).toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

// Тайлан/PDF-д зориулсан ISO хэлбэр — "2026-07-18".
// (formatDate нь locale-аас хамаарч "2026/07/18" гэж гардаг тул тайланд тогтвортой биш.)
export function formatDateISO(ms: number | null | undefined): string {
  if (!ms) return "—";
  const d = new Date(ms);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

// "2026-07-18 17:30"
export function formatDateTimeISO(ms: number | null | undefined): string {
  if (!ms) return "—";
  const d = new Date(ms);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${formatDateISO(ms)} ${hh}:${mm}`;
}

// Утас mask — "••••2233" (зөвхөн сүүлийн 4 орон)
export function formatPhoneMask(phone: string | null | undefined): string {
  const digits = (phone ?? "").replace(/\D/g, "");
  return digits.length >= 4 ? `••••${digits.slice(-4)}` : "••••";
}
