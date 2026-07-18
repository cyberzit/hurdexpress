"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { fieldClass } from "@/components/ui/Input";
import ProofPhotoPicker from "@/components/driver/ProofPhotoPicker";
import { failOrder, postponeOrder, revertFailedOrder } from "@/lib/firebase/orders";
import { dateKeyOf } from "@/lib/firebase/driverSettlement";
import { logActivity } from "@/lib/firebase/activity";
import { uploadDeliveryProof } from "@/lib/imageUpload";
import { getCurrentPositionSafe } from "@/lib/geo";
import { useAuth } from "@/contexts/AuthContext";
import { FAILED_REASONS, type DeliveryProof, type Order } from "@/types";

export default function FailedReasonModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const { profile } = useAuth();
  // Аль хэдийн амжилтгүй болсон захиалгыг дахин нээвэл хуучин утгыг нь ачаална.
  const isEditing = order.status === "failed";
  const [reason, setReason] = useState<string>(() =>
    FAILED_REASONS.includes(order.failedReason as (typeof FAILED_REASONS)[number])
      ? (order.failedReason as string)
      : "",
  );
  const [note, setNote] = useState(order.failedNote ?? "");
  const [retryDate, setRetryDate] = useState(order.scheduledDate ?? "");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const [busy, setBusy] = useState(false);
  // Огнооны түлхүүрүүд. Lazy init — render бүрт дахин тооцохгүй.
  const [minDate] = useState(() => dateKeyOf(new Date()));
  const [tomorrow] = useState(() => {
    const d = new Date();
    return dateKeyOf(new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1));
  });

  const driverId = profile?.driverId ?? profile?.uid ?? "";

  // Хойшлуулах хоёр горим — аль нь ч захиалгыг амжилтгүй БОЛГОХГҮЙ:
  //   "Дараа авна"  → жолооч календараас өдрөө сонгоно
  //   "Хойшилсон"   → автоматаар маргаашийн хүргэлтэд орно
  // "Хаяг дээр очсон" → зөвхөн нэмэлт тайлбар.
  const isPickDate = reason === "Дараа авна";
  // Эдгээр шалтгаанаар захиалга амжилтгүй болохгүй — маргааш дахин оролдоно.
  const isAutoTomorrow =
    reason === "Хойшилсон" ||
    reason === "Утасаа аваагүй" ||
    reason === "Холбогдох боломжгүй";
  const isPostpone = isPickDate || isAutoTomorrow;
  const needsNote = isPickDate || reason === "Хаяг дээр очсон";
  const scheduledDate = isAutoTomorrow ? tomorrow : retryDate;

  async function submit() {
    setError("");
    if (!reason) return setError("Шалтгаанаа сонгоно уу.");
    if (isPickDate && !retryDate) return setError("Дахин очих огноог сонгоно уу.");

    setBusy(true);
    try {
      const geo = await getCurrentPositionSafe();
      const proofs: DeliveryProof[] = [];
      for (let i = 0; i < files.length; i++) {
        setProgress(`Зураг хуулж байна… ${i + 1}/${files.length}`);
        const { imageUrl, imagePath } = await uploadDeliveryProof(order.id, files[i], "failed");
        proofs.push({
          imageUrl,
          imagePath,
          uploadedAt: Date.now(),
          driverId,
          ...(geo ? { lat: geo.lat, lng: geo.lng } : {}),
        });
      }
      setProgress("Хадгалж байна…");
      // Тайлбар талбар нуугдсан шалтгаан дээр өмнө бичсэн текстийг хадгалахгүй.
      const finalNote = needsNote ? note : "";
      if (isPostpone) {
        await postponeOrder(order.id, scheduledDate, proofs, finalNote);
      } else {
        await failOrder(order.id, reason, profile?.uid ?? "", proofs, finalNote);
      }
      if (profile) {
        await logActivity({
          orderId: order.id,
          orderCode: order.orderCode,
          action: isPostpone
            ? `${scheduledDate} өдөр рүү хойшлуулсан — ${reason} (${proofs.length} зураг)`
            : `Амжилтгүй болсон: ${reason} (${proofs.length} зураг)`,
          actorId: profile.uid,
          actorName: profile.name,
          actorRole: profile.role,
        }).catch(() => {});
      }
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Хадгалахад алдаа гарлаа.");
      setBusy(false);
      setProgress("");
    }
  }

  async function revert() {
    setError("");
    setBusy(true);
    try {
      await revertFailedOrder(order.id);
      if (profile) {
        await logActivity({
          orderId: order.id,
          orderCode: order.orderCode,
          action: "Амжилтгүйг цуцалж, захиалгыг сэргээсэн",
          actorId: profile.uid,
          actorName: profile.name,
          actorRole: profile.role,
        }).catch(() => {});
      }
      onClose();
    } catch {
      setError("Сэргээхэд алдаа гарлаа.");
      setBusy(false);
    }
  }

  return (
    <Modal
      title={isEditing ? "Амжилтгүйн шалтгаан засах" : "Амжилтгүй болсон шалтгаан"}
      subtitle={order.orderCode}
      onClose={onClose}
    >
      <div className="space-y-3 px-6 py-5">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        {isEditing && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
            <p className="text-sm text-slate-600">
              Энэ захиалга амжилтгүй гэж тэмдэглэгдсэн байна. Шалтгааныг өөрчилж дахин хадгалах,
              эсвэл бүрмөсөн цуцалж захиалгыг сэргээж болно.
            </p>
            <button
              type="button"
              onClick={revert}
              disabled={busy}
              className="mt-2.5 w-full rounded-xl border border-navy py-2.5 text-sm font-semibold text-navy transition hover:bg-navy hover:text-white disabled:opacity-60"
            >
              ↩ Амжилтгүйг цуцлах (захиалга &quot;Замдаа&quot; болно)
            </button>
          </div>
        )}

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

        {isPickDate && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3">
            <label className="mb-1.5 block text-sm font-medium text-navy">
              Дахин очих огноо <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={retryDate}
              min={minDate}
              onChange={(e) => setRetryDate(e.target.value)}
              disabled={busy}
              className={`border-slate-200 focus:border-brand ${fieldClass}`}
            />
            <p className="mt-1.5 text-xs text-amber-700">
              Захиалга амжилтгүй болохгүй — энэ өдөр рүү хойшилж, дахин хүргэх боломжтой хэвээр
              байна.
            </p>
          </div>
        )}

        {isAutoTomorrow && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3">
            <p className="text-sm font-medium text-navy">📅 Маргаашийн хүргэлтэд орно</p>
            <p className="mt-1 text-xs text-amber-700">
              Захиалга амжилтгүй болохгүй — <span className="font-semibold">{tomorrow}</span> өдрийн
              хүргэлтэд автоматаар шилжинэ.
            </p>
          </div>
        )}

        {needsNote && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Тайлбар</label>
            <textarea
              className={`min-h-20 resize-y border-slate-200 focus:border-brand ${fieldClass}`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={busy}
              placeholder="Юу болсныг товч тайлбарлана уу…"
            />
          </div>
        )}

        <div>
          <p className="mb-1.5 text-sm font-medium text-navy">
            Баталгаажуулах зураг/screenshot{" "}
            <span className="font-normal text-slate-400">(заавал биш)</span>
          </p>
          <ProofPhotoPicker files={files} onChange={setFiles} disabled={busy} />
        </div>

        {busy && progress && (
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500">{progress}</p>
        )}

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="outline" fullWidth onClick={onClose} disabled={busy}>
            Болих
          </Button>
          <Button
            type="button"
            variant={isPostpone ? "primary" : "danger"}
            fullWidth
            loading={busy}
            onClick={submit}
          >
            {isPostpone ? "Хойшлуулах" : isEditing ? "Шалтгаан хадгалах" : "Амжилтгүй болгох"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
