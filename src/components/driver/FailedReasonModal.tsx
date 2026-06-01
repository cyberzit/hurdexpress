"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { fieldClass } from "@/components/ui/Input";
import { failOrder } from "@/lib/firebase/orders";
import { logActivity } from "@/lib/firebase/activity";
import { useAuth } from "@/contexts/AuthContext";
import { FAILED_REASONS, type Order } from "@/types";

export default function FailedReasonModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const { profile } = useAuth();
  const [reason, setReason] = useState<string>("");
  const [other, setOther] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const isOther = reason === "Бусад";

  async function submit() {
    setError("");
    if (!reason) return setError("Шалтгаанаа сонгоно уу.");
    const finalReason = isOther ? other.trim() : reason;
    if (isOther && !finalReason) return setError("Нэмэлт тайлбар бичнэ үү.");

    setBusy(true);
    try {
      await failOrder(order.id, finalReason, profile?.uid ?? "");
      if (profile) {
        await logActivity({
          orderId: order.id,
          orderCode: order.orderCode,
          action: `Амжилтгүй болсон: ${finalReason}`,
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
    <Modal title="Амжилтгүй болсон шалтгаан" subtitle={order.orderCode} onClose={onClose}>
      <div className="space-y-3 px-6 py-5">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div className="space-y-2">
          {FAILED_REASONS.map((r) => (
            <label
              key={r}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${
                reason === r ? "border-brand bg-brand/5" : "border-slate-200"
              }`}
            >
              <input
                type="radio"
                name="failed-reason"
                checked={reason === r}
                onChange={() => setReason(r)}
                disabled={busy}
                className="h-4 w-4 text-brand focus:ring-brand/30"
              />
              <span className="text-sm text-navy">{r}</span>
            </label>
          ))}
        </div>

        {isOther && (
          <textarea
            className={`min-h-20 resize-y border-slate-200 focus:border-brand ${fieldClass}`}
            value={other}
            onChange={(e) => setOther(e.target.value)}
            disabled={busy}
            placeholder="Нэмэлт тайлбар…"
          />
        )}

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="outline" fullWidth onClick={onClose} disabled={busy}>
            Болих
          </Button>
          <Button type="button" variant="danger" fullWidth loading={busy} onClick={submit}>
            Амжилтгүй болгох
          </Button>
        </div>
      </div>
    </Modal>
  );
}
