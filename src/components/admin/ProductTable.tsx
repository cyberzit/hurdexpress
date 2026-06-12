"use client";

import StockBadge from "@/components/products/StockBadge";
import type { Product } from "@/types";

interface Props {
  products: Product[];
  onEdit: (product: Product) => void;
  onToggleActive: (product: Product) => void;
  onAdjust: (product: Product) => void;
}

// Барааны жижиг зураг (lazy) — байхгүй бол placeholder.
function ProductThumb({ product }: { product: Product }) {
  const url = product.thumbnailUrl || product.photoUrl;
  if (!url) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-300">
        🛒
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={product.name}
      loading="lazy"
      className="h-10 w-10 rounded-lg object-cover"
    />
  );
}

export default function ProductTable({ products, onEdit, onToggleActive, onAdjust }: Props) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
            <th className="px-4 py-3 font-medium">Зураг</th>
            <th className="px-4 py-3 font-medium">Байгууллага</th>
            <th className="px-4 py-3 font-medium">Барааны нэр</th>
            <th className="px-4 py-3 font-medium">SKU</th>
            <th className="px-4 py-3 font-medium">Үнэ</th>
            <th className="px-4 py-3 font-medium">Үлдэгдэл</th>
            <th className="px-4 py-3 font-medium">Төлөв</th>
            <th className="px-4 py-3 text-right font-medium">Үйлдэл</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr
              key={p.id}
              className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
            >
              <td className="px-4 py-3">
                <ProductThumb product={p} />
              </td>
              <td className="px-4 py-3 text-slate-600">{p.companyName || "—"}</td>
              <td className="px-4 py-3 font-medium text-navy">{p.name}</td>
              <td className="px-4 py-3 text-slate-600">{p.sku || "—"}</td>
              <td className="px-4 py-3 text-slate-600">
                {p.price.toLocaleString("mn-MN")}₮
              </td>
              <td className="px-4 py-3">
                <StockBadge product={p} />
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => onToggleActive(p)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                    p.isActive
                      ? "bg-green-50 text-green-700 hover:bg-green-100"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {p.isActive ? "Идэвхтэй" : "Идэвхгүй"}
                </button>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onAdjust(p)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-navy transition hover:bg-slate-50"
                  >
                    Үлдэгдэл
                  </button>
                  <button
                    onClick={() => onEdit(p)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-navy transition hover:bg-slate-50"
                  >
                    Засах
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
