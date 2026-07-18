"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import ProofPhotoPicker from "@/components/driver/ProofPhotoPicker";
import { deliverOrderWithProof } from "@/lib/firebase/orders";
import { logActivity } from "@/lib/firebase/activity";
import { uploadDeliveryProof } from "@/lib/imageUpload";
import { getCurrentPositionSafe } from "@/lib/geo";
import { useAuth } from "@/contexts/AuthContext";
import type { DeliveryProof, Order } from "@/types";

interface Props {
  order: Order;
  cashPaid: number;
  transferPaid: number;
  driverNote: string;
  onClose: () => void;
  onDone?: () => void;
}

export default function DeliverProofModal({
  order,
  cashPaid,
  transferPaid,
  driverNote,
  onClose,
  onDone,
}: Props) {
  const { profile } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const [error, setError] = useState("");

  const driverId = profile?.driverId ?? profile?.uid ?? "";

  async function submit() {
    setError("");
    if (files.length === 0) {
      setError("Хүргэлтийг баталгаажуулах дор хаяж 1 зураг шаардлагатай.");
      return;
    }
    setBusy(true);
    try {
      const geo = await getCurrentPositionSafe();
      const proofs: DeliveryProof[] = [];
      for (let i = 0; i < files.length; i++) {
        setProgress(`Зураг хуулж байна… ${i + 1}/${files.length}`);
        const { imageUrl, imagePath } = await uploadDeliveryProof(
          order.id,
          files[i],
          "delivery",
        );
        proofs.push({
          imageUrl,
          imagePath,
          uploadedAt: Date.now(),
          driverId,
          ...(geo ? { lat: geo.lat, lng: geo.lng } : {}),
        });
      }
      setProgress("Хадгалж байна…");
      await deliverOrderWithProof(order.id, proofs, { cashPaid, transferPaid, driverNote });

      if (profile) {
        await logActivity({
          orderId: order.id,
          orderCode: order.orderCode,
          action: `Хүргэгдсэн (${proofs.length} зураг баталгаажсан)`,
          actorId: profile.uid,
          actorName: profile.name,
          actorRole: profile.role,
        }).catch(() => {});
      }
      onDone?.();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Хадгалахад алдаа гарлаа.");
      setBusy(false);
      setProgress("");
    }
  }

  return (
    <Modal
      title="Хүргэлт баталгаажуулах"
      subtitle={`${order.orderCode} · зураг заавал`}
      onClose={busy ? () => {} : onClose}
    >
      <div className="space-y-4 px-6 py-5">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <p className="text-sm text-slate-500">
          Хүлээн авагч/баглаа боодлын зургийг авч хүргэлтийг баталгаажуулна уу.
        </p>

        <ProofPhotoPicker files={files} onChange={setFiles} disabled={busy} />

        {busy && progress && (
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500">{progress}</p>
        )}

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="outline" fullWidth onClick={onClose} disabled={busy}>
            Болих
          </Button>
          <Button
            type="button"
            fullWidth
            loading={busy}
            onClick={submit}
            disabled={files.length === 0}
          >
            Хүргэгдсэн
          </Button>
        </div>
      </div>
    </Modal>
  );
}
