"use client";

import {
  defaultAdminFilters,
  rangeOf,
  type QuickRange,
  type ReportFilters,
} from "@/lib/adminCompanyReport";
import { ORDER_STATUS_LABELS, type Company, type OrderStatus } from "@/types";

const STATUSES = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];

const QUICK: { key: Exclude<QuickRange, "custom">; label: string }[] = [
  { key: "today", label: "Өнөөдөр" },
  { key: "last7", label: "7 хоног" },
  { key: "thisMonth", label: "Энэ сар" },
  { key: "lastMonth", label: "Өнгөрсөн сар" },
];

const field =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-navy outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";
const label = "mb-1 block text-xs font-medium text-slate-500";

interface Props {
  value: ReportFilters;
  companies: Company[];
  drivers: { id: string; name: string }[];
  onChange: (next: ReportFilters) => void;
}

export default function AdminCompanyReportFilters({
  value,
  companies,
  drivers,
  onChange,
}: Props) {
  function set<K extends keyof ReportFilters>(key: K, v: ReportFilters[K]) {
    onChange({ ...value, [key]: v });
  }

  const activeQuick = QUICK.find((q) => {
    const r = rangeOf(q.key);
    return r.start === value.start && r.end === value.end;
  })?.key;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm print:hidden">
      <div className="flex flex-wrap gap-2">
        {QUICK.map((q) => (
          <button
            key={q.key}
            type="button"
            onClick={() => {
              const r = rangeOf(q.key);
              onChange({ ...value, start: r.start, end: r.end });
            }}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              activeQuick === q.key
                ? "bg-brand text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {q.label}
          </button>
        ))}
        <span
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${
            activeQuick ? "text-slate-400" : "bg-navy text-white"
          }`}
        >
          Custom
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <label className={label}>
            Харилцагч байгууллага <span className="text-red-500">*</span>
          </label>
          <select
            value={value.companyId ?? ""}
            onChange={(e) => set("companyId", e.target.value)}
            className={field}
          >
            <option value="">— Сонгох —</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>
            Эхлэх огноо <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={value.start}
            max={value.end || undefined}
            onChange={(e) => set("start", e.target.value)}
            className={field}
          />
        </div>
        <div>
          <label className={label}>
            Дуусах огноо <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={value.end}
            min={value.start || undefined}
            onChange={(e) => set("end", e.target.value)}
            className={field}
          />
        </div>
        <div>
          <label className={label}>Жолооч</label>
          <select
            value={value.driverId}
            onChange={(e) => set("driverId", e.target.value)}
            className={field}
          >
            <option value="">Бүх жолооч</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Статус</label>
          <select
            value={value.status}
            onChange={(e) => set("status", e.target.value as OrderStatus | "")}
            className={field}
          >
            <option value="">Бүх статус</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Хайх</label>
          <input
            type="search"
            value={value.search}
            onChange={(e) => set("search", e.target.value)}
            placeholder="Хүлээн авагч, утас, хаяг, бараа…"
            className={field}
          />
        </div>
      </div>

      <div className="mt-3">
        <button
          type="button"
          onClick={() => onChange(defaultAdminFilters())}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          ↺ Цэвэрлэх
        </button>
      </div>
    </div>
  );
}
