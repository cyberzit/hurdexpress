"use client";

import {
  downloadCSV,
  type CompanyRow,
  type DailyRow,
  type DriverRow,
} from "@/lib/reports";

const mnt = (n: number) => `${n.toLocaleString("mn-MN")}₮`;

function TableShell({
  title,
  onExport,
  headers,
  children,
  empty,
}: {
  title: string;
  onExport: () => void;
  headers: string[];
  children: React.ReactNode;
  empty: boolean;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-bold text-navy">{title}</h2>
        <button
          onClick={onExport}
          disabled={empty}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-navy transition hover:bg-slate-50 disabled:opacity-50"
        >
          ⬇ CSV
        </button>
      </div>
      {empty ? (
        <p className="px-4 py-10 text-center text-sm text-slate-400">Дата алга</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                {headers.map((h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-3 font-medium ${i === 0 ? "" : "text-right"}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>{children}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Num({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 text-right text-slate-600">{children}</td>;
}

export default function ReportTables({
  companyRows,
  driverRows,
  dailyRows,
}: {
  companyRows: CompanyRow[];
  driverRows: DriverRow[];
  dailyRows: DailyRow[];
}) {
  return (
    <div className="space-y-6">
      {/* Байгууллагын тайлан */}
      <TableShell
        title="Харилцагч байгууллагын тайлан"
        empty={companyRows.length === 0}
        headers={["Байгууллага", "Нийт", "Хүргэгдсэн", "Хүргэлтийн орлого", "COD дүн"]}
        onExport={() =>
          downloadCSV(
            "company-report.csv",
            ["companyName", "totalOrders", "deliveredOrders", "deliveryFeeTotal", "codTotal"],
            companyRows.map((r) => [
              r.companyName,
              r.totalOrders,
              r.deliveredOrders,
              r.deliveryFeeTotal,
              r.codTotal,
            ]),
          )
        }
      >
        {companyRows.map((r) => (
          <tr key={r.companyName} className="border-b border-slate-100 last:border-0">
            <td className="px-4 py-3 font-medium text-navy">{r.companyName}</td>
            <Num>{r.totalOrders}</Num>
            <Num>{r.deliveredOrders}</Num>
            <Num>{mnt(r.deliveryFeeTotal)}</Num>
            <Num>{mnt(r.codTotal)}</Num>
          </tr>
        ))}
      </TableShell>

      {/* Жолоочийн тайлан */}
      <TableShell
        title="Жолоочийн тайлан"
        empty={driverRows.length === 0}
        headers={["Жолооч", "Нийт", "Хүргэгдсэн", "Амжилтгүй", "Авсан COD"]}
        onExport={() =>
          downloadCSV(
            "driver-report.csv",
            ["driverName", "totalOrders", "deliveredOrders", "failedOrders", "codCollectedTotal"],
            driverRows.map((r) => [
              r.driverName,
              r.totalOrders,
              r.deliveredOrders,
              r.failedOrders,
              r.codCollectedTotal,
            ]),
          )
        }
      >
        {driverRows.map((r) => (
          <tr key={r.driverName} className="border-b border-slate-100 last:border-0">
            <td className="px-4 py-3 font-medium text-navy">{r.driverName}</td>
            <Num>{r.totalOrders}</Num>
            <Num>{r.deliveredOrders}</Num>
            <Num>{r.failedOrders}</Num>
            <Num>{mnt(r.codCollectedTotal)}</Num>
          </tr>
        ))}
      </TableShell>

      {/* Өдрийн тайлан */}
      <TableShell
        title="Өдрийн тайлан"
        empty={dailyRows.length === 0}
        headers={["Огноо", "Нийт", "Хүргэгдсэн", "Хүргэлтийн орлого", "COD дүн"]}
        onExport={() =>
          downloadCSV(
            "daily-report.csv",
            ["date", "totalOrders", "deliveredOrders", "deliveryFeeTotal", "codTotal"],
            dailyRows.map((r) => [
              r.date,
              r.totalOrders,
              r.deliveredOrders,
              r.deliveryFeeTotal,
              r.codTotal,
            ]),
          )
        }
      >
        {dailyRows.map((r) => (
          <tr key={r.date} className="border-b border-slate-100 last:border-0">
            <td className="px-4 py-3 font-medium text-navy">{r.date}</td>
            <Num>{r.totalOrders}</Num>
            <Num>{r.deliveredOrders}</Num>
            <Num>{mnt(r.deliveryFeeTotal)}</Num>
            <Num>{mnt(r.codTotal)}</Num>
          </tr>
        ))}
      </TableShell>
    </div>
  );
}
