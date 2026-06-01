"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { fieldClass } from "@/components/ui/Input";
import { editOrder } from "@/lib/firebase/orders";
import { logActivity } from "@/lib/firebase/activity";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/format";
import type { Order } from "@/types";

const labelClass = "text-sm font-medium text-slate-600";
const input = `mt-1.5 border-slate-200 focus:border-brand ${fieldClass}`;

export default function EditOrderModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const { profile } = useAuth();
  const [receiverName, setReceiverName] = useState(order.receiverName);
  const [receiverPhone, setReceiverPhone] = useState(order.receiverPhone);
  const [receiverAddress, setReceiverAddress] = useState(order.receiverAddress);
  const [note, setNote] = useState(order.note ?? "");
  const [codAmount, setCodAmount] = useState(String(order.codAmount));
  const [deliveryPrice, setDeliveryPrice] = useState(String(order.deliveryPrice));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const total = (Number(codAmount) || 0) + (Number(deliveryPrice) || 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!receiverName.trim()) return setError("Хүлээн авагчийн нэр заавал.");
    if (!receiverPhone.trim()) return setError("Утас заавал.");
    if (!receiverAddress.trim()) return setError("Хаяг заавал.");
    const cod = Number(codAmount);
    const delivery = Number(deliveryPrice);
    if (Number.isNaN(cod) || cod < 0) return setError("COD дүн буруу.");
    if (Number.isNaN(delivery) || delivery < 0) return setError("Хүргэлтийн үнэ буруу.");

    setBusy(true);
    try {
      await editOrder(
        order.id,
        { receiverName, receiverPhone, receiverAddress, note, codAmount: cod, deliveryPrice: delivery },
        profile?.uid ?? "",
      );
      if (profile) {
        await logActivity({
          orderId: order.id,
          orderCode: order.orderCode,
          action: "Захиалга засагдсан",
          actorId: profile.uid,
          actorName: profile.name,
          actorRole: profile.role,
        }).catch(() => {});
      }
      onClose();
    } catch {
      setError("Хадгалахад алдаа гарлаа.");
      setBusy(false);
    }
  }

  return (
    <Modal title="Захиалга засах" subtitle={order.orderCode} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4 px-6 py-5" noValidate>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div>
          <label className={labelClass}>Хүлээн авагчийн нэр</label>
          <input className={input} value={receiverName} onChange={(e) => setReceiverName(e.target.value)} disabled={busy} />
        </div>
        <div>
          <label className={labelClass}>Утас</label>
          <input className={input} value={receiverPhone} onChange={(e) => setReceiverPhone(e.target.value)} disabled={busy} />
        </div>
        <div>
          <label className={labelClass}>Хаяг</label>
          <input className={input} value={receiverAddress} onChange={(e) => setReceiverAddress(e.target.value)} disabled={busy} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>COD дүн (₮)</label>
            <input className={input} type="number" min={0} step={100} value={codAmount} onChange={(e) => setCodAmount(e.target.value)} disabled={busy} />
          </div>
          <div>
            <label className={labelClass}>Хүргэлтийн үнэ (₮)</label>
            <input className={input} type="number" min={0} step={100} value={deliveryPrice} onChange={(e) => setDeliveryPrice(e.target.value)} disabled={busy} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Тэмдэглэл</label>
          <textarea className={`${input} min-h-16 resize-y`} value={note} onChange={(e) => setNote(e.target.value)} disabled={busy} />
        </div>

        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5 text-sm">
          <span className="text-slate-600">Нийт дүн</span>
          <span className="font-bold text-navy">{formatCurrency(total)}</span>
        </div>

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="outline" fullWidth onClick={onClose} disabled={busy}>
            Болих
          </Button>
          <Button type="submit" fullWidth loading={busy}>
            Хадгалах
          </Button>
        </div>
      </form>
    </Modal>
  );
}
