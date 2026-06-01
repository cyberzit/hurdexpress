"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { isFirebaseConfigured } from "@/lib/firebase";
import { loginAndLoadUser, mapAuthError, rolePath } from "@/lib/auth-service";

export default function LoginCard() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    const next: { email?: string; password?: string } = {};
    if (!email.trim()) next.email = "Имэйл хаягаа оруулна уу.";
    if (!password.trim()) next.password = "Нууц үгээ оруулна уу.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    if (!isFirebaseConfigured) {
      setFormError("Firebase тохиргоо хийгдээгүй байна. .env.local-оо бөглөнө үү.");
      return;
    }

    setLoading(true);
    try {
      const user = await loginAndLoadUser(email, password);
      router.push(rolePath(user.role));
    } catch (err) {
      setFormError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  const fieldClass =
    "mt-1.5 w-full rounded-xl border bg-slate-50 px-4 py-2.5 text-sm text-navy outline-none transition focus:bg-white focus:ring-2 focus:ring-brand/20";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
      <h2 className="flex items-center gap-2 text-lg font-bold text-navy">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-navy/10 text-navy">
          👤
        </span>
        Харилцагчийн нэвтрэх хэсэг
      </h2>

      {formError && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {formError}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-4 space-y-4" noValidate>
        <div>
          <label className="text-sm font-medium text-slate-600" htmlFor="email">
            Имэйл
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Имэйл"
            disabled={loading}
            className={`${fieldClass} ${
              errors.email ? "border-red-400 focus:border-red-400" : "border-slate-200 focus:border-brand"
            }`}
          />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-600" htmlFor="password">
            Нууц үг
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Нууц үг"
            disabled={loading}
            className={`${fieldClass} ${
              errors.password ? "border-red-400 focus:border-red-400" : "border-slate-200 focus:border-brand"
            }`}
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-600">{errors.password}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-navy px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-navy-light disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Нэвтэрч байна…" : "Нэвтрэх"}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-slate-500">
        Бүртгэлгүй юу?{" "}
        <button type="button" className="font-medium text-brand hover:underline">
          Шинэ харилцагч болох
        </button>
      </p>
    </section>
  );
}
