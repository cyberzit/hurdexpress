"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createStaffUser,
  listStaff,
  setStaffActive,
  type StaffListItem,
} from "@/lib/admin-service";
import { mapAuthError } from "@/lib/auth-service";
import type { StaffRole } from "@/types";

const ROLE_LABELS: Record<StaffRole, string> = {
  admin: "Админ",
  partner: "Харилцагч",
  driver: "Жолооч",
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-navy outline-none transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  role: "driver" as StaffRole,
  companyId: "",
};

export default function StaffManager() {
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [staff, setStaff] = useState<StaffListItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    listStaff()
      .then((list) => {
        if (active) setStaff(list);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [refreshKey]);

  const update = useCallback(
    <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
      setForm((f) => ({ ...f, [key]: value })),
    [],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setError("Нэр, имэйл, утас заавал бөглөнө.");
      return;
    }
    if (form.password.length < 6) {
      setError("Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой.");
      return;
    }

    setBusy(true);
    try {
      await createStaffUser({ ...form, isActive: true });
      setSuccess(`${form.name} (${ROLE_LABELS[form.role]}) амжилттай бүртгэгдлээ.`);
      setForm(emptyForm);
      setLoaded(false);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(item: StaffListItem) {
    try {
      await setStaffActive(item.uid, !item.isActive);
      setLoaded(false);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(mapAuthError(err));
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Бүртгэх форм */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
        <h2 className="text-lg font-bold text-navy">Шинэ ажилтан бүртгэх</h2>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}
        {success && (
          <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            {success}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3" noValidate>
          <input
            className={inputClass}
            placeholder="Нэр"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            disabled={busy}
          />
          <input
            className={inputClass}
            type="email"
            placeholder="Имэйл"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            disabled={busy}
          />
          <input
            className={inputClass}
            placeholder="Утас"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            disabled={busy}
          />
          <input
            className={inputClass}
            type="password"
            placeholder="Нууц үг (6+ тэмдэгт)"
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            disabled={busy}
          />
          <select
            className={inputClass}
            value={form.role}
            onChange={(e) => update("role", e.target.value as StaffRole)}
            disabled={busy}
          >
            <option value="driver">Жолооч</option>
            <option value="partner">Харилцагч</option>
            <option value="admin">Админ</option>
          </select>
          <input
            className={inputClass}
            placeholder="Компанийн ID (заавал биш)"
            value={form.companyId}
            onChange={(e) => update("companyId", e.target.value)}
            disabled={busy}
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Бүртгэж байна…" : "Ажилтан бүртгэх"}
          </button>
        </form>
      </section>

      {/* Ажилтны жагсаалт */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-3">
        <h2 className="text-lg font-bold text-navy">
          Ажилтнууд{" "}
          {loaded && <span className="text-sm font-normal text-slate-400">({staff.length})</span>}
        </h2>

        <div className="mt-4 space-y-2">
          {!loaded ? (
            <p className="text-sm text-slate-500">Ачааллаж байна…</p>
          ) : staff.length === 0 ? (
            <p className="rounded-lg bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              Одоогоор ажилтан алга.
            </p>
          ) : (
            staff.map((s) => (
              <div
                key={s.uid}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-navy">{s.name}</p>
                  <p className="truncate text-xs text-slate-500">{s.email}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="rounded-full bg-navy/5 px-2.5 py-1 text-xs font-medium text-navy">
                    {ROLE_LABELS[s.role] ?? s.role}
                  </span>
                  <button
                    onClick={() => toggleActive(s)}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                      s.isActive
                        ? "bg-green-50 text-green-700 hover:bg-green-100"
                        : "bg-red-50 text-red-600 hover:bg-red-100"
                    }`}
                  >
                    {s.isActive ? "Идэвхтэй" : "Идэвхгүй"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
