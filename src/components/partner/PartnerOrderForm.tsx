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
import type { OrderItem, Product } from "@/types";

// Маягтын нэг мөр — бараа + тоо ширхэг (тоог string-ээр барина, бичих явцад эвдрэхгүй).
interface ItemRow {
  productId: string;
  name: string;
  qty: string;
}

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

  // Нэг хаяг дээр олон бараа — мөр бүр нэг бараа.
  const [rows, setRows] = useState<ItemRow[]>([{ productId: "", name: "", qty: "1" }]);
  const [receiverPhone, setReceiverPhone] = useState("");
  const [address, setAddress] = useState<AddressValue>(EMPTY_ADDRESS);
  const [discount, setDiscount] = useState("");
  const [note, setNote] = useState("");
  const [prepaid, setPrepaid] = useState(false);

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

  function setRow(i: number, patch: Partial<ItemRow>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, { productId: "", name: "", qty: "1" }]);
  }

  function removeRow(i: number) {
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i)));
  }

  // Мөр бүрийн бараа + дүн. Бараа сонгоогүй мөр 0 үнэтэй.
  const lines = rows.map((r) => {
    const product = products.find((p) => p.id === r.productId);
    const q = Math.max(0, Number(r.qty) || 0);
    const price = product?.price ?? 0;
    return { row: r, product, qty: q, price, subtotal: price * q };
  });

  const goodsTotal = lines.reduce((s, l) => s + l.subtotal, 0);
  const discountNum = Math.max(0, Number(discount) || 0);
  const grandTotal = Math.max(0, goodsTotal + contractPrice - discountNum);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!companyId) return setError("Байгууллага холбогдоогүй байна.");
    if (!receiverPhone.trim()) return setError("Хүлээн авагчийн утас заавал бөглөнө.");

    // Хүргэлтийн бүсээс хамаарсан хаягийн шалгалт.
    if (address.deliveryType === "city") {
      if (!address.cityDistrict) return setError("Дүүрэг сонгоно уу.");
      if (!address.addressNote.trim())
        return setError("Хаягийн дэлгэрэнгүй заавал бөглөнө.");
    } else {
      if (!address.province) return setError("Аймаг сонгоно уу.");
      if (!address.soum.trim()) return setError("Сум / дүүрэг бөглөнө үү.");
      if (!address.terminalName.trim())
        return setError("Хүлээн авах унаа / терминал заавал бөглөнө.");
    }

    // Барааны мөрүүдийн шалгалт.
    const filled = lines.filter((l) => l.product || l.row.name.trim());
    if (filled.length === 0) return setError("Дор хаяж нэг бараа оруулна уу.");

    for (const l of filled) {
      if (l.qty < 1) return setError("Тоо ширхэг 1-ээс багагүй байх ёстой.");
      if (!l.product) continue;
      const available = l.product.availableQty ?? 0;
      if (available <= 0) return setError(`"${l.product.name}" бараа дууссан байна.`);
      if (l.qty > available) {
        return setError(
          `"${l.product.name}" — боломжит үлдэгдэл ${available} ш. Түүнээс илүү захиалах боломжгүй.`,
        );
      }
    }

    // Нэг бараа хоёр мөрөнд давхардвал үлдэгдлийн шалгалт буруу болно.
    const picked = filled.map((l) => l.product?.id).filter(Boolean);
    if (new Set(picked).size !== picked.length) {
      return setError("Нэг барааг хоёр мөрөнд оруулсан байна. Тоо ширхэгийг нь нэгтгэнэ үү.");
    }

    const items: OrderItem[] = filled.map((l) => ({
      ...(l.product?.id ? { productId: l.product.id } : {}),
      productName: l.product?.name ?? l.row.name.trim(),
      ...(l.product?.thumbnailUrl || l.product?.photoUrl
        ? { productImageUrl: l.product.thumbnailUrl || l.product.photoUrl }
        : {}),
      qty: l.qty,
      price: l.price,
      subtotal: l.subtotal,
    }));

    const isCity = address.deliveryType === "city";
    const receiverAddress = buildReceiverAddress(address);

    const payload: OrderInput = {
      companyId,
      companyName,
      // Нэрийн талбар маягтаас хасагдсан — жагсаалт/карт хоосон харагдахгүйн тулд
      // утасны дугаарыг таних тэмдэг болгож хадгална (admin маягттай ижил).
      receiverName: receiverPhone.trim(),
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
      // items өгсөн тул itemName/qty/codAmount-ыг addOrder өөрөө бодно.
      items,
      itemName: "",
      qty: 0,
      // Хүргэлтийн үнэ — гэрээт байгууллагын contractPrice (partner өөрчлөхгүй).
      deliveryPrice: contractPrice,
      codAmount: 0,
      discount: discountNum,
      prepaid,
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
      className="max-w-2xl space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
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

      {/* Барааны мөрүүд — нэг хаяг дээр олон бараа */}
      <div className="rounded-xl border border-slate-200 p-3.5">
        <div className="mb-2.5 flex items-center justify-between">
          <label className={labelClass}>Бараанууд *</label>
          <span className="text-xs text-slate-400">{rows.length} мөр</span>
        </div>

        <div className="space-y-2.5">
          {lines.map((l, i) => (
            <div key={i} className="rounded-xl bg-slate-50 p-2.5">
              <div className="flex gap-2">
                <select
                  className={`${inputClass} flex-1`}
                  value={l.row.productId}
                  onChange={(e) => {
                    const p = products.find((x) => x.id === e.target.value);
                    setRow(i, { productId: e.target.value, name: p?.name ?? "" });
                  }}
                  disabled={busy}
                >
                  <option value="">— Бараа сонгох —</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id} disabled={(p.availableQty ?? 0) <= 0}>
                      {p.name} — {p.price.toLocaleString("mn-MN")}₮
                      {(p.availableQty ?? 0) <= 0 ? " (дууссан)" : ` (үлд: ${p.availableQty})`}
                    </option>
                  ))}
                </select>
                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    disabled={busy}
                    aria-label="Мөр устгах"
                    className="shrink-0 rounded-xl border border-red-200 px-3 text-lg font-bold text-red-500 transition hover:bg-red-50"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="mt-2 flex items-center gap-2">
                <div className="w-28">
                  <input
                    className={inputClass}
                    type="number"
                    min={1}
                    value={l.row.qty}
                    onChange={(e) => setRow(i, { qty: e.target.value })}
                    disabled={busy}
                    aria-label="Тоо ширхэг"
                  />
                </div>
                <span className="text-sm text-slate-400">ш ×</span>
                <span className="text-sm text-slate-500">
                  {l.price.toLocaleString("mn-MN")}₮
                </span>
                <span className="ml-auto text-sm font-bold text-navy">
                  {l.subtotal.toLocaleString("mn-MN")}₮
                </span>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addRow}
          disabled={busy}
          className="mt-2.5 w-full rounded-xl border-2 border-dashed border-slate-300 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-brand/50 hover:text-brand"
        >
          + Бараа нэмэх
        </button>
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

      <div>
        <label className={labelClass}>Хөнгөлөх дүн (₮)</label>
        <input
          className={inputClass}
          type="number"
          min={0}
          step={100}
          value={discount}
          onChange={(e) => setDiscount(e.target.value)}
          placeholder="0"
          disabled={busy}
        />
      </div>

      {/* Төлбөр төлөгдсөн эсэх — идэвхтэй бол жолооч мөнгө авахгүй */}
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
        <input
          type="checkbox"
          checked={prepaid}
          onChange={(e) => setPrepaid(e.target.checked)}
          disabled={busy}
          className="mt-0.5 h-5 w-5 rounded border-slate-300 text-green-600 focus:ring-green-500/30"
        />
        <span>
          <span className="block text-sm font-semibold text-navy">
            Төлбөр төлөгдсөн
          </span>
          <span className="block text-xs text-green-700">
            Идэвхжүүлбэл жолооч энэ захиалгад мөнгө авахгүй.
          </span>
        </span>
      </label>

      <div>
        <label className={labelClass}>Тэмдэглэл</label>
        <textarea
          className={`${inputClass} min-h-20 resize-y`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={busy}
        />
      </div>

      {/* Нийт дүнгийн задаргаа */}
      <div className="space-y-1.5 rounded-xl bg-slate-50 px-4 py-3 text-sm">
        <div className="flex justify-between text-slate-600">
          <span>Барааны үнэ ({lines.reduce((s, l) => s + l.qty, 0)} ш)</span>
          <span>{goodsTotal.toLocaleString("mn-MN")}₮</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Хүргэлтийн үнэ</span>
          <span>{contractPrice.toLocaleString("mn-MN")}₮</span>
        </div>
        {discountNum > 0 && (
          <div className="flex justify-between text-red-600">
            <span>Хөнгөлөлт</span>
            <span>−{discountNum.toLocaleString("mn-MN")}₮</span>
          </div>
        )}
        <div className="flex justify-between border-t border-slate-200 pt-1.5 text-base font-bold text-navy">
          <span>Нийт төлбөр</span>
          <span>{grandTotal.toLocaleString("mn-MN")}₮</span>
        </div>
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
