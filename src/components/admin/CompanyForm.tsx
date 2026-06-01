"use client";

import { useState } from "react";
import {
  addCompany,
  updateCompany,
  type CompanyInput,
} from "@/lib/firebase/companies";
import type { Company } from "@/types";

interface Props {
  initial?: Company | null; // байвал засах горим
  onClose: () => void;
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-navy outline-none transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20";

const labelClass = "text-sm font-medium text-slate-600";

export default function CompanyForm({ initial, onClose }: Props) {
  const isEdit = Boolean(initial);

  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [contactPerson, setContactPerson] = useState(initial?.contactPerson ?? "");
  const [contractPrice, setContractPrice] = useState(
    initial ? String(initial.contractPrice) : "6000",
  );
  const [note, setNote] = useState(initial?.note ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) return setError("Байгууллагын нэр заавал бөглөнө.");
    if (!phone.trim()) return setError("Утас заавал бөглөнө.");
    const price = Number(contractPrice);
    if (!contractPrice.trim() || Number.isNaN(price) || price < 0) {
      return setError("Гэрээт хүргэлтийн үнэ зөв тоо байх ёстой.");
    }

    const payload: CompanyInput = {
      name,
      phone,
      email,
      address,
      contactPerson,
      contractPrice: price,
      note,
      isActive,
    };

    setBusy(true);
    try {
      if (isEdit && initial) {
        await updateCompany(initial.id, payload);
      } else {
        await addCompany(payload);
      }
      onClose();
    } catch {
      setError("Хадгалахад алдаа гарлаа. Дахин оролдоно уу.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
      >
        {/* Толгой */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-navy">
            {isEdit ? "Харилцагч засах" : "Шинэ харилцагч нэмэх"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Хаах"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-navy"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5" noValidate>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <div>
            <label className={labelClass}>Байгууллагын нэр *</label>
            <input
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={busy}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Утас *</label>
              <input
                className={inputClass}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={busy}
              />
            </div>
            <div>
              <label className={labelClass}>Имэйл</label>
              <input
                className={inputClass}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Хаяг</label>
            <input
              className={inputClass}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={busy}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Хариуцсан хүн</label>
              <input
                className={inputClass}
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                disabled={busy}
              />
            </div>
            <div>
              <label className={labelClass}>Гэрээт хүргэлтийн үнэ (₮) *</label>
              <input
                className={inputClass}
                type="number"
                min={0}
                step={100}
                value={contractPrice}
                onChange={(e) => setContractPrice(e.target.value)}
                disabled={busy}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Тэмдэглэл</label>
            <textarea
              className={`${inputClass} min-h-20 resize-y`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={busy}
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              disabled={busy}
              className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/30"
            />
            <span className="text-sm text-navy">Идэвхтэй</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-navy transition hover:bg-slate-50 disabled:opacity-60"
            >
              Болих
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex-1 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-60"
            >
              {busy ? "Хадгалж байна…" : isEdit ? "Хадгалах" : "Нэмэх"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
