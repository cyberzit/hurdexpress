"use client";

import { useRef, useState } from "react";
import {
  downloadTemplate,
  importProducts,
  parseProductWorkbook,
  validateProductRows,
  type ValidatedProductRow,
} from "@/lib/importProducts";
import type { Product } from "@/types";

interface Props {
  companyId: string;
  companyName: string;
  existing: Product[];
  onClose: () => void;
  onDone: (count: number) => void;
}

export default function ProductExcelImport({
  companyId,
  companyName,
  existing,
  onClose,
  onDone,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ValidatedProductRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const okCount = rows.filter((r) => r.ok).length;
  const badCount = rows.length - okCount;

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      const raw = await parseProductWorkbook(file);
      if (raw.length === 0) {
        setError("Файлд бараа олдсонгүй. Загварын дагуу бөглөсөн эсэхээ шалгана уу.");
        setRows([]);
      } else {
        setRows(validateProductRows(raw, existing));
        setFileName(file.name);
      }
    } catch {
      setError("Файл уншихад алдаа гарлаа. .xlsx формат эсэхээ шалгана уу.");
      setRows([]);
    } finally {
      setBusy(false);
    }
  }

  async function handleImport() {
    setBusy(true);
    setError("");
    try {
      const n = await importProducts(rows, { companyId, companyName });
      onDone(n);
      onClose();
    } catch {
      setError("Хадгалахад алдаа гарлаа. Дахин оролдоно уу.");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-bold text-navy">Excel-ээр бараа оруулах</h2>
          <button
            onClick={onClose}
            aria-label="Хаах"
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          {/* 1. Загвар татах */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-navy">1. Загвар татаж авах</p>
            <p className="mt-0.5 text-xs text-slate-500">
              Загварын хүснэгт дээр бараагаа мөр мөрөөр бичээд хадгална уу. Эхний мөр нь
              баганы тайлбар — түүнийг битгий устгаарай.
            </p>
            <button
              type="button"
              onClick={downloadTemplate}
              className="mt-2.5 rounded-xl border border-navy px-4 py-2 text-sm font-semibold text-navy transition hover:bg-navy hover:text-white"
            >
              ⬇ Excel загвар татах
            </button>
          </div>

          {/* 2. Файл сонгох */}
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-sm font-semibold text-navy">2. Бөглөсөн файлаа оруулах</p>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              disabled={busy}
              onChange={(e) => handleFile(e.target.files?.[0])}
              className="mt-2.5 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-dark"
            />
            {fileName && <p className="mt-2 text-xs text-slate-500">📄 {fileName}</p>}
          </div>

          {/* 3. Урьдчилан харах */}
          {rows.length > 0 && (
            <div>
              <div className="mb-2 flex flex-wrap gap-2 text-sm">
                <span className="rounded-lg bg-green-50 px-3 py-1 font-semibold text-green-700">
                  Зөв: {okCount}
                </span>
                {badCount > 0 && (
                  <span className="rounded-lg bg-red-50 px-3 py-1 font-semibold text-red-600">
                    Алдаатай: {badCount}
                  </span>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="sticky top-0 bg-slate-50">
                    <tr className="border-b border-slate-200 text-xs uppercase text-slate-400">
                      <th className="px-3 py-2 font-medium">Нэр</th>
                      <th className="px-3 py-2 font-medium">Үнэ</th>
                      <th className="px-3 py-2 font-medium">Төлөв</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr
                        key={i}
                        className={`border-b border-slate-100 last:border-0 ${
                          r.ok ? "" : "bg-red-50"
                        }`}
                      >
                        <td className="px-3 py-2 text-navy">{r.name || "—"}</td>
                        <td className="px-3 py-2 text-slate-600">
                          {r.price.toLocaleString("mn-MN")}₮
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {r.ok ? (
                            <span className="text-green-700">✓ Зөв</span>
                          ) : (
                            <span className="text-red-600">{r.error}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {badCount > 0 && (
                <p className="mt-2 text-xs text-slate-500">
                  Алдаатай мөрүүд алгасагдана — зөвхөн {okCount} бараа хадгалагдана.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-navy transition hover:bg-slate-50 disabled:opacity-60"
          >
            Болих
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={busy || okCount === 0}
            className="flex-1 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-50"
          >
            {busy ? "Хадгалж байна…" : `${okCount} бараа оруулах`}
          </button>
        </div>
      </div>
    </div>
  );
}
