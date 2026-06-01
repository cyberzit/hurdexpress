"use client";

import { useEffect, useMemo, useState } from "react";
import CompanyForm from "@/components/admin/CompanyForm";
import CompanyTable from "@/components/admin/CompanyTable";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import LoadingState from "@/components/ui/LoadingState";
import {
  setCompanyActive,
  subscribeCompanies,
} from "@/lib/firebase/companies";
import type { Company } from "@/types";

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);

  // Real-time жагсаалт
  useEffect(() => {
    const unsubscribe = subscribeCompanies(
      (list) => {
        setCompanies(list);
        setLoading(false);
      },
      () => {
        setError("Жагсаалтыг ачаалахад алдаа гарлаа.");
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q),
    );
  }, [companies, search]);

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(company: Company) {
    setEditing(company);
    setFormOpen(true);
  }

  async function toggleActive(company: Company) {
    try {
      await setCompanyActive(company.id, !company.isActive);
    } catch {
      setError("Төлөв солиход алдаа гарлаа.");
    }
  }

  return (
    <div>
      {/* Толгой */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Харилцагч байгууллага</h1>
          <p className="mt-1 text-sm text-slate-500">
            Гэрээт харилцагч байгууллагуудын бүртгэл
          </p>
        </div>
        <button
          onClick={openAdd}
          className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
        >
          + Шинэ харилцагч нэмэх
        </button>
      </div>

      {/* Хайлт */}
      <div className="mt-5">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Нэр эсвэл утсаар хайх…"
          className="w-full max-w-sm rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-navy outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
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
            icon="🏢"
            title={search ? "Илэрц олдсонгүй" : "Одоогоор харилцагч алга"}
            description={
              search
                ? "Өөр түлхүүр үгээр хайж үзнэ үү."
                : "Дээрх товчоор шинэ харилцагч нэмнэ үү."
            }
          />
        ) : (
          <CompanyTable
            companies={filtered}
            onEdit={openEdit}
            onToggleActive={toggleActive}
          />
        )}
      </div>

      {formOpen && (
        <CompanyForm initial={editing} onClose={() => setFormOpen(false)} />
      )}
    </div>
  );
}
