"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { fieldClass } from "@/components/ui/Input";
import { cancelOrder } from "@/lib/firebase/orders";
import { logActivity } from "@/lib/firebase/activity";
import { useAuth } from "@/contexts/AuthContext";
import type { Order } from "@/types";

export default function CancelOrderModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const { profile } = useAuth();
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!reason.trim()) return setError("Цуцлах шалтгааныг бичнэ үү.");

    setBusy(true);
    try {
      await cancelOrder(order.id, reason, profile?.uid ?? "");
      if (profile) {
        await logActivity({
          orderId: order.id,
          orderCode: order.orderCode,
          action: `Захиалга цуцлагдсан: ${reason.trim()}`,
          actorId: profile.uid,
          actorName: profile.name,
          actorRole: profile.role,
        }).catch(() => {});
      }
      onClose();
    } catch {
      setError("Цуцлахад алдаа гарлаа.");
      setBusy(false);
    }
  }

  return (
    <Modal title="Захиалга цуцлах" subtitle={order.orderCode} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4 px-6 py-5" noValidate>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Энэ үйлдлийг буцаах боломжгүй. Захиалга «Цуцлагдсан» болно.
        </p>
        <div>
          <label className="text-sm font-medium text-slate-600">Цуцлах шалтгаан *</label>
          <textarea
            className={`mt-1.5 min-h-20 resize-y border-slate-200 focus:border-brand ${fieldClass}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={busy}
            placeholder="Жишээ: Хэрэглэгч цуцалсан"
          />
        </div>
        <div className="flex gap-3 pt-1">
          <Button type="button" variant="outline" fullWidth onClick={onClose} disabled={busy}>
            Болих
          </Button>
          <Button type="submit" variant="danger" fullWidth loading={busy}>
            Цуцлах
          </Button>
        </div>
      </form>
    </Modal>
  );
}
