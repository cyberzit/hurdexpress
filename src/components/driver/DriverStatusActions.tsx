"use client";

import { useState } from "react";
import { driverUpdateOrder } from "@/lib/firebase/orders";
import { logActivity } from "@/lib/firebase/activity";
import { useAuth } from "@/contexts/AuthContext";
import FailedReasonModal from "@/components/driver/FailedReasonModal";
import DeliverProofModal from "@/components/driver/DeliverProofModal";
import PaymentCollect from "@/components/driver/PaymentCollect";
import { ORDER_STATUS_LABELS, type Order, type OrderStatus } from "@/types";

// "Бараа авсан" + "Замдаа" нь нэг "Жолооч хүлээн авсан" toggle болж нэгдсэн.
const ACTIONS: { status: OrderStatus; label: string; className: string }[] = [
  {
    status: "delivered",
    label: "Хүргэгдсэн",
    className: "bg-green-600 hover:bg-green-700",
  },
  {
    status: "failed",
    label: "Амжилтгүй",
    className: "bg-red-600 hover:bg-red-700",
  },
];

export default function DriverStatusActions({ order }: { order: Order }) {
  const { profile } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  // Жолооч барааны үнэ + хүргэлтийн үнийг ХАМТ авна.
  const due = order.totalAmount || (order.codAmount ?? 0) + (order.deliveryPrice ?? 0);
  const [cash, setCash] = useState(String(order.cashPaid ?? ""));
  const [transfer, setTransfer] = useState(String(order.transferPaid ?? ""));
  const [note, setNote] = useState(order.driverNote ?? "");
  const [failOpen, setFailOpen] = useState(false);
  const [deliverOpen, setDeliverOpen] = useState(false);

  async function changeStatus(status: OrderStatus) {
    setError("");
    setSaved("");
    setBusy(true);
    try {
      await driverUpdateOrder(order.id, { status });

      // Activity бүртгэл (driver actorId == өөрийн uid тул rules зөвшөөрнө).
      try {
        const label = ORDER_STATUS_LABELS[status];
        if (profile) {
          await logActivity({
            orderId: order.id,
            orderCode: order.orderCode,
            action: `Төлөв: ${label}`,
            actorId: profile.uid,
            actorName: profile.name,
            actorRole: "driver",
          });
        }
        // ⚠️ Partner/admin-д мэдэгдэл илгээх нь production rules дээр driver-т
        // хоригдсон (notifications create = зөвхөн admin). Үүнийг захиалгын
        // өөрчлөлт дээр ажиллах Cloud Function руу зөөх ёстой (SECURITY.md үз).
      } catch {
        /* лог амжаагүй ч үргэлжилнэ */
      }
    } catch {
      setError("Статус шинэчлэхэд алдаа гарлаа.");
    } finally {
      setBusy(false);
    }
  }

  async function saveDetails() {
    setError("");
    setSaved("");
    setBusy(true);
    try {
      await driverUpdateOrder(order.id, {
        cashPaid: order.prepaid ? 0 : Number(cash) || 0,
        transferPaid: order.prepaid ? 0 : Number(transfer) || 0,
        driverNote: note,
      });
      setSaved("Хадгалагдлаа.");
    } catch {
      setError("Хадгалахад алдаа гарлаа.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      {/* "Жолооч хүлээн авсан" toggle нь ЗӨВХӨН захиалгын жагсаалтын карт дээр —
          энд том товч байвал андуурч дарах эрсдэлтэй. */}

      {/* Статус товчнууд */}
      <div className="grid grid-cols-2 gap-3">
        {ACTIONS.map((a) => {
          const current = order.status === a.status;
          const onClick =
            a.status === "failed"
              ? () => setFailOpen(true)
              : a.status === "delivered"
                ? () => setDeliverOpen(true)
                : () => changeStatus(a.status);
          // Амжилтгүй нь одоогийн төлөв байсан ч дарж засах/буцаах боломжтой байх ёстой.
          const editable = a.status === "failed";
          return (
            <button
              key={a.status}
              onClick={onClick}
              disabled={busy || (current && !editable)}
              className={`rounded-2xl px-4 py-5 text-base font-semibold text-white shadow-sm transition disabled:opacity-60 ${a.className} ${
                current ? "ring-2 ring-navy ring-offset-2" : ""
              }`}
            >
              {a.label}
              {current && (
                <span className="mt-0.5 block text-xs font-normal">
                  {editable ? "(одоогийн · засах)" : "(одоогийн)"}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Төлбөр */}
      <PaymentCollect
        due={due}
        prepaid={order.prepaid ?? false}
        cash={cash}
        transfer={transfer}
        disabled={busy}
        onCash={setCash}
        onTransfer={setTransfer}
      />

      {/* Тэмдэглэл */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={busy}
          placeholder="Тэмдэглэл нэмэх…"
          className="mt-3 min-h-20 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-navy outline-none transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
        />

        {saved && <p className="mt-2 text-sm text-green-700">{saved}</p>}

        <button
          onClick={saveDetails}
          disabled={busy}
          className="mt-3 w-full rounded-xl border border-navy py-3 text-sm font-semibold text-navy transition hover:bg-navy hover:text-white disabled:opacity-60"
        >
          {busy ? "Хадгалж байна…" : "Төлбөр / тэмдэглэл хадгалах"}
        </button>
      </div>

      {failOpen && <FailedReasonModal order={order} onClose={() => setFailOpen(false)} />}
      {deliverOpen && (
        <DeliverProofModal
          order={order}
          cashPaid={order.prepaid ? 0 : Number(cash) || 0}
          transferPaid={order.prepaid ? 0 : Number(transfer) || 0}
          driverNote={note}
          onClose={() => setDeliverOpen(false)}
          onDone={() => setSaved("Хүргэлт баталгаажлаа.")}
        />
      )}
    </div>
  );
}
