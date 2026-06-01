"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ExcelImport from "@/components/orders/ExcelImport";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeCompanies } from "@/lib/firebase/companies";
import { subscribeProductsByCompanyAll } from "@/lib/firebase/products";
import { getSettings } from "@/lib/settings";
import type { Company, Product } from "@/types";

export default function AdminImportPage() {
  const { profile } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyId, setCompanyId] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [deliveryPrice, setDeliveryPrice] = useState(6000);

  useEffect(() => {
    const unsub = subscribeCompanies((l) => setCompanies(l), () => {});
    getSettings()
      .then((s) => s?.defaultDeliveryPrice != null && setDeliveryPrice(s.defaultDeliveryPrice))
      .catch(() => {});
    return () => unsub();
  }, []);

  // Сонгосон байгууллагын бараа
  useEffect(() => {
    if (!companyId) return;
    const unsub = subscribeProductsByCompanyAll(companyId, (l) => setProducts(l), () => {});
    return () => unsub();
  }, [companyId]);

  const activeCompanies = useMemo(() => companies.filter((c) => c.isActive), [companies]);
  const companyName = useMemo(
    () => companies.find((c) => c.id === companyId)?.name ?? "",
    [companies, companyId],
  );

  return (
    <div>
      <Link href="/admin/orders" className="text-sm font-medium text-slate-500 hover:text-brand">
        ← Захиалгууд
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-navy">Excel импорт</h1>
      <p className="mt-1 text-sm text-slate-500">Байгууллага сонгож олон захиалга оруулна</p>

      <div className="mt-5 max-w-xs">
        <label className="text-sm font-medium text-slate-600">Байгууллага</label>
        <select
          value={companyId}
          onChange={(e) => setCompanyId(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-navy outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
        >
          <option value="">— Сонгох —</option>
          {activeCompanies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6">
        <ExcelImport
          companyId={companyId}
          companyName={companyName}
          products={products}
          defaultDeliveryPrice={deliveryPrice}
          createdByUid={profile?.uid ?? ""}
        />
      </div>
    </div>
  );
}
