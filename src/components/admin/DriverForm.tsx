"use client";

import { useState } from "react";
import { addDriver, updateDriver, type DriverInput } from "@/lib/firebase/drivers";
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
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) return setError("Жолоочийн нэр заавал бөглөнө.");
    if (!phone.trim()) return setError("Утас заавал бөглөнө.");
    if (!vehicleType) return setError("Тээврийн төрөл сонгоно уу.");
    if (!currentStatus) return setError("Одоогийн төлөв сонгоно уу.");

    const payload: DriverInput = {
      name,
      phone,
      email,
      vehicleType,
      plateNumber,
      currentStatus,
      isActive,
    };

    setBusy(true);
    try {
      if (isEdit && initial) {
        await updateDriver(initial.id, payload);
      } else {
        await addDriver(payload);
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
