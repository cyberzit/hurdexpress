"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ErrorState from "@/components/ui/ErrorState";
import { fieldClass } from "@/components/ui/Input";
import { createSettlement } from "@/lib/firebase/settlements";
import type { Company } from "@/types";

export default function SettlementForm({ companies }: { companies: Company[] }) {
  const [companyId, setCompanyId] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setOk("");
    if (!companyId) return setError("Байгууллага сонгоно уу.");
    if (!start || !end) return setError("Хугацааны эхлэл/төгсгөлийг сонгоно уу.");

    const company = companies.find((c) => c.id === companyId);
    setBusy(true);
    try {
      await createSettlement({
        companyId,
        companyName: company?.name ?? "",
        periodStart: new Date(`${start}T00:00:00`),
        periodEnd: new Date(`${end}T23:59:59`),
      });
      setOk("Тооцоо (ноорог) үүслээ.");
      setStart("");
      setEnd("");
      setCompanyId("");
    } catch {
      setError("Тооцоо үүсгэхэд алдаа гарлаа.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="max-w-2xl">
      <h2 className="text-lg font-bold text-navy">Шинэ тооцоо үүсгэх</h2>
      <p className="mt-1 text-sm text-slate-500">
        Сонгосон хугацааны хүргэгдсэн захиалга дээр үндэслэнэ.
      </p>

      {error && <div className="mt-3"><ErrorState message={error} /></div>}
      {ok && (
        <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{ok}</p>
      )}

      <form onSubmit={handleSubmit} className="mt-4 space-y-4" noValidate>
        <div>
          <label className="text-sm font-medium text-slate-600">Байгууллага</label>
          <select
            className={`mt-1.5 border-slate-200 focus:border-brand ${fieldClass}`}
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            disabled={busy}
          >
            <option value="">— Сонгох —</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-600">Эхлэх огноо</label>
            <input
              type="date"
              className={`mt-1.5 border-slate-200 focus:border-brand ${fieldClass}`}
              value={start}
              onChange={(e) => setStart(e.target.value)}
              disabled={busy}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600">Дуусах огноо</label>
            <input
              type="date"
              className={`mt-1.5 border-slate-200 focus:border-brand ${fieldClass}`}
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              disabled={busy}
            />
          </div>
        </div>

        <Button type="submit" loading={busy}>
          Тооцоо үүсгэх
        </Button>
      </form>
    </Card>
  );
}
