"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ExcelImport from "@/components/orders/ExcelImport";
import { useAuth } from "@/contexts/AuthContext";
import { getCompany } from "@/lib/firebase/companies";
import { subscribeProductsByCompanyAll } from "@/lib/firebase/products";
import { getSettings } from "@/lib/settings";
import type { Product } from "@/types";

export default function PartnerImportPage() {
  const { profile } = useAuth();
  const companyId = profile?.companyId ?? "";

  const [companyName, setCompanyName] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [deliveryPrice, setDeliveryPrice] = useState(6000);

  useEffect(() => {
    if (!companyId) return;
    getCompany(companyId).then((c) => setCompanyName(c?.name ?? "")).catch(() => {});
    getSettings()
      .then((s) => s?.defaultDeliveryPrice != null && setDeliveryPrice(s.defaultDeliveryPrice))
      .catch(() => {});
    const unsub = subscribeProductsByCompanyAll(companyId, (l) => setProducts(l), () => {});
    return () => unsub();
  }, [companyId]);

  return (
    <div>
      <Link href="/partner/orders" className="text-sm font-medium text-slate-500 hover:text-brand">
        ← Миний захиалгууд
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-navy">Excel импорт</h1>
      <p className="mt-1 text-sm text-slate-500">{companyName}</p>

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
