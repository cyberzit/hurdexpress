"use client";

import { useEffect, useRef, useState } from "react";
import {
  DEFAULT_SETTINGS,
  getSmsApiKey,
  saveSettings,
  saveSmsApiKey,
  subscribeSettings,
  type SettingsInput,
} from "@/lib/settings";
import { uploadLogo } from "@/lib/imageUpload";
import ImageUpload, { type ImageUploadState } from "@/components/ui/ImageUpload";
import type { DriverSalaryMode, SmsProvider } from "@/types";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-navy outline-none transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20";
const labelClass = "text-sm font-medium text-slate-600";

interface Toast {
  type: "success" | "error";
  message: string;
}

export default function SettingsForm() {
  const [form, setForm] = useState<SettingsInput>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<Toast | null>(null);
  const [smsApiKey, setSmsApiKey] = useState("");
  const [logo, setLogo] = useState<ImageUploadState>({ file: null, cleared: false });
  const [logoProgress, setLogoProgress] = useState<number | null>(null);
  const hydrated = useRef(false);

  // Realtime унших — анх ачаалахад л форм утгыг суулгана (edit-г дарахгүй).
  useEffect(() => {
    const unsub = subscribeSettings(
      (settings) => {
        if (!hydrated.current) {
          if (settings) {
            setForm({
              companyName: settings.companyName,
              brandName: settings.brandName,
              aboutText: settings.aboutText,
              phone: settings.phone,
              email: settings.email ?? "",
              address: settings.address ?? "",
              defaultDeliveryPrice: settings.defaultDeliveryPrice,
              zoneName: settings.zoneName,
              logoUrl: settings.logoUrl ?? "",
              primaryColor: settings.primaryColor ?? "#f97316",
              codEnabled: settings.codEnabled,
              trackingEnabled: settings.trackingEnabled,
              autoAssignEnabled: settings.autoAssignEnabled,
              driverSalaryMode: settings.driverSalaryMode,
              baseSalary: settings.baseSalary ?? 0,
              perDeliveryAmount: settings.perDeliveryAmount ?? 0,
              bonusThreshold: settings.bonusThreshold ?? 0,
              bonusAmount: settings.bonusAmount ?? 0,
              smsEnabled: settings.smsEnabled,
              smsProvider: settings.smsProvider,
              smsApiUrl: settings.smsApiUrl ?? "",
            });
          }
          hydrated.current = true;
        }
        setLoading(false);
      },
      () => setLoading(false),
    );
    // API key-г тусад нь (admin-only doc) уншина.
    getSmsApiKey()
      .then((k) => setSmsApiKey(k))
      .catch(() => {});
    return () => unsub();
  }, []);

  // Toast автомат арилгах.
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  function update<K extends keyof SettingsInput>(key: K, value: SettingsInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.brandName.trim()) return setError("Брэнд нэр заавал бөглөнө.");
    if (!form.phone.trim()) return setError("Утас заавал бөглөнө.");
    if (
      Number.isNaN(form.defaultDeliveryPrice) ||
      form.defaultDeliveryPrice < 0
    ) {
      return setError("Үндсэн хүргэлтийн үнэ зөв тоо байх ёстой.");
    }

    setSaving(true);
    try {
      // Лого — шинэ файл бол upload, устгасан бол хоосон.
      let logoUrl = form.logoUrl ?? "";
      if (logo.file) {
        setLogoProgress(0);
        logoUrl = await uploadLogo(logo.file, setLogoProgress);
      } else if (logo.cleared) {
        logoUrl = "";
      }

      await saveSettings({ ...form, logoUrl });
      // SMS API key — тусдаа admin-only doc-д.
      await saveSmsApiKey(smsApiKey);
      setLogoProgress(null);
      setToast({ type: "success", message: "Тохиргоо хадгалагдлаа." });
    } catch {
      setToast({ type: "error", message: "Хадгалахад алдаа гарлаа." });
      setLogoProgress(null);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-16 text-sm text-slate-500 shadow-sm">
        <span className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-brand" />
        Ачааллаж байна…
      </div>
    );
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="max-w-2xl space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        noValidate
      >
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Компанийн нэр</label>
            <input
              className={inputClass}
              value={form.companyName}
              onChange={(e) => update("companyName", e.target.value)}
              disabled={saving}
            />
          </div>
          <div>
            <label className={labelClass}>Брэнд нэр *</label>
            <input
              className={inputClass}
              value={form.brandName}
              onChange={(e) => update("brandName", e.target.value)}
              disabled={saving}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Нүүр хуудасны &quot;Бидний тухай&quot; текст</label>
          <textarea
            className={`${inputClass} min-h-32 resize-y`}
            value={form.aboutText}
            onChange={(e) => update("aboutText", e.target.value)}
            disabled={saving}
          />
          <p className="mt-1 text-xs text-slate-400">
            Нэвтрэх (нүүр) хуудасны танилцуулга текст. Хадгалмагц шууд шинэчлэгдэнэ.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Утас *</label>
            <input
              className={inputClass}
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              disabled={saving}
            />
          </div>
          <div>
            <label className={labelClass}>Имэйл</label>
            <input
              className={inputClass}
              type="email"
              value={form.email ?? ""}
              onChange={(e) => update("email", e.target.value)}
              disabled={saving}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Хаяг</label>
          <input
            className={inputClass}
            value={form.address ?? ""}
            onChange={(e) => update("address", e.target.value)}
            disabled={saving}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Үндсэн хүргэлтийн үнэ (₮) *</label>
            <input
              className={inputClass}
              type="number"
              min={0}
              step={100}
              value={form.defaultDeliveryPrice}
              onChange={(e) =>
                update("defaultDeliveryPrice", Number(e.target.value))
              }
              disabled={saving}
            />
          </div>
          <div>
            <label className={labelClass}>Бүсийн нэр</label>
            <input
              className={inputClass}
              value={form.zoneName}
              onChange={(e) => update("zoneName", e.target.value)}
              disabled={saving}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Лого</label>
            <div className="mt-1.5">
              <ImageUpload
                existingUrl={form.logoUrl || undefined}
                onChange={setLogo}
                disabled={saving}
                progress={logoProgress}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Primary өнгө</label>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                type="color"
                value={form.primaryColor ?? "#f97316"}
                onChange={(e) => update("primaryColor", e.target.value)}
                disabled={saving}
                className="h-10 w-12 cursor-pointer rounded-lg border border-slate-200"
              />
              <input
                className={inputClass}
                value={form.primaryColor ?? ""}
                onChange={(e) => update("primaryColor", e.target.value)}
                placeholder="#f97316"
                disabled={saving}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={form.codEnabled}
              onChange={(e) => update("codEnabled", e.target.checked)}
              disabled={saving}
              className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/30"
            />
            <span className="text-sm text-navy">COD (хүргэлтэд төлөх) идэвхтэй</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={form.trackingEnabled}
              onChange={(e) => update("trackingEnabled", e.target.checked)}
              disabled={saving}
              className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/30"
            />
            <span className="text-sm text-navy">Төлөв шалгах (tracking) идэвхтэй</span>
          </label>
        </div>

        {/* Auto-dispatch */}
        <div className="rounded-xl border border-slate-200 p-4">
          <label className="flex cursor-pointer items-start gap-2.5">
            <input
              type="checkbox"
              checked={form.autoAssignEnabled}
              onChange={(e) => update("autoAssignEnabled", e.target.checked)}
              disabled={saving}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/30"
            />
            <span>
              <span className="text-sm font-medium text-navy">
                🤖 Авто-оноолт (auto dispatch) идэвхтэй
              </span>
              <span className="mt-0.5 block text-xs text-slate-400">
                Шинэ захиалга орж ирэхэд хамгийн боломжит жолоочид автоматаар оноогдоно.
                Admin хүссэн үедээ гараар дахин оноож (override) болно.
              </span>
            </span>
          </label>
        </div>

        {/* Жолоочийн цалин */}
        <div className="space-y-4 rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-bold text-navy">💵 Жолоочийн цалин</h3>

          <div>
            <label className={labelClass}>Тооцооны горим</label>
            <select
              className={inputClass}
              value={form.driverSalaryMode}
              onChange={(e) => update("driverSalaryMode", e.target.value as DriverSalaryMode)}
              disabled={saving}
            >
              <option value="per_delivery">Хүргэлт тутамд</option>
              <option value="fixed">Тогтмол (суурь) цалин</option>
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {form.driverSalaryMode === "fixed" ? (
              <div>
                <label className={labelClass}>Суурь цалин (₮)</label>
                <input
                  className={inputClass}
                  type="number"
                  min={0}
                  step={1000}
                  value={form.baseSalary ?? 0}
                  onChange={(e) => update("baseSalary", Number(e.target.value))}
                  disabled={saving}
                />
              </div>
            ) : (
              <div>
                <label className={labelClass}>Нэг хүргэлтийн дүн (₮)</label>
                <input
                  className={inputClass}
                  type="number"
                  min={0}
                  step={100}
                  value={form.perDeliveryAmount ?? 0}
                  onChange={(e) => update("perDeliveryAmount", Number(e.target.value))}
                  disabled={saving}
                />
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Bonus авах хүргэлтийн доод тоо</label>
              <input
                className={inputClass}
                type="number"
                min={0}
                value={form.bonusThreshold ?? 0}
                onChange={(e) => update("bonusThreshold", Number(e.target.value))}
                disabled={saving}
                placeholder="0 = bonus байхгүй"
              />
            </div>
            <div>
              <label className={labelClass}>Bonus дүн (₮)</label>
              <input
                className={inputClass}
                type="number"
                min={0}
                step={1000}
                value={form.bonusAmount ?? 0}
                onChange={(e) => update("bonusAmount", Number(e.target.value))}
                disabled={saving}
              />
            </div>
          </div>
          <p className="text-xs text-slate-400">
            Хүргэлтийн тоо bonus-ийн доод тооноос хүрвэл цалин дээр bonus нэмэгдэнэ.
          </p>
        </div>

        {/* SMS notification */}
        <div className="space-y-4 rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-bold text-navy">SMS мэдэгдэл</h3>

          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={form.smsEnabled}
              onChange={(e) => update("smsEnabled", e.target.checked)}
              disabled={saving}
              className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/30"
            />
            <span className="text-sm text-navy">SMS илгээх идэвхтэй</span>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Провайдер</label>
              <select
                className={inputClass}
                value={form.smsProvider}
                onChange={(e) => update("smsProvider", e.target.value as SmsProvider)}
                disabled={saving}
              >
                <option value="mock">Mock (console)</option>
                <option value="custom">Custom API</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>API URL</label>
              <input
                className={inputClass}
                value={form.smsApiUrl ?? ""}
                onChange={(e) => update("smsApiUrl", e.target.value)}
                placeholder="https://sms.provider.mn/send"
                disabled={saving}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>API Key</label>
            <input
              className={inputClass}
              type="password"
              value={smsApiKey}
              onChange={(e) => setSmsApiKey(e.target.value)}
              placeholder="••••••••"
              disabled={saving}
              autoComplete="off"
            />
            <p className="mt-1 text-xs text-slate-400">
              Зөвхөн серверийн (Functions) талд ашиглагдана. Хэрэглэгчид ил харагдахгүй.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-60"
        >
          {saving ? "Хадгалж байна…" : "Хадгалах"}
        </button>
      </form>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl px-5 py-3 text-sm font-medium text-white shadow-lg ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.message}
        </div>
      )}
    </>
  );
}
