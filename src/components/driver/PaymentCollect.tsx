"use client";

import { formatCurrency } from "@/lib/format";

interface Props {
  due: number; // авах ёстой нийт дүн
  prepaid: boolean;
  cash: string;
  transfer: string;
  disabled?: boolean;
  onCash: (v: string) => void;
  onTransfer: (v: string) => void;
}

const numClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-right text-lg font-bold text-navy outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

// Жолоочийн төлбөр авах хэсэг. Зорилго — хамгийн энгийн байх:
//   · Урьдчилж төлөгдсөн бол ямар ч талбар харагдахгүй.
//   · Эс бөгөөс "Авах дүн" + бэлэн/шилжүүлгийн 2 талбар. Хагас төлөлт
//     (жишээ: 50,000 бэлнээр + 50,000 шилжүүлсэн) өөрөө шийдэгдэнэ.
export default function PaymentCollect({
  due,
  prepaid,
  cash,
  transfer,
  disabled,
  onCash,
  onTransfer,
}: Props) {
  if (prepaid) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-4">
        <p className="text-base font-bold text-green-800">✅ Төлбөр төлөгдсөн</p>
        <p className="mt-1 text-sm text-green-700">
          Энэ захиалгад <span className="font-semibold">мөнгө авахгүй</span>. Барааг өгөөд
          &quot;Хүргэгдсэн&quot; дарна уу.
        </p>
      </div>
    );
  }

  const cashNum = Number(cash) || 0;
  const transferNum = Number(transfer) || 0;
  const got = cashNum + transferNum;
  const left = due - got;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-baseline justify-between">
        <div>
          <span className="block text-sm font-medium text-slate-500">Авах дүн</span>
          <span className="block text-xs text-slate-400">бараа + хүргэлт</span>
        </div>
        <span className="text-2xl font-bold text-navy">{formatCurrency(due)}</span>
      </div>

      {/* Нэг товчоор бүтнээр нь бөглөх */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            onCash(String(due));
            onTransfer("0");
          }}
          className="rounded-xl border-2 border-green-600 bg-green-50 py-2.5 text-sm font-bold text-green-700 transition hover:bg-green-100 disabled:opacity-50"
        >
          💵 Бүгд бэлнээр
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            onTransfer(String(due));
            onCash("0");
          }}
          className="rounded-xl border-2 border-blue-600 bg-blue-50 py-2.5 text-sm font-bold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
        >
          🏦 Бүгд шилжүүлсэн
        </button>
      </div>

      <p className="mt-3 text-xs text-slate-400">Эсвэл хуваан бичнэ үү:</p>

      <div className="mt-1.5 grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-green-700">💵 Бэлнээр</label>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={cash}
            onChange={(e) => onCash(e.target.value)}
            disabled={disabled}
            className={numClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-blue-700">🏦 Шилжүүлсэн</label>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={transfer}
            onChange={(e) => onTransfer(e.target.value)}
            disabled={disabled}
            className={numClass}
          />
        </div>
      </div>

      {/* Үлдэгдлийн заалт — жолооч нэг харцаар ойлгоно */}
      <div
        className={`mt-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${
          left === 0
            ? "bg-green-100 text-green-800"
            : left > 0
              ? "bg-amber-100 text-amber-800"
              : "bg-red-100 text-red-700"
        }`}
      >
        {left === 0
          ? `✓ Бүрэн авсан — ${formatCurrency(got)}`
          : left > 0
            ? `Дутуу: ${formatCurrency(left)}`
            : `Илүү: ${formatCurrency(-left)}`}
      </div>
    </div>
  );
}
