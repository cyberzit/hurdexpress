"use client";

import { useState } from "react";
import { createShipment } from "@/lib/firebase/shipments";

interface Props {
  ownerUid: string;
  onCreated: () => void;
}

const inputClass =
  "w-full rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-white/15";

export default function CreateShipmentForm({ ownerUid, onCreated }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Илгээгч
  const [fromCity, setFromCity] = useState("Улаанбаатар");
  const [fromLine1, setFromLine1] = useState("");
  const [fromName, setFromName] = useState("");
  const [fromPhone, setFromPhone] = useState("");
  // Хүлээн авагч
  const [toCity, setToCity] = useState("Улаанбаатар");
  const [toLine1, setToLine1] = useState("");
  const [toName, setToName] = useState("");
  const [toPhone, setToPhone] = useState("");
  // Илгээмж
  const [description, setDescription] = useState("");
  const [weightKg, setWeightKg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await createShipment({
        ownerUid,
        from: { city: fromCity, line1: fromLine1, contactName: fromName, phone: fromPhone },
        to: { city: toCity, line1: toLine1, contactName: toName, phone: toPhone },
        description: description || undefined,
        weightKg: weightKg ? Number(weightKg) : undefined,
      });
      onCreated();
    } catch {
      setError("Захиалга үүсгэхэд алдаа гарлаа.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-xl border border-black/10 p-5 dark:border-white/10"
    >
      {error && (
        <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Илгээгч</legend>
          <input className={inputClass} placeholder="Хот/аймаг" value={fromCity} onChange={(e) => setFromCity(e.target.value)} required />
          <input className={inputClass} placeholder="Дэлгэрэнгүй хаяг" value={fromLine1} onChange={(e) => setFromLine1(e.target.value)} required />
          <input className={inputClass} placeholder="Нэр" value={fromName} onChange={(e) => setFromName(e.target.value)} required />
          <input className={inputClass} placeholder="Утас" value={fromPhone} onChange={(e) => setFromPhone(e.target.value)} required />
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Хүлээн авагч</legend>
          <input className={inputClass} placeholder="Хот/аймаг" value={toCity} onChange={(e) => setToCity(e.target.value)} required />
          <input className={inputClass} placeholder="Дэлгэрэнгүй хаяг" value={toLine1} onChange={(e) => setToLine1(e.target.value)} required />
          <input className={inputClass} placeholder="Нэр" value={toName} onChange={(e) => setToName(e.target.value)} required />
          <input className={inputClass} placeholder="Утас" value={toPhone} onChange={(e) => setToPhone(e.target.value)} required />
        </fieldset>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <input className={inputClass} placeholder="Илгээмжийн тайлбар" value={description} onChange={(e) => setDescription(e.target.value)} />
        <input className={inputClass} type="number" step="0.1" placeholder="Жин (кг)" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
      </div>

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-md bg-orange-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
      >
        {busy ? "Үүсгэж байна..." : "Захиалга үүсгэх"}
      </button>
    </form>
  );
}
