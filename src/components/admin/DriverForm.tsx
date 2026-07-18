"use client";

import { useState } from "react";
import {
  addDriverWithLogin,
  createDriverLogin,
  syncDriverUserActive,
  updateDriver,
  type DriverInput,
} from "@/lib/firebase/drivers";
import { sendStaffPasswordReset } from "@/lib/admin-service";
import { mapAuthError } from "@/lib/auth-service";
import { SERVICE_DISTRICTS } from "@/lib/mongoliaLocations";
import {
  DRIVER_STATUS_LABELS,
  VEHICLE_TYPE_LABELS,
  type Driver,
  type DriverStatus,
  type VehicleType,
} from "@/types";

interface Props {
  initial?: Driver | null; // байвал засах горим
  onClose: () => void;
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-navy outline-none transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20";

const labelClass = "text-sm font-medium text-slate-600";

const VEHICLE_TYPES = Object.keys(VEHICLE_TYPE_LABELS) as VehicleType[];
const DRIVER_STATUSES = Object.keys(DRIVER_STATUS_LABELS) as DriverStatus[];

export default function DriverForm({ initial, onClose }: Props) {
  const isEdit = Boolean(initial);
  const hasLogin = Boolean(initial?.authUid);

  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [vehicleType, setVehicleType] = useState<VehicleType | "">(
    initial?.vehicleType ?? "",
  );
  const [plateNumber, setPlateNumber] = useState(initial?.plateNumber ?? "");
  const [currentStatus, setCurrentStatus] = useState<DriverStatus>(
    initial?.currentStatus ?? "available",
  );
  const [serviceDistricts, setServiceDistricts] = useState<string[]>(
    initial?.serviceDistricts ?? [],
  );
  const [bankName, setBankName] = useState(initial?.bankName ?? "");
  const [accountNumber, setAccountNumber] = useState(initial?.accountNumber ?? "");
  const [accountHolder, setAccountHolder] = useState(initial?.accountHolder ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);

  const allSelected = serviceDistricts.length === SERVICE_DISTRICTS.length;

  function toggleDistrict(d: string) {
    setServiceDistricts((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
    );
  }

  function toggleAll() {
    setServiceDistricts(allSelected ? [] : [...SERVICE_DISTRICTS]);
  }

  // Нэвтрэх эрх
  const [loginEmail, setLoginEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCreateLogin, setShowCreateLogin] = useState(false);

  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  function validateBase(): string | null {
    if (!name.trim()) return "Жолоочийн нэр заавал бөглөнө.";
    if (!phone.trim()) return "Утас заавал бөглөнө.";
    if (!vehicleType) return "Тээврийн төрөл сонгоно уу.";
    if (serviceDistricts.length === 0)
      return "Дор хаяж нэг үйлчлэх дүүрэг сонгоно уу.";
    return null;
  }

  function validateLogin(): string | null {
    if (!loginEmail.trim()) return "Нэвтрэх имэйл заавал бөглөнө.";
    if (password.length < 6) return "Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой.";
    if (password !== confirmPassword) return "Нууц үг таарахгүй байна.";
    return null;
  }

  function buildPayload(): DriverInput {
    return {
      name,
      phone,
      email,
      vehicleType: vehicleType as VehicleType,
      plateNumber,
      currentStatus,
      serviceDistricts,
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      // Хоосон бол жолоочийн нэрийг данс эзэмшигчээр авна.
      accountHolder: accountHolder.trim() || name.trim(),
      isActive,
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");

    const baseErr = validateBase();
    if (baseErr) return setError(baseErr);

    setBusy(true);
    try {
      if (isEdit && initial) {
        await updateDriver(initial.id, buildPayload());
        // Идэвхтэй төлвийг холбоотой Auth хэрэглэгчтэй sync.
        if (initial.authUid) await syncDriverUserActive(initial.authUid, isActive);
        onClose();
      } else {
        // Шинэ жолооч — нэвтрэх эрх заавал.
        const loginErr = validateLogin();
        if (loginErr) {
          setBusy(false);
          return setError(loginErr);
        }
        await addDriverWithLogin(buildPayload(), { email: loginEmail, password });
        onClose();
      }
    } catch (err) {
      setError(mapAuthError(err));
      setBusy(false);
    }
  }

  // Edit: authUid байхгүй жолоочид нэвтрэх эрх үүсгэх.
  async function handleCreateLogin() {
    if (!initial) return;
    setError("");
    setInfo("");
    const loginErr = validateLogin();
    if (loginErr) return setError(loginErr);

    setBusy(true);
    try {
      await createDriverLogin(initial.id, { name, phone }, { email: loginEmail, password });
      onClose();
    } catch (err) {
      setError(mapAuthError(err));
      setBusy(false);
    }
  }

  // Edit: нууц үг сэргээх имэйл илгээх.
  async function handleResetPassword() {
    if (!initial?.loginEmail) return;
    setError("");
    setInfo("");
    setBusy(true);
    try {
      await sendStaffPasswordReset(initial.loginEmail);
      setInfo(`Нууц үг сэргээх имэйл ${initial.loginEmail} рүү илгээлээ.`);
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  // Нэвтрэх эрхийн талбарууд (create + edit-create-login дээр дахин ашиглана).
  const loginFields = (
    <>
      <div>
        <label className={labelClass}>Нэвтрэх имэйл *</label>
        <input
          className={inputClass}
          type="email"
          value={loginEmail}
          onChange={(e) => setLoginEmail(e.target.value)}
          placeholder="driver@hurdexpress.mn"
          disabled={busy}
          autoComplete="off"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
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
    </>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-navy">
            {isEdit ? "Жолооч засах" : "Шинэ жолооч нэмэх"}
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
            <label className={labelClass}>Жолоочийн нэр *</label>
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
              <label className={labelClass}>Имэйл (холбоо барих)</label>
              <input
                className={inputClass}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Тээврийн төрөл *</label>
              <select
                className={inputClass}
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                disabled={busy}
              >
                <option value="">— Сонгох —</option>
                {VEHICLE_TYPES.map((v) => (
                  <option key={v} value={v}>
                    {VEHICLE_TYPE_LABELS[v]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Машины дугаар</label>
              <input
                className={inputClass}
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value)}
                disabled={busy}
              />
            </div>
          </div>

          {/* Банкны мэдээлэл — цалин/тооцоо шилжүүлэхэд */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
            <p className="mb-2.5 text-sm font-semibold text-navy">🏦 Банкны мэдээлэл</p>
            <div className="grid gap-3 sm:grid-cols-2">
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
            <div className="mt-3">
              <label className={labelClass}>Данс эзэмшигчийн нэр</label>
              <input
                className={inputClass}
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                placeholder="Хоосон бол жолоочийн нэрийг авна"
                disabled={busy}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Одоогийн төлөв *</label>
            <select
              className={inputClass}
              value={currentStatus}
              onChange={(e) => setCurrentStatus(e.target.value as DriverStatus)}
              disabled={busy}
            >
              {DRIVER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {DRIVER_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>

          {/* Үйлчлэх дүүрэг — multi-select chip */}
          <div>
            <div className="flex items-center justify-between">
              <label className={labelClass}>Үйлчлэх дүүрэг *</label>
              <button
                type="button"
                onClick={toggleAll}
                disabled={busy}
                className="text-xs font-medium text-brand hover:underline"
              >
                {allSelected ? "Бүгдийг арилгах" : "Бүгдийг сонгох"}
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {SERVICE_DISTRICTS.map((d) => {
                const on = serviceDistricts.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDistrict(d)}
                    disabled={busy}
                    aria-pressed={on}
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                      on
                        ? "border-brand bg-brand text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {on ? "✓ " : ""}
                    {d}
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 text-xs text-slate-400">
              Авто-оноолтод эдгээр дүүргийн захиалгыг энэ жолоочид урьдална.
            </p>
          </div>

          {/* Нэвтрэх эрх (Login) */}
          <div className="space-y-4 rounded-xl border border-brand/20 bg-brand/5 p-4">
            <p className="text-sm font-bold text-navy">🔑 Нэвтрэх эрх (Login)</p>

            {!isEdit ? (
              // Шинэ жолооч — заавал
              loginFields
            ) : hasLogin ? (
              // Аль хэдийн Auth-тэй — имэйл харуулж, reset санал болгоно
              <div className="space-y-3">
                <div className="text-sm">
                  <span className="text-slate-500">Нэвтрэх имэйл: </span>
                  <span className="font-mono font-medium text-navy">
                    {initial?.loginEmail}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={busy}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-navy transition hover:bg-slate-50 disabled:opacity-60"
                >
                  📧 Нууц үг сэргээх email илгээх
                </button>
                <p className="text-xs text-slate-400">
                  Нууц үгийг админ харах боломжгүй — зөвхөн Firebase Auth-д хадгалагдана.
                </p>
              </div>
            ) : showCreateLogin ? (
              // Auth байхгүй — шинээр үүсгэх талбарууд
              <div className="space-y-4">
                {loginFields}
                <button
                  type="button"
                  onClick={handleCreateLogin}
                  disabled={busy}
                  className="w-full rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-60"
                >
                  {busy ? "Үүсгэж байна…" : "Нэвтрэх эрх үүсгэх"}
                </button>
              </div>
            ) : (
              // Auth байхгүй — товч
              <div>
                <p className="mb-2 text-sm text-slate-500">
                  Энэ жолоочид нэвтрэх эрх үүсгээгүй байна.
                </p>
                <button
                  type="button"
                  onClick={() => setShowCreateLogin(true)}
                  className="rounded-lg border border-brand bg-white px-3 py-2 text-sm font-semibold text-brand transition hover:bg-brand/5"
                >
                  + Login account үүсгэх
                </button>
              </div>
            )}
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
              {busy ? "Хадгалж байна…" : isEdit ? "Хадгалах" : "Үүсгэх"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
