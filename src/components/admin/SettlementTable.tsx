"use client";

import { useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { fieldClass } from "@/components/ui/Input";
import { formatCurrency, formatDate } from "@/lib/format";
import { downloadCSV } from "@/lib/reports";
import {
  recordPayment,
  updateSettlementStatus,
} from "@/lib/firebase/settlements";
import {
  PAYMENT_TYPE_LABELS,
  SETTLEMENT_STATUS_LABELS,
  type PaymentType,
  type Settlement,
  type SettlementStatus,
} from "@/types";

const STATUS_TONE: Record<SettlementStatus, "slate" | "blue" | "green"> = {
  draft: "slate",
  confirmed: "blue",
  paid: "green",
};

const PAYMENT_TYPES = Object.keys(PAYMENT_TYPE_LABELS) as PaymentType[];

export default function SettlementTable({ settlements }: { settlements: Settlement[] }) {
  const [payFor, setPayFor] = useState<Settlement | null>(null);

  function exportCsv() {
    downloadCSV(
      "settlements.csv",
      [
        "companyName", "periodStart", "periodEnd", "totalOrders", "deliveredOrders",
        "deliveryFeeTotal", "codTotal", "paidAmount", "balanceAmount", "status",
      ],
      settlements.map((s) => [
        s.companyName,
        formatDate(s.periodStart),
        formatDate(s.periodEnd),
        s.totalOrders,
        s.deliveredOrders,
        s.deliveryFeeTotal,
        s.codTotal,
        s.paidAmount,
        s.balanceAmount,
        SETTLEMENT_STATUS_LABELS[s.status],
      ]),
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-bold text-navy">Тооцоонууд</h2>
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={settlements.length === 0}>
          ⬇ CSV
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3 font-medium">Байгууллага</th>
              <th className="px-4 py-3 font-medium">Хугацаа</th>
              <th className="px-4 py-3 font-medium">Хүргэлт</th>
              <th className="px-4 py-3 font-medium">COD</th>
              <th className="px-4 py-3 font-medium">Төлсөн</th>
              <th className="px-4 py-3 font-medium">Үлдэгдэл</th>
              <th className="px-4 py-3 font-medium">Статус</th>
              <th className="px-4 py-3 text-right font-medium">Үйлдэл</th>
            </tr>
          </thead>
          <tbody>
            {settlements.map((s) => (
              <tr key={s.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 font-medium text-navy">{s.companyName}</td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {formatDate(s.periodStart)} – {formatDate(s.periodEnd)}
                </td>
                <td className="px-4 py-3 text-slate-600">{formatCurrency(s.deliveryFeeTotal)}</td>
                <td className="px-4 py-3 text-slate-600">{formatCurrency(s.codTotal)}</td>
                <td className="px-4 py-3 text-slate-600">{formatCurrency(s.paidAmount)}</td>
                <td className="px-4 py-3 font-semibold text-navy">{formatCurrency(s.balanceAmount)}</td>
                <td className="px-4 py-3">
                  <Badge tone={STATUS_TONE[s.status]}>{SETTLEMENT_STATUS_LABELS[s.status]}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    {s.status === "draft" && (
                      <Button size="sm" variant="outline" onClick={() => updateSettlementStatus(s.id, "confirmed")}>
                        Батлах
                      </Button>
                    )}
                    {s.status !== "draft" && (
                      <Button size="sm" variant="outline" onClick={() => setPayFor(s)}>
                        Төлбөр
                      </Button>
                    )}
                    {s.status === "confirmed" && (
                      <Button size="sm" variant="secondary" onClick={() => updateSettlementStatus(s.id, "paid")}>
                        Хаах
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {payFor && <PaymentModal settlement={payFor} onClose={() => setPayFor(null)} />}
    </div>
  );
}

function PaymentModal({ settlement, onClose }: { settlement: Settlement; onClose: () => void }) {
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<PaymentType>("delivery_fee");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const amt = Number(amount);
    if (!amount.trim() || Number.isNaN(amt) || amt <= 0) {
      return setError("Дүнг зөв оруулна уу.");
    }
    setBusy(true);
    try {
      await recordPayment({
        companyId: settlement.companyId,
        settlementId: settlement.id,
        amount: amt,
        type,
        note,
      });
      onClose();
    } catch {
      setError("Төлбөр бүртгэхэд алдаа гарлаа.");
      setBusy(false);
    }
  }

  return (
    <Modal title="Төлбөр бүртгэх" subtitle={settlement.companyName} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4 px-6 py-5" noValidate>
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
          Үлдэгдэл: <span className="font-semibold text-navy">{formatCurrency(settlement.balanceAmount)}</span>
        </p>
        <div>
          <label className="text-sm font-medium text-slate-600">Дүн (₮)</label>
          <input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={busy}
            className={`mt-1.5 border-slate-200 focus:border-brand ${fieldClass}`}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-600">Төрөл</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as PaymentType)}
            disabled={busy}
            className={`mt-1.5 border-slate-200 focus:border-brand ${fieldClass}`}
          >
            {PAYMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {PAYMENT_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-600">Тэмдэглэл</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={busy}
            className={`mt-1.5 border-slate-200 focus:border-brand ${fieldClass}`}
          />
        </div>
        <div className="flex gap-3 pt-1">
          <Button type="button" variant="outline" fullWidth onClick={onClose} disabled={busy}>
            Болих
          </Button>
          <Button type="submit" fullWidth loading={busy}>
            Бүртгэх
          </Button>
        </div>
      </form>
    </Modal>
  );
}
