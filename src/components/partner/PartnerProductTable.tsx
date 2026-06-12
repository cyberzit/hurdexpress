"use client";

import Button from "@/components/ui/Button";
import StockBadge from "@/components/products/StockBadge";
import { formatCurrency } from "@/lib/format";
import type { Product } from "@/types";

interface Props {
  products: Product[];
  onEdit: (product: Product) => void;
  onToggleActive: (product: Product) => void;
}

function ProductThumb({ product, className = "h-10 w-10" }: { product: Product; className?: string }) {
  const url = product.thumbnailUrl || product.photoUrl;
  if (!url) {
    return (
      <div
        className={`${className} flex items-center justify-center rounded-lg bg-slate-100 text-slate-300`}
      >
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
      className={`${className} rounded-lg object-cover`}
    />
  );
}

function ActiveBtn({ product, onToggleActive }: { product: Product; onToggleActive: Props["onToggleActive"] }) {
  return (
    <button
      onClick={() => onToggleActive(product)}
      className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
        product.isActive
          ? "bg-green-50 text-green-700 hover:bg-green-100"
          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
      }`}
    >
      {product.isActive ? "Идэвхтэй" : "Идэвхгүй"}
    </button>
  );
}

export default function PartnerProductTable({ products, onEdit, onToggleActive }: Props) {
  return (
    <>
      {/* Desktop — table */}
      <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3 font-medium">Зураг</th>
              <th className="px-4 py-3 font-medium">Нэр</th>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Үнэ</th>
              <th className="px-4 py-3 font-medium">Үлдэгдэл</th>
              <th className="px-4 py-3 font-medium">Төлөв</th>
              <th className="px-4 py-3 text-right font-medium">Үйлдэл</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                <td className="px-4 py-3">
                  <ProductThumb product={p} />
                </td>
                <td className="px-4 py-3 font-medium text-navy">{p.name}</td>
                <td className="px-4 py-3 text-slate-600">{p.sku || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{formatCurrency(p.price)}</td>
                <td className="px-4 py-3">
                  <StockBadge product={p} partner />
                </td>
                <td className="px-4 py-3">
                  <ActiveBtn product={p} onToggleActive={onToggleActive} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Button size="sm" variant="outline" onClick={() => onEdit(p)}>
                    Засах
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile — card list */}
      <div className="space-y-3 md:hidden">
        {products.map((p) => (
          <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-3">
                <ProductThumb product={p} className="h-12 w-12 shrink-0" />
                <div className="min-w-0">
                  <p className="truncate font-medium text-navy">{p.name}</p>
                  <p className="text-xs text-slate-400">{p.sku || "—"}</p>
                </div>
              </div>
              <ActiveBtn product={p} onToggleActive={onToggleActive} />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="font-semibold text-navy">{formatCurrency(p.price)}</span>
              <StockBadge product={p} partner />
            </div>
            <div className="mt-2 flex justify-end">
              <Button size="sm" variant="outline" onClick={() => onEdit(p)}>
                Засах
              </Button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
