"use client";

import { useEffect, useMemo, useState } from "react";
import PartnerProductForm from "@/components/partner/PartnerProductForm";
import PartnerProductTable from "@/components/partner/PartnerProductTable";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import LoadingState from "@/components/ui/LoadingState";
import { useAuth } from "@/contexts/AuthContext";
import { getCompany } from "@/lib/firebase/companies";
import {
  setProductActive,
  subscribeProductsByCompanyAll,
} from "@/lib/firebase/products";
import type { Product } from "@/types";

export default function PartnerProductsPage() {
  const { profile } = useAuth();
  const companyId = profile?.companyId ?? "";

  const [companyName, setCompanyName] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  // Байгууллагын нэр (product дээр denormalize хийхэд)
  useEffect(() => {
    if (!companyId) return;
    getCompany(companyId)
      .then((c) => setCompanyName(c?.name ?? ""))
      .catch(() => {});
  }, [companyId]);

  // Өөрийн бүх бараа (realtime)
  useEffect(() => {
    if (!companyId) return;
    const unsub = subscribeProductsByCompanyAll(
      companyId,
      (list) => {
        setProducts(list);
        setLoading(false);
      },
      () => {
        setError("Барааг ачаалахад алдаа гарлаа.");
        setLoading(false);
      },
    );
    return () => unsub();
  }, [companyId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.sku ?? "").toLowerCase().includes(q),
    );
  }, [products, search]);

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(p: Product) {
    setEditing(p);
    setFormOpen(true);
  }
  async function toggleActive(p: Product) {
    try {
      await setProductActive(p.id, !p.isActive);
    } catch {
      setError("Төлөв солиход алдаа гарлаа.");
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Миний бараа</h1>
          <p className="mt-1 text-sm text-slate-500">{companyName}</p>
        </div>
        <Button onClick={openAdd}>+ Шинэ бараа нэмэх</Button>
      </div>

      <div className="mt-5">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Нэр эсвэл SKU-аар хайх…"
          className="w-full max-w-sm rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-navy outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      </div>

      {error && (
        <div className="mt-4">
          <ErrorState message={error} />
        </div>
      )}

      <div className="mt-5">
        {loading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="🛒"
            title={search ? "Илэрц олдсонгүй" : "Одоогоор бараа алга"}
            description={search ? "Өөр түлхүүр үгээр хайна уу." : "Дээрх товчоор бараа нэмнэ үү."}
          />
        ) : (
          <PartnerProductTable
            products={filtered}
            onEdit={openEdit}
            onToggleActive={toggleActive}
          />
        )}
      </div>

      {formOpen && (
        <PartnerProductForm
          initial={editing}
          companyId={companyId}
          companyName={companyName}
          onClose={() => setFormOpen(false)}
        />
      )}
    </div>
  );
}
