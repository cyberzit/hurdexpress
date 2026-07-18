"use client";

import { formatCurrency, formatDate } from "@/lib/format";
import type { SettlementDayRow } from "@/lib/firebase/driverSettlement";
import type { Driver, DriverSettlement } from "@/types";

interface Props {
  rows: SettlementDayRow[];
  savedByKey: Map<string, DriverSettlement>;
  driver?: Driver | null;
  // editable=true үед admin чек/тайлбар засна. Жолоочид зөвхөн харагдана.
  editable?: boolean;
  busyKey?: string;
  onToggle?: (dateKey: string, next: boolean) => void;
  onNote?: (dateKey: string, note: string) => void;
}

export default function SettlementReport({
  rows,
  savedByKey,
  driver,
  editable = false,
  busyKey,
  onToggle,
  onNote,
}: Props) {
  const totals = rows.reduce(
    (acc, r) => {
      acc.cod += r.codTotal;
      acc.cash += r.cashTotal;
      acc.transfer += r.transferTotal;
      acc.delivery += r.deliveryTotal;
      acc.payable += r.payable;
      return acc;
    },
    { cod: 0, cash: 0, transfer: 0, delivery: 0, payable: 0 },
  );

  return (
    <>
      {/* Хураангуй */}
      <div className="space-y-1 text-sm text-navy">
        <p>
          Нийт: <span className="font-bold">{formatCurrency(totals.cod)}</span>
        </p>
        <p>
          Тушаах дүн (авсан − цалин):{" "}
          <span className="font-bold">{formatCurrency(totals.payable)}</span>
        </p>
        <p>
          Цалин: <span className="font-bold">{formatCurrency(totals.delivery)}</span>
        </p>
        {driver && (
          <p className="flex flex-wrap gap-x-6 gap-y-1 pt-1 text-slate-600">
            <span>
              Банк: <span className="font-semibold text-navy">{driver.bankName || "—"}</span>
            </span>
            <span>
              Дансны дугаар:{" "}
              <span className="font-semibold text-navy">{driver.accountNumber || "—"}</span>
            </span>
            <span>
              Эзэмшигчийн нэр:{" "}
              <span className="font-semibold text-navy">
                {driver.accountHolder || driver.name} {driver.phone}
              </span>
            </span>
          </p>
        )}
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-slate-300">
        <table className="w-full min-w-[1080px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-300 bg-slate-100 text-left">
              <th className="border-r border-slate-300 px-2 py-2 font-semibold">№</th>
              <th className="border-r border-slate-300 px-3 py-2 font-semibold">Огноо</th>
              <th className="border-r border-slate-300 px-3 py-2 text-right font-semibold">
                Нийт
              </th>
              <th className="border-r border-slate-300 px-3 py-2 text-right font-semibold">
                Бэлнээр
              </th>
              <th className="border-r border-slate-300 px-3 py-2 text-right font-semibold">
                Шилжүүлсэн
              </th>
              <th className="border-r border-slate-300 px-3 py-2 text-right font-semibold">
                Хүргэлт
              </th>
              <th className="border-r border-slate-300 px-3 py-2 text-right font-semibold">
                Тооцоо нийлэх дүн
              </th>
              <th className="border-r border-slate-300 px-3 py-2 font-semibold">
                Тооцоо нийлсэн эсэх
              </th>
              <th className="px-3 py-2 font-semibold">Тайлбар</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const rec = savedByKey.get(r.dateKey);
              const done = rec?.reconciled ?? false;
              return (
                <tr
                  key={r.dateKey}
                  className={`border-b border-slate-200 last:border-0 ${
                    done ? "bg-emerald-200/60" : ""
                  }`}
                >
                  <td className="border-r border-slate-200 px-2 py-2 text-slate-500">{i + 1}</td>
                  <td className="border-r border-slate-200 whitespace-nowrap px-3 py-2">
                    {formatDate(r.dateMs)}
                  </td>
                  <td className="border-r border-slate-200 px-3 py-2 text-right font-medium">
                    {r.codTotal.toLocaleString("mn-MN")}
                  </td>
                  <td className="border-r border-slate-200 px-3 py-2 text-right text-green-700">
                    {r.cashTotal.toLocaleString("mn-MN")}
                  </td>
                  <td className="border-r border-slate-200 px-3 py-2 text-right text-blue-700">
                    {r.transferTotal.toLocaleString("mn-MN")}
                  </td>
                  <td className="border-r border-slate-200 px-3 py-2 text-right">
                    {r.deliveryTotal.toLocaleString("mn-MN")}
                  </td>
                  <td className="border-r border-slate-200 px-3 py-2 text-right font-semibold">
                    {r.payable.toLocaleString("mn-MN")}
                  </td>
                  <td className="border-r border-slate-200 px-3 py-2">
                    {editable ? (
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={done}
                          disabled={busyKey === r.dateKey}
                          onChange={(e) => onToggle?.(r.dateKey, e.target.checked)}
                          className="h-4 w-4 rounded border-slate-400 text-emerald-600 focus:ring-emerald-500/30"
                        />
                        <span
                          className={done ? "font-medium text-emerald-900" : "text-slate-500"}
                        >
                          {done ? "тооцоо нийлсэн" : "хүлээгдэж буй"}
                        </span>
                      </label>
                    ) : (
                      <span className={done ? "font-medium text-emerald-900" : "text-slate-400"}>
                        {done ? "✓ тооцоо нийлсэн" : "хүлээгдэж буй"}
                      </span>
                    )}
                  </td>
                  <td className="px-1 py-1">
                    {editable ? (
                      <input
                        defaultValue={rec?.note ?? ""}
                        onBlur={(e) => onNote?.(r.dateKey, e.target.value.trim())}
                        placeholder="Зөрүү / тэмдэглэл…"
                        className="w-full min-w-[180px] rounded border border-transparent bg-transparent px-2 py-1.5 text-sm outline-none transition focus:border-brand focus:bg-white"
                      />
                    ) : (
                      <span className="block min-w-[160px] px-2 py-1.5 text-sm text-slate-600">
                        {rec?.note || ""}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-300 bg-slate-50 font-bold">
              <td className="px-2 py-2" colSpan={2}>
                Нийт
              </td>
              <td className="px-3 py-2 text-right">{totals.cod.toLocaleString("mn-MN")}</td>
              <td className="px-3 py-2 text-right">{totals.cash.toLocaleString("mn-MN")}</td>
              <td className="px-3 py-2 text-right">{totals.transfer.toLocaleString("mn-MN")}</td>
              <td className="px-3 py-2 text-right">{totals.delivery.toLocaleString("mn-MN")}</td>
              <td className="px-3 py-2 text-right">{totals.payable.toLocaleString("mn-MN")}</td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  );
}
