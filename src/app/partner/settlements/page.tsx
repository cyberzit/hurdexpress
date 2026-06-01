"use client";

import { useEffect, useMemo, useState } from "react";
import PartnerSettlementTable from "@/components/partner/PartnerSettlementTable";
import StatCard from "@/components/admin/StatCard";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import LoadingState from "@/components/ui/LoadingState";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeSettlementsByCompany } from "@/lib/firebase/settlements";
import { formatCurrency } from "@/lib/format";
import type { Settlement } from "@/types";

export default function PartnerSettlementsPage() {
  const { profile } = useAuth();
  const companyId = profile?.companyId ?? "";

  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!companyId) return;
    const unsub = subscribeSettlementsByCompany(
      companyId,
      (list) => {
        setSettlements(list);
        setLoading(false);
      },
      () => {
        setError("Тооцоог ачаалахад алдаа гарлаа.");
        setLoading(false);
      },
    );
    return () => unsub();
  }, [companyId]);

  const totals = useMemo(() => {
    return settlements.reduce(
      (acc, s) => {
        acc.cod += s.codTotal;
        acc.fee += s.deliveryFeeTotal;
        acc.paid += s.paidAmount;
        acc.balance += s.balanceAmount;
        return acc;
      },
      { cod: 0, fee: 0, paid: 0, balance: 0 },
    );
  }, [settlements]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Тооцоо</h1>
      <p className="mt-1 text-sm text-slate-500">COD, хүргэлтийн төлбөр, үлдэгдэл</p>

      {/* Нийт дүнгүүд */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="COD нийт" value={formatCurrency(totals.cod)} icon="💵" accent="navy" />
        <StatCard title="Хүргэлтийн төлбөр" value={formatCurrency(totals.fee)} icon="🚚" accent="orange" />
        <StatCard title="Төлсөн" value={formatCurrency(totals.paid)} icon="✅" accent="green" />
        <StatCard title="Үлдэгдэл" value={formatCurrency(totals.balance)} icon="🧾" accent="amber" />
      </div>

      {error && (
        <div className="mt-4">
          <ErrorState message={error} />
        </div>
      )}

      <div className="mt-5">
        {loading ? (
          <LoadingState />
        ) : settlements.length === 0 ? (
          <EmptyState icon="🧾" title="Одоогоор тооцоо алга" description="Тооцоог админ үүсгэнэ." />
        ) : (
          <PartnerSettlementTable settlements={settlements} />
        )}
      </div>
    </div>
  );
}
