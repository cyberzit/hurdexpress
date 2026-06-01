"use client";

import { useEffect, useMemo, useState } from "react";
import SettlementForm from "@/components/admin/SettlementForm";
import SettlementTable from "@/components/admin/SettlementTable";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import LoadingState from "@/components/ui/LoadingState";
import { subscribeCompanies } from "@/lib/firebase/companies";
import { subscribeSettlements } from "@/lib/firebase/settlements";
import type { Company, Settlement } from "@/types";

export default function SettlementsPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");

  useEffect(() => {
    const unsub = subscribeSettlements(
      (list) => {
        setSettlements(list);
        setLoading(false);
      },
      () => {
        setError("Тооцоонуудыг ачаалахад алдаа гарлаа.");
        setLoading(false);
      },
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = subscribeCompanies((l) => setCompanies(l), () => {});
    return () => unsub();
  }, []);

  const activeCompanies = useMemo(() => companies.filter((c) => c.isActive), [companies]);
  const filtered = useMemo(
    () => (companyFilter ? settlements.filter((s) => s.companyId === companyFilter) : settlements),
    [settlements, companyFilter],
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Тооцоо / нэхэмжлэл</h1>
      <p className="mt-1 text-sm text-slate-500">
        Хүргэлтийн төлбөр, COD, төлөгдсөн дүн, үлдэгдлийн тооцоо
      </p>

      <div className="mt-6">
        <SettlementForm companies={activeCompanies} />
      </div>

      <div className="mt-6">
        <select
          value={companyFilter}
          onChange={(e) => setCompanyFilter(e.target.value)}
          className="w-full max-w-xs rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-navy outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
        >
          <option value="">Бүх байгууллага</option>
          {companies.map((c) => (
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

      <div className="mt-5">
        {loading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="🧾"
            title={companyFilter ? "Илэрц олдсонгүй" : "Одоогоор тооцоо алга"}
            description="Дээрх формоор шинэ тооцоо үүсгэнэ үү."
          />
        ) : (
          <SettlementTable settlements={filtered} />
        )}
      </div>
    </div>
  );
}
