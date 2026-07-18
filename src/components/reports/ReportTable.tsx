"use client";

import { formatCurrency, formatDateISO } from "@/lib/format";
import {
  driverLabel,
  goodsAmount,
  productLabel,
  type SortDir,
  type SortKey,
} from "@/lib/orderReport";
import { ORDER_STATUS_LABELS, type Order } from "@/types";

interface Props {
  rows: Order[]; // тухайн хуудсанд харагдах мөрүүд
  totalRows: number; // шүүлтүүрт таарсан НИЙТ мөр
  goodsTotal: number; // шүүлтүүрт таарсан бүх мөрийн барааны үнэ
  page: number;
  pageSize: number;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
}

const PAGE_SIZES = [25, 50, 100];

function SortTh({
  label,
  active,
  dir,
  onClick,
  className = "",
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
  className?: string;
}) {
  return (
    <th className={`px-3 py-2.5 font-medium ${className}`}>
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1 transition hover:text-navy ${
          active ? "text-navy" : ""
        }`}
      >
        {label}
        <span className={active ? "" : "text-slate-300"}>
          {active ? (dir === "asc" ? "▲" : "▼") : "↕"}
        </span>
      </button>
    </th>
  );
}

export default function ReportTable({
  rows,
  totalRows,
  goodsTotal,
  page,
  pageSize,
  sortKey,
  sortDir,
  onSort,
  onPage,
  onPageSize,
}: Props) {
  const pageCount = Math.max(1, Math.ceil(totalRows / pageSize));
  const from = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalRows);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Mobile дээр ч мөн хүснэгт — хэвтээ гүйлгэнэ (карт болгож бүтцийг эвдэхгүй). */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
              <th className="px-3 py-2.5 font-medium">№</th>
              <SortTh
                label="Огноо"
                active={sortKey === "date"}
                dir={sortDir}
                onClick={() => onSort("date")}
              />
              <th className="px-3 py-2.5 font-medium">Хүлээн авагч</th>
              <th className="px-3 py-2.5 font-medium">Утас</th>
              <th className="px-3 py-2.5 font-medium">Хаяг</th>
              <th className="px-3 py-2.5 font-medium">Бараа бүтээгдэхүүн</th>
              <th className="px-3 py-2.5 text-right font-medium">Тоо</th>
              <th className="px-3 py-2.5 text-right font-medium">Барааны үнэ</th>
              <SortTh
                label="Жолооч"
                active={sortKey === "driver"}
                dir={sortDir}
                onClick={() => onSort("driver")}
              />
              <SortTh
                label="Статус"
                active={sortKey === "status"}
                dir={sortDir}
                onClick={() => onSort("status")}
              />
              <th className="px-3 py-2.5 font-medium">Хүргэгдсэн огноо</th>
              <th className="px-3 py-2.5 font-medium">Тэмдэглэл</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o, i) => (
              <tr key={o.id} className="border-b border-slate-100 align-top last:border-0">
                <td className="px-3 py-2.5 text-slate-400">{from + i}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">
                  {formatDateISO(o.createdAt)}
                </td>
                <td className="px-3 py-2.5 text-navy">{o.receiverName || "—"}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">
                  {o.receiverPhone || "—"}
                </td>
                {/* Урт хаяг/бараа/тэмдэглэл мөрийг эвдэхгүйгээр wrap хийнэ. */}
                <td className="max-w-[240px] px-3 py-2.5 text-slate-600">
                  <span className="block whitespace-normal break-words">
                    {o.receiverAddress || "—"}
                  </span>
                </td>
                <td className="max-w-[200px] px-3 py-2.5 text-slate-600">
                  <span className="block whitespace-normal break-words">{productLabel(o)}</span>
                </td>
                <td className="px-3 py-2.5 text-right text-slate-600">{o.qty ?? 0}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-right font-medium text-navy">
                  {formatCurrency(goodsAmount(o))}
                </td>
                <td className="px-3 py-2.5 text-slate-600">{driverLabel(o)}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">
                  {ORDER_STATUS_LABELS[o.status] ?? o.status}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">
                  {o.deliveredAt ? formatDateISO(o.deliveredAt) : "—"}
                </td>
                <td className="max-w-[180px] px-3 py-2.5 text-slate-500">
                  <span className="block whitespace-normal break-words">
                    {o.driverNote || o.note || "—"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Хөл — нийт, хүрээ, дүн, хуудаслалт */}
      <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-600">
          <span>
            Нийт <span className="font-semibold text-navy">{totalRows}</span> мөр
          </span>
          <span className="text-slate-400">
            {from}–{to} харагдаж байна
          </span>
          <span>
            Нийт барааны үнэ:{" "}
            <span className="font-semibold text-brand">{formatCurrency(goodsTotal)}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={pageSize}
            onChange={(e) => onPageSize(Number(e.target.value))}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-navy outline-none focus:border-brand"
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>
                {s} мөр
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => onPage(page - 1)}
            disabled={page <= 1}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-navy transition hover:bg-slate-50 disabled:opacity-40"
          >
            ←
          </button>
          <span className="text-sm text-slate-500">
            {page} / {pageCount}
          </span>
          <button
            type="button"
            onClick={() => onPage(page + 1)}
            disabled={page >= pageCount}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-navy transition hover:bg-slate-50 disabled:opacity-40"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
