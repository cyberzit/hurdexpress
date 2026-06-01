"use client";

import {
  DRIVER_STATUS_LABELS,
  VEHICLE_TYPE_LABELS,
  type Driver,
  type DriverStatus,
} from "@/types";

const STATUS_STYLES: Record<DriverStatus, string> = {
  available: "bg-green-50 text-green-700",
  busy: "bg-amber-50 text-amber-700",
  offline: "bg-slate-100 text-slate-500",
};

interface Props {
  drivers: Driver[];
  onEdit: (driver: Driver) => void;
  onToggleActive: (driver: Driver) => void;
}

export default function DriverTable({ drivers, onEdit, onToggleActive }: Props) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
            <th className="px-4 py-3 font-medium">Нэр</th>
            <th className="px-4 py-3 font-medium">Утас</th>
            <th className="px-4 py-3 font-medium">Тээвэр</th>
            <th className="px-4 py-3 font-medium">Дугаар</th>
            <th className="px-4 py-3 font-medium">Төлөв</th>
            <th className="px-4 py-3 font-medium">Идэвх</th>
            <th className="px-4 py-3 text-right font-medium">Үйлдэл</th>
          </tr>
        </thead>
        <tbody>
          {drivers.map((d) => (
            <tr
              key={d.id}
              className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
            >
              <td className="px-4 py-3 font-medium text-navy">{d.name}</td>
              <td className="px-4 py-3 text-slate-600">{d.phone}</td>
              <td className="px-4 py-3 text-slate-600">
                {VEHICLE_TYPE_LABELS[d.vehicleType]}
              </td>
              <td className="px-4 py-3 text-slate-600">{d.plateNumber || "—"}</td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[d.currentStatus]}`}
                >
                  {DRIVER_STATUS_LABELS[d.currentStatus]}
                </span>
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => onToggleActive(d)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                    d.isActive
                      ? "bg-green-50 text-green-700 hover:bg-green-100"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {d.isActive ? "Идэвхтэй" : "Идэвхгүй"}
                </button>
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => onEdit(d)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-navy transition hover:bg-slate-50"
                >
                  Засах
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
