"use client";

import { useState } from "react";
import {
  createCompanyWithPartner,
  updateCompany,
  type CompanyInput,
} from "@/lib/firebase/companies";
import { mapAuthError } from "@/lib/auth-service";
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
  const [bankName, setBankName] = useState(initial?.bankName ?? "");
  const [accountNumber, setAccountNumber] = useState(initial?.accountNumber ?? "");
  const [accountHolder, setAccountHolder] = useState(initial?.accountHolder ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);

  // Партнер менежер (зөвхөн шинээр үүсгэх үед).
  const [managerName, setManagerName] = useState("");
  const [managerEmail, setManagerEmail] = useState("");
  const [managerPhone, setManagerPhone] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  // Амжилттай үүссэн партнерийн нэвтрэх мэдээлэл (success modal).
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);
  const [showPw, setShowPw] = useState(false);

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
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      accountHolder: accountHolder.trim() || name.trim(),
      isActive,
    };

    // Шинээр үүсгэх үед — партнер менежерийн талбар шалгана.
    if (!isEdit) {
      if (!managerName.trim()) return setError("Менежерийн нэр заавал бөглөнө.");
      if (!managerEmail.trim()) return setError("Менежерийн имэйл заавал бөглөнө.");
      if (!managerPhone.trim()) return setError("Менежерийн утас заавал бөглөнө.");
      if (password.length < 6) return setError("Нууц үг хамгийн багадаа 6 тэмдэгт.");
    }

    setBusy(true);
    try {
      if (isEdit && initial) {
        await updateCompany(initial.id, payload);
        onClose();
      } else {
        await createCompanyWithPartner(payload, {
          name: managerName,
          email: managerEmail,
          phone: managerPhone,
          password,
        });
        // Form-ыг хаахгүй — нэвтрэх мэдээллийг success modal-аар харуулна.
        setCreated({ email: managerEmail.trim(), password });
      }
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  // ── Success modal — партнерийн нэвтрэх мэдээлэл ──
  if (created) {
    const credentialText = `Имэйл: ${created.email}\nНууц үг: ${created.password}`;
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
        <div className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl">
              ✓
            </div>
            <h2 className="mt-3 text-lg font-bold text-navy">Харилцагч үүсгэгдлээ</h2>
            <p className="mt-1 text-sm text-slate-500">
              «{name}» болон партнер хэрэглэгч амжилттай бүртгэгдлээ.
            </p>
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Нэвтрэх мэдээлэл
            </p>
            <div className="mt-2 space-y-1.5 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500">Имэйл</span>
                <span className="font-mono font-medium text-navy">{created.email}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500">Нууц үг</span>
                <span className="font-mono font-medium text-navy">
                  {showPw ? created.password : "•".repeat(created.password.length)}
                </span>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setShowPw((v) => !v)}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-navy transition hover:bg-white"
              >
                {showPw ? "Нуух" : "Харах"}
              </button>
              <button
                onClick={() => navigator.clipboard?.writeText(credentialText).catch(() => {})}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-navy transition hover:bg-white"
              >
                Хуулах
              </button>
            </div>
          </div>

          <p className="mt-3 text-xs text-slate-400">
            ⚠️ Энэ мэдээллийг харилцагчид дамжуулна уу. Нууц үг дахин харагдахгүй.
          </p>

          <button
            onClick={onClose}
            className="mt-4 w-full rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
          >
            Хаах
          </button>
        </div>
      </div>
    );
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

          {/* Банкны мэдээлэл — тооцоо шилжүүлэхэд */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <p className="mb-3 text-sm font-semibold text-navy">🏦 Банкны мэдээлэл</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Банкны нэр</label>
                <input
                  className={inputClass}
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Жишээ: Хаан банк"
                  disabled={busy}
                />
              </div>
              <div>
                <label className={labelClass}>Дансны дугаар</label>
                <input
                  className={inputClass}
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  inputMode="numeric"
                  disabled={busy}
                />
              </div>
            </div>
            <div className="mt-4">
              <label className={labelClass}>Данс эзэмшигчийн нэр</label>
              <input
                className={inputClass}
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                placeholder="Хоосон бол байгууллагын нэрийг авна"
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

          {/* Партнер хэрэглэгч — зөвхөн шинээр үүсгэх үед */}
          {!isEdit ? (
            <div className="space-y-4 rounded-xl border border-brand/20 bg-brand/5 p-4">
              <p className="text-sm font-bold text-navy">
                👤 Партнер хэрэглэгч (нэвтрэх эрх)
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Менежерийн нэр *</label>
                  <input
                    className={inputClass}
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    disabled={busy}
                  />
                </div>
                <div>
                  <label className={labelClass}>Менежерийн утас *</label>
                  <input
                    className={inputClass}
                    value={managerPhone}
                    onChange={(e) => setManagerPhone(e.target.value)}
                    disabled={busy}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Имэйл (нэвтрэх) *</label>
                <input
                  className={inputClass}
                  type="email"
                  value={managerEmail}
                  onChange={(e) => setManagerEmail(e.target.value)}
                  placeholder="partner@company.mn"
                  disabled={busy}
                  autoComplete="off"
                />
              </div>
              <div>
                <label className={labelClass}>Нууц үг (6+ тэмдэгт) *</label>
                <input
                  className={inputClass}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={busy}
                  autoComplete="new-password"
                />
              </div>
            </div>
          ) : (
            (initial?.managerEmail || initial?.managerName) && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Партнер хэрэглэгч
                </p>
                <p className="mt-1 text-navy">{initial?.managerName}</p>
                <p className="font-mono text-xs text-slate-500">{initial?.managerEmail}</p>
                <p className="mt-1 text-xs text-slate-400">
                  Нэвтрэх эрхийг «Хэрэглэгчид» хэсгээс удирдана. Нууц үг энд харагдахгүй.
                </p>
              </div>
            )
          )}

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
              {busy ? "Хадгалж байна…" : isEdit ? "Хадгалах" : "Үүсгэх"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
