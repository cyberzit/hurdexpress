"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import { formatDateTime } from "@/lib/format";
import type { DeliveryProof, Order } from "@/types";

function ProofGroup({
  title,
  tone,
  driverName,
  proofs,
  onOpen,
}: {
  title: string;
  tone: "green" | "red";
  driverName: string;
  proofs: DeliveryProof[];
  onOpen: (url: string) => void;
}) {
  const toneClass = tone === "green" ? "text-green-700" : "text-red-600";
  return (
    <div>
      <p className={`text-sm font-semibold ${toneClass}`}>{title}</p>
      <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {proofs.map((p, i) => (
          <button
            key={p.imagePath || i}
            type="button"
            onClick={() => onOpen(p.imageUrl)}
            className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.imageUrl}
              alt={`${title} ${i + 1}`}
              loading="lazy"
              className="h-full w-full object-cover transition group-hover:scale-105"
            />
            <span className="absolute inset-x-0 bottom-0 bg-black/45 px-1 py-0.5 text-center text-[10px] text-white">
              🔍 томруулах
            </span>
          </button>
        ))}
      </div>
      {/* Эхний зургийн мета мэдээлэл (жолооч/огноо/GPS) */}
      {proofs[0] && (
        <dl className="mt-2 space-y-1 text-xs text-slate-500">
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-slate-400">Жолооч</dt>
            <dd className="text-navy">{driverName || "—"}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-slate-400">Огноо</dt>
            <dd className="text-navy">{formatDateTime(proofs[0].uploadedAt)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-slate-400">GPS</dt>
            <dd>
              {proofs[0].lat != null && proofs[0].lng != null ? (
                <a
                  href={`https://www.google.com/maps?q=${proofs[0].lat},${proofs[0].lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand hover:underline"
                >
                  {proofs[0].lat.toFixed(5)}, {proofs[0].lng.toFixed(5)}
                </a>
              ) : (
                <span className="text-slate-400">Байршил бүртгэгдээгүй</span>
              )}
            </dd>
          </div>
        </dl>
      )}
    </div>
  );
}

export default function OrderProofSection({ order }: { order: Order }) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  const delivery = order.deliveryProofs ?? [];
  const failed = order.failedProofs ?? [];

  if (delivery.length === 0 && failed.length === 0) return null;

  return (
    <Card>
      <h2 className="text-sm font-bold text-navy">📷 Хүргэлтийн баталгаажуулалт</h2>
      <div className="mt-3 space-y-4">
        {delivery.length > 0 && (
          <ProofGroup
            title="Хүргэгдсэн"
            tone="green"
            driverName={order.driverName ?? ""}
            proofs={delivery}
            onOpen={setLightbox}
          />
        )}
        {failed.length > 0 && (
          <ProofGroup
            title={`Амжилтгүй${order.failedReason ? ` — ${order.failedReason}` : ""}`}
            tone="red"
            driverName={order.driverName ?? ""}
            proofs={failed}
            onOpen={setLightbox}
          />
        )}
      </div>

      {lightbox && (
        <Modal title="Баталгаажуулах зураг" onClose={() => setLightbox(null)}>
          <div className="px-4 py-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightbox}
              alt="Баталгаажуулах зураг"
              className="mx-auto max-h-[75vh] w-full rounded-xl object-contain"
            />
          </div>
        </Modal>
      )}
    </Card>
  );
}
