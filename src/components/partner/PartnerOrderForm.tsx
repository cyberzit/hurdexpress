"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getCompany } from "@/lib/firebase/companies";
import { subscribeProductsByCompany } from "@/lib/firebase/products";
import { addOrder, type OrderInput } from "@/lib/firebase/orders";
import { logActivity } from "@/lib/firebase/activity";
import AddressForm, {
  EMPTY_ADDRESS,
  type AddressValue,
} from "@/components/orders/AddressForm";
import { buildReceiverAddress } from "@/lib/mongoliaLocations";
import type { Product } from "@/types";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-navy outline-none transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20";

const labelClass = "text-sm font-medium text-slate-600";

export default function PartnerOrderForm() {
  const router = useRouter();
  const { profile } = useAuth();
  const companyId = profile?.companyId ?? "";

  const [companyName, setCompanyName] = useState("");
  // Хүргэлтийн үнэ нь гэрээт байгууллагын contractPrice-аас автоматаар ирнэ
  // (partner өөрөө оруулахгүй/өөрчлөхгүй).
  const [contractPrice, setContractPrice] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);

  const [productId, setProductId] = useState("");
  const [itemName, setItemName] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [address, setAddress] = useState<AddressValue>(EMPTY_ADDRESS);
  const [qty, setQty] = useState("1");
  const [codAmount, setCodAmount] = useState("0");
  const [note, setNote] = useState("");

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Байгууллагын нэр + гэрээт хүргэлтийн үнэ.
  useEffect(() => {
    if (!companyId) return;
    getCompany(companyId)
      .then((c) => {
        setCompanyName(c?.name ?? "");
        setContractPrice(c?.contractPrice ?? 0);
      })
      .catch(() => {});
  }, [companyId]);

  // Өөрийн байгууллагын active бараанууд (real-time)
  useEffect(() => {
    if (!companyId) return;
    const unsub = subscribeProductsByCompany(
      companyId,
      (list) => setProducts(list),
      () => {},
    );
    return () => unsub();
  }, [companyId]);

  function handleProductChange(id: string) {
    setProductId(id);
    const product = products.find((p) => p.id === id);
    if (product) {
      setItemName(product.name);
      setCodAmount(String(product.price));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!companyId) return setError("Байгууллага холбогдоогүй байна.");
    if (!receiverName.trim()) return setError("Хүлээн авагчийн нэр заавал бөглөнө.");
    if (!receiverPhone.trim()) return setError("Хүлээн авагчийн утас заавал бөглөнө.");

    // Хүргэлтийн бүсээс хамаарсан хаягийн шалгалт.
    if (address.deliveryType === "city") {
      if (!address.cityDistrict) return setError("Дүүрэг сонгоно уу.");
      if (!address.cityKhoroo.trim()) return setError("Хороо / баг бөглөнө үү.");
      if (!address.addressNote.trim())
        return setError("Хаягийн нэмэлт тайлбар заавал бөглөнө.");
    } else {
      if (!address.province) return setError("Аймаг сонгоно уу.");
      if (!address.soum.trim()) return setError("Сум / дүүрэг бөглөнө үү.");
      if (!address.terminalName.trim())
        return setError("Хүлээн авах унаа / терминал заавал бөглөнө.");
    }

    const qtyNum = Number(qty);
    if (!qty.trim() || Number.isNaN(qtyNum) || qtyNum < 1) {
      return setError("Тоо ширхэг зөв тоо байх ёстой.");
    }

    const product = products.find((p) => p.id === productId);

    // Бараа сонгосон бол боломжит үлдэгдлийг шалгана.
    if (product) {
      const available = product.availableQty ?? 0;
      if (available <= 0) {
        return setError("Сонгосон бараа дууссан байна.");
      }
      if (qtyNum > available) {
        return setError(`Боломжит үлдэгдэл ${available} ш. Түүнээс илүү захиалах боломжгүй.`);
      }
    }

    const isCity = address.deliveryType === "city";
    const receiverAddress = buildReceiverAddress(address);

    const payload: OrderInput = {
      companyId,
      companyName,
      receiverName,
      receiverPhone,
      receiverAddress,
      deliveryType: address.deliveryType,
      // Зөвхөн сонгосон бүсэд хамаарах талбаруудыг дамжуулна.
      cityDistrict: isCity ? address.cityDistrict : undefined,
      cityKhoroo: isCity ? address.cityKhoroo : undefined,
      street: isCity ? address.street : undefined,
      building: isCity ? address.building : undefined,
      entrance: isCity ? address.entrance : undefined,
      entranceCode: isCity ? address.entranceCode : undefined,
      province: isCity ? undefined : address.province,
      soum: isCity ? undefined : address.soum,
      terminalName: isCity ? undefined : address.terminalName,
      addressNote: address.addressNote,
      location: isCity ? address.location : undefined,
      itemName,
      productId: product?.id,
      productName: product?.name,
      qty: qtyNum,
      // Хүргэлтийн үнэ — гэрээт байгууллагын contractPrice (partner өөрчлөхгүй).
      deliveryPrice: contractPrice,
      codAmount: Number(codAmount) || 0,
      note,
      createdByUid: profile?.uid,
    };

    setBusy(true);
    try {
      const { id, orderCode } = await addOrder(payload);
      // Activity бүртгэх (амжилтгүй болсон ч захиалга үүссэн тул блокдохгүй).
      if (profile) {
        try {
          await logActivity({
            orderId: id,
            orderCode,
            action: "Захиалга үүсгэсэн",
            actorId: profile.uid,
            actorName: profile.name,
            actorRole: "partner",
          });
        } catch {
          /* лог амжаагүй ч үргэлжилнэ */
        }
      }
      router.push("/partner/orders");
    } catch {
      setError("Захиалга хадгалахад алдаа гарлаа. Дахин оролдоно уу.");
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      noValidate
    >
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      {/* Байгууллага (түгжээтэй) */}
      <div className="rounded-xl bg-slate-50 px-4 py-3">
        <p className="text-xs text-slate-500">Байгууллага</p>
        <p className="font-semibold text-navy">{companyName || "…"}</p>
      </div>

      <div>
        <label className={labelClass}>Бараа сонгох</label>
        <select
          className={inputClass}
          value={productId}
          onChange={(e) => handleProductChange(e.target.value)}
          disabled={busy}
        >
          <option value="">— Сонгох (заавал биш) —</option>
          {products.map((p) => (
            <option key={p.id} value={p.id} disabled={(p.availableQty ?? 0) <= 0}>
              {p.name} — {p.price.toLocaleString("mn-MN")}₮
              {(p.availableQty ?? 0) <= 0
                ? " (дууссан)"
                : ` (үлд: ${p.availableQty})`}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Барааны нэр</label>
        <input
          className={inputClass}
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          placeholder="Бараа сонгоход автоматаар бөглөгдөнө"
          disabled={busy}
        />
      </div>

      <div>
        <label className={labelClass}>Хүлээн авагчийн нэр *</label>
        <input
          className={inputClass}
          value={receiverName}
          onChange={(e) => setReceiverName(e.target.value)}
          disabled={busy}
        />
      </div>

      <div>
        <label className={labelClass}>Хүлээн авагчийн утас *</label>
        <input
          className={inputClass}
          value={receiverPhone}
          onChange={(e) => setReceiverPhone(e.target.value)}
          disabled={busy}
        />
      </div>

      {/* Хүргэлтийн бүс + бүтэцлэгдсэн хаяг */}
      <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
        <AddressForm value={address} onChange={setAddress} disabled={busy} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Тоо ширхэг *</label>
          <input
            className={inputClass}
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            disabled={busy}
          />
        </div>
        <div>
          <label className={labelClass}>COD дүн (₮)</label>
          <input
            className={inputClass}
            type="number"
            min={0}
            step={100}
            value={codAmount}
            onChange={(e) => setCodAmount(e.target.value)}
            disabled={busy}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Тэмдэглэл</label>
        <textarea
          className={`${inputClass} min-h-20 resize-y`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={busy}
        />
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.push("/partner/orders")}
          disabled={busy}
          className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-navy transition hover:bg-slate-50 disabled:opacity-60"
        >
          Болих
        </button>
        <button
          type="submit"
          disabled={busy}
          className="flex-1 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-60"
        >
          {busy ? "Хадгалж байна…" : "Захиалга үүсгэх"}
        </button>
      </div>
    </form>
  );
}
