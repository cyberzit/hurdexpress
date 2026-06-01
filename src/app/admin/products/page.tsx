"use client";

import { useEffect, useMemo, useState } from "react";
import ProductForm from "@/components/admin/ProductForm";
import ProductTable from "@/components/admin/ProductTable";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import LoadingState from "@/components/ui/LoadingState";
import { subscribeCompanies } from "@/lib/firebase/companies";
import {
  setProductActive,
  subscribeProducts,
} from "@/lib/firebase/products";
import type { Company, Product } from "@/types";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  // Бараа — real-time
  useEffect(() => {
    const unsubscribe = subscribeProducts(
      (list) => {
        setProducts(list);
        setLoading(false);
      },
      () => {
        setError("Барааны жагсаалтыг ачаалахад алдаа гарлаа.");
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, []);

  // Байгууллага — dropdown/filter-д
  useEffect(() => {
    const unsubscribe = subscribeCompanies(
      (list) => setCompanies(list),
      () => {},
    );
    return () => unsubscribe();
  }, []);

  const activeCompanies = useMemo(
    () => companies.filter((c) => c.isActive),
    [companies],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (companyFilter && p.companyId !== companyFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.sku ?? "").toLowerCase().includes(q)
      );
    });
  }, [products, search, companyFilter]);

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setFormOpen(true);
  }

  async function toggleActive(product: Product) {
    try {
      await setProductActive(product.id, !product.isActive);
    } catch {
      setError("Төлөв солиход алдаа гарлаа.");
    }
  }

  return (
    <div>
      {/* Толгой */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Бараа бүтээгдэхүүн</h1>
          <p className="mt-1 text-sm text-slate-500">
            Харилцагч байгууллагуудын бараа бүтээгдэхүүн
          </p>
        </div>
        <button
          onClick={openAdd}
          className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
        >
          + Шинэ бараа нэмэх
        </button>
      </div>

      {/* Хайлт + filter */}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Барааны нэр эсвэл SKU-аар хайх…"
          className="w-full max-w-sm rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-navy outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        <select
          value={companyFilter}
          onChange={(e) => setCompanyFilter(e.target.value)}
          className="w-full max-w-xs rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-navy outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
        >
          <option value="">Бүх байгууллага</option>
          {activeCompanies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mt-4">
          <ErrorState message={error} />
        </div>
      )}

      {/* Контент */}
      <div className="mt-5">
        {loading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="🛒"
            title={search || companyFilter ? "Илэрц олдсонгүй" : "Одоогоор бараа алга"}
            description={
              search || companyFilter
                ? "Шүүлтүүрээ өөрчилж үзнэ үү."
                : "Дээрх товчоор шинэ бараа нэмнэ үү."
            }
          />
        ) : (
          <ProductTable
            products={filtered}
            onEdit={openEdit}
            onToggleActive={toggleActive}
          />
        )}
      </div>

      {formOpen && (
        <ProductForm
          initial={editing}
          companies={activeCompanies}
          onClose={() => setFormOpen(false)}
        />
      )}
    </div>
  );
}
