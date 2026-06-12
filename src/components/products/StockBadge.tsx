"use client";

import type { Product } from "@/types";

// Боломжит үлдэгдлийн badge: 0 → улаан, бага → шар, хангалттай → ногоон.
export default function StockBadge({
  product,
  partner = false,
}: {
  product: Product;
  partner?: boolean;
}) {
  const available = product.availableQty ?? 0;

  if (available <= 0) {
    return (
      <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
        {partner ? "Үлдэгдэл дууссан" : "Дууссан (0)"}
      </span>
    );
  }

  const low = product.lowStockAlertQty > 0 && available <= product.lowStockAlertQty;
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
        low ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"
      }`}
      title={`Нийт ${product.stockQty ?? 0} · түгжсэн ${product.reservedQty ?? 0}`}
    >
      {available} ш{low ? " ⚠️" : ""}
    </span>
  );
}
