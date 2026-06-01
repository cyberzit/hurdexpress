"use client";

import { useRef, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { formatCurrency } from "@/lib/format";
import {
  importOrders,
  parseWorkbook,
  validateRows,
  type ValidatedRow,
} from "@/lib/importOrders";
import type { Product } from "@/types";

interface Props {
  companyId: string;
  companyName: string;
  products: Product[];
  defaultDeliveryPrice: number;
  createdByUid: string;
}

export default function ExcelImport({
  companyId,
  companyName,
  products,
  defaultDeliveryPrice,
  createdByUid,
}: Props) {
  const [rows, setRows] = useState<ValidatedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState<{ success: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validCount = rows.filter((r) => r.ok).length;
  const errorCount = rows.length - validCount;

  async function handleFile(file: File) {
    setError("");
    setResult(null);
    setFileName(file.name);
    try {
      const raw = await parseWorkbook(file);
      if (raw.length === 0) {
        setError("Файл хоосон байна.");
        setRows([]);
        return;
      }
      setRows(validateRows(raw, products));
    } catch {
      setError("Файл уншихад алдаа гарлаа. .xlsx формат эсэхээ шалгана уу.");
      setRows([]);
    }
  }

  async function handleImport() {
    if (!companyId) return setError("Эхлээд байгууллага сонгоно уу.");
    setImporting(true);
    setProgress({ done: 0, total: validCount });
    try {
      const res = await importOrders(
        rows,
        { companyId, companyName, defaultDeliveryPrice, createdByUid },
        (done, total) => setProgress({ done, total }),
      );
      setResult(res);
      setRows([]);
      setFileName("");
    } catch {
      setError("Импорт хийхэд алдаа гарлаа.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Template + upload */}
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-navy">Excel-ээр захиалга оруулах</p>
            <p className="mt-0.5 text-xs text-slate-500">
              Загвар татаж бөглөөд, .xlsx файлаа upload хийнэ үү.
            </p>
          </div>
          <a
            href="/templates/hurdexpress-orders-template.xlsx"
            download
            className="rounded-xl border border-slate-200 px-4 py-2 text-center text-sm font-medium text-navy transition hover:bg-slate-50"
          >
            ⬇ Загвар татах
          </a>
        </div>

        {/* Drag & drop */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
          onClick={() => inputRef.current?.click()}
          className="mt-4 cursor-pointer rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center transition hover:border-brand"
        >
          <p className="text-3xl">📄</p>
          <p className="mt-2 text-sm text-navy">
            {fileName || "Файлаа энд чирэх эсвэл дарж сонгох"}
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {!companyId && (
          <p className="mt-3 text-sm text-amber-600">Эхлээд байгууллага сонгоно уу.</p>
        )}
      </Card>

      {/* Амжилтын дүн */}
      {result && (
        <Card className="border-green-200 bg-green-50">
          <p className="font-semibold text-green-700">
            ✅ {result.success} захиалга амжилттай үүслээ.
          </p>
        </Card>
      )}

      {/* Preview */}
      {rows.length > 0 && (
        <Card padded={false}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
            <div className="text-sm">
              <span className="font-semibold text-navy">{rows.length} мөр</span>
              <span className="ml-2 text-green-600">✓ {validCount}</span>
              {errorCount > 0 && <span className="ml-2 text-red-600">✗ {errorCount}</span>}
            </div>
            <Button onClick={handleImport} loading={importing} disabled={validCount === 0}>
              {validCount} захиалга импортлох
            </Button>
          </div>

          {importing && (
            <div className="px-4 pt-3">
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-brand transition-all"
                  style={{
                    width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%`,
                  }}
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {progress.done}/{progress.total}
              </p>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-2 font-medium">#</th>
                  <th className="px-4 py-2 font-medium">Хүлээн авагч</th>
                  <th className="px-4 py-2 font-medium">Утас</th>
                  <th className="px-4 py-2 font-medium">Бараа (SKU)</th>
                  <th className="px-4 py-2 font-medium">Тоо</th>
                  <th className="px-4 py-2 font-medium">COD</th>
                  <th className="px-4 py-2 font-medium">Төлөв</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={i}
                    className={`border-b border-slate-100 last:border-0 ${
                      r.ok ? "" : "bg-red-50/50"
                    }`}
                  >
                    <td className="px-4 py-2 text-slate-400">{i + 1}</td>
                    <td className="px-4 py-2 text-navy">{r.receiverName || "—"}</td>
                    <td className="px-4 py-2 text-slate-600">{r.receiverPhone || "—"}</td>
                    <td className="px-4 py-2 text-slate-600">
                      {r.productName || r.productSku || "—"}
                    </td>
                    <td className="px-4 py-2 text-slate-600">{r.qty || "—"}</td>
                    <td className="px-4 py-2 text-slate-600">{formatCurrency(r.codAmount)}</td>
                    <td className="px-4 py-2">
                      {r.ok ? (
                        <span className="text-xs font-medium text-green-600">✓ Зөв</span>
                      ) : (
                        <span className="text-xs font-medium text-red-600">{r.error}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
