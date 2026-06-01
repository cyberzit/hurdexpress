"use client";

import { useState } from "react";
import { createStaffUser, sendStaffPasswordReset } from "@/lib/admin-service";
import { updateAdminUser } from "@/lib/firebase/users";
import { mapAuthError } from "@/lib/auth-service";
import type { User } from "@/types";

interface Props {
  initial?: User | null; // байвал засах горим
  onClose: () => void;
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-navy outline-none transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20";

const labelClass = "text-sm font-medium text-slate-600";

export default function UserForm({ initial, onClose }: Props) {
  const isEdit = Boolean(initial);

  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);

  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!name.trim()) return setError("Нэр заавал бөглөнө.");
    if (!email.trim()) return setError("Имэйл заавал бөглөнө.");
    if (!phone.trim()) return setError("Утас заавал бөглөнө.");

    setBusy(true);
    try {
      if (isEdit && initial) {
        await updateAdminUser(initial.uid, { name, email, phone, isActive });
        onClose();
      } else {
        if (password.length < 6) {
          setBusy(false);
          return setError("Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой.");
        }
        if (password !== confirmPassword) {
          setBusy(false);
          return setError("Нууц үг таарахгүй байна.");
        }
        // Firebase Auth user + users/{uid} (role:"admin") — UID автоматаар.
        await createStaffUser({
          name,
          email,
          phone,
          password,
          role: "admin",
          isActive,
        });
        onClose();
      }
    } catch (err) {
      setError(mapAuthError(err));
      setBusy(false);
    }
  }

  async function handleResetPassword() {
    if (!initial?.email) return;
    setError("");
    setInfo("");
    setBusy(true);
    try {
      await sendStaffPasswordReset(initial.email);
      setInfo(`Нууц үг сэргээх имэйл ${initial.email} рүү илгээлээ.`);
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-navy">
            {isEdit ? "Админ засах" : "Шинэ админ"}
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
          {info && (
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{info}</p>
          )}

          <div>
            <label className={labelClass}>Нэр *</label>
            <input
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={busy}
            />
          </div>

          <div>
            <label className={labelClass}>Имэйл *</label>
            <input
              className={inputClass}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@hurdexpress.mn"
              disabled={busy}
              autoComplete="off"
            />
          </div>

          <div>
            <label className={labelClass}>Утас *</label>
            <input
              className={inputClass}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={busy}
            />
          </div>

          {/* Нууц үг — зөвхөн шинэ админ үүсгэх үед */}
          {!isEdit && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Нууц үг (6+) *</label>
                <input
                  className={inputClass}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={busy}
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className={labelClass}>Нууц үг давтах *</label>
                <input
                  className={inputClass}
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={busy}
                  autoComplete="new-password"
                />
              </div>
            </div>
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

          {/* Edit — нууц үг сэргээх */}
          {isEdit && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-slate-500">
                Нууц үгийг админ харах боломжгүй — зөвхөн сэргээх имэйл илгээнэ.
              </p>
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={busy}
                className="mt-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-navy transition hover:bg-slate-50 disabled:opacity-60"
              >
                📧 Нууц үг сэргээх email илгээх
              </button>
            </div>
          )}

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
