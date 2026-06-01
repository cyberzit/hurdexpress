"use client";

import type { Company } from "@/types";

interface Props {
  companies: Company[];
  onEdit: (company: Company) => void;
  onToggleActive: (company: Company) => void;
}

export default function CompanyTable({ companies, onEdit, onToggleActive }: Props) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
            <th className="px-4 py-3 font-medium">Нэр</th>
            <th className="px-4 py-3 font-medium">Утас</th>
            <th className="px-4 py-3 font-medium">Хаяг</th>
            <th className="px-4 py-3 font-medium">Гэрээт үнэ</th>
            <th className="px-4 py-3 font-medium">Хариуцсан</th>
            <th className="px-4 py-3 font-medium">Төлөв</th>
            <th className="px-4 py-3 text-right font-medium">Үйлдэл</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((c) => (
            <tr
              key={c.id}
              className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
            >
              <td className="px-4 py-3 font-medium text-navy">{c.name}</td>
              <td className="px-4 py-3 text-slate-600">{c.phone}</td>
              <td className="px-4 py-3 text-slate-600">{c.address || "—"}</td>
              <td className="px-4 py-3 text-slate-600">
                {c.contractPrice.toLocaleString("mn-MN")}₮
              </td>
              <td className="px-4 py-3 text-slate-600">{c.contactPerson || "—"}</td>
              <td className="px-4 py-3">
                <button
                  onClick={() => onToggleActive(c)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                    c.isActive
                      ? "bg-green-50 text-green-700 hover:bg-green-100"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {c.isActive ? "Идэвхтэй" : "Идэвхгүй"}
                </button>
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => onEdit(c)}
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
