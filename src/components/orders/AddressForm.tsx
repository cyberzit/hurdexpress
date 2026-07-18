"use client";


import { PROVINCES, UB_DISTRICTS } from "@/lib/mongoliaLocations";
import type { DeliveryType } from "@/types";

// Бүтэцлэгдсэн хаягийн утга (PartnerOrderForm удирдана).
export interface AddressValue {
  deliveryType: DeliveryType;
  cityDistrict: string;
  cityKhoroo: string;
  street: string;
  building: string;
  entrance: string;
  entranceCode: string;
  addressNote: string;
  province: string;
  soum: string;
  terminalName: string;
  location?: { lat: number; lng: number };
}

export const EMPTY_ADDRESS: AddressValue = {
  deliveryType: "city",
  cityDistrict: "",
  cityKhoroo: "",
  street: "",
  building: "",
  entrance: "",
  entranceCode: "",
  addressNote: "",
  province: "",
  soum: "",
  terminalName: "",
  location: undefined,
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-navy outline-none transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20";

const labelClass = "text-sm font-medium text-slate-600";

interface Props {
  value: AddressValue;
  onChange: (value: AddressValue) => void;
  disabled?: boolean;
}

export default function AddressForm({ value, onChange, disabled }: Props) {
  function set<K extends keyof AddressValue>(key: K, val: AddressValue[K]) {
    onChange({ ...value, [key]: val });
  }

  const isCity = value.deliveryType === "city";

  return (
    <div className="space-y-4">
      {/* Хүргэлтийн бүс — tab toggle */}
      <div>
        <label className={labelClass}>Хүргэлтийн бүс *</label>
        <div className="mt-1.5 grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1">
          {(["city", "province"] as DeliveryType[]).map((t) => {
            const active = value.deliveryType === t;
            return (
              <button
                key={t}
                type="button"
                disabled={disabled}
                onClick={() => set("deliveryType", t)}
                className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                  active
                    ? "bg-brand text-white shadow-sm"
                    : "text-slate-600 hover:text-navy"
                }`}
              >
                {t === "city" ? "Нийслэл" : "Орон нутаг"}
              </button>
            );
          })}
        </div>
      </div>

      {isCity ? (
        <>
          <div>
            <div>
              <label className={labelClass}>Дүүрэг *</label>
              <select
                className={inputClass}
                value={value.cityDistrict}
                onChange={(e) => set("cityDistrict", e.target.value)}
                disabled={disabled}
              >
                <option value="">— Сонгох —</option>
                {UB_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Хаягийн дэлгэрэнгүй *</label>
            <textarea
              className={`${inputClass} min-h-20 resize-y`}
              value={value.addressNote}
              onChange={(e) => set("addressNote", e.target.value)}
              placeholder="Хороо, гудамж, байр, орц, тоот, орцны код, давхар г.м."
              disabled={disabled}
            />
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Аймаг *</label>
              <select
                className={inputClass}
                value={value.province}
                onChange={(e) => set("province", e.target.value)}
                disabled={disabled}
              >
                <option value="">— Сонгох —</option>
                {PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Сум / дүүрэг *</label>
              <input
                className={inputClass}
                value={value.soum}
                onChange={(e) => set("soum", e.target.value)}
                disabled={disabled}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Хүлээн авах унаа / вокзал / терминал *</label>
            <input
              className={inputClass}
              value={value.terminalName}
              onChange={(e) => set("terminalName", e.target.value)}
              placeholder="Жишээ: Драгон төв, Улаанбаатар вокзал"
              disabled={disabled}
            />
          </div>

          <div>
            <label className={labelClass}>Хаягийн нэмэлт тайлбар</label>
            <textarea
              className={`${inputClass} min-h-20 resize-y`}
              value={value.addressNote}
              onChange={(e) => set("addressNote", e.target.value)}
              disabled={disabled}
            />
          </div>

          {/* Орон нутгийн info badge */}
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <span>📦</span>
            <span>
              Энэ захиалгыг <span className="font-semibold">орон нутгийн унаанд</span>{" "}
              тавьж хүргүүлнэ. Газрын зураг шаардлагагүй.
            </span>
          </div>
        </>
      )}
    </div>
  );
}
