"use client";

import { ORDER_STATUS_LABELS, type Company, type Driver, type OrderStatus } from "@/types";
import type { DateRangeKey } from "@/lib/reports";

const RANGE_OPTIONS: { key: DateRangeKey; label: string }[] = [
  { key: "today", label: "Өнөөдөр" },
  { key: "7d", label: "7 хоног" },
  { key: "month", label: "Энэ сар" },
  { key: "custom", label: "Custom" },
];

const STATUSES = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];

const selectClass =
  "rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-navy outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

interface Props {
  rangeKey: DateRangeKey;
  setRangeKey: (k: DateRangeKey) => void;
  customStart: string;
  setCustomStart: (v: string) => void;
  customEnd: string;
  setCustomEnd: (v: string) => void;
  companies: Company[];
  companyId: string;
  setCompanyId: (v: string) => void;
  drivers: Driver[];
  driverId: string;
  setDriverId: (v: string) => void;
  status: OrderStatus | "";
  setStatus: (v: OrderStatus | "") => void;
}

export default function ReportFilters(props: Props) {
  return (
    <div className="space-y-3">
      {/* Огнооны муж */}
      <div className="flex flex-wrap gap-2">
        {RANGE_OPTIONS.map((o) => (
          <button
            key={o.key}
            onClick={() => props.setRangeKey(o.key)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              props.rangeKey === o.key
                ? "bg-navy text-white"
                : "border border-slate-200 bg-white text-slate-500"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {props.rangeKey === "custom" && (
        <div className="flex flex-wrap gap-2">
          <input
            type="date"
            value={props.customStart}
            onChange={(e) => props.setCustomStart(e.target.value)}
            className={selectClass}
          />
          <input
            type="date"
            value={props.customEnd}
            onChange={(e) => props.setCustomEnd(e.target.value)}
            className={selectClass}
          />
        </div>
      )}

      {/* Бусад filter */}
      <div className="grid gap-2 sm:grid-cols-3">
        <select
          value={props.companyId}
          onChange={(e) => props.setCompanyId(e.target.value)}
          className={selectClass}
        >
          <option value="">Бүх байгууллага</option>
          {props.companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={props.driverId}
          onChange={(e) => props.setDriverId(e.target.value)}
          className={selectClass}
        >
          <option value="">Бүх жолооч</option>
          {props.drivers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <select
          value={props.status}
          onChange={(e) => props.setStatus(e.target.value as OrderStatus | "")}
          className={selectClass}
        >
          <option value="">Бүх статус</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
