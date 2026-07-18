"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { subscribeCompanies } from "@/lib/firebase/companies";
import { subscribeProducts } from "@/lib/firebase/products";
import { addOrder, type OrderInput } from "@/lib/firebase/orders";
import type { Company, Product } from "@/types";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-navy outline-none transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20";

const labelClass = "text-sm font-medium text-slate-600";

export default function OrderForm() {
  const router = useRouter();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [companyId, setCompanyId] = useState("");
  const [productId, setProductId] = useState("");
  const [itemName, setItemName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [receiverAddress, setReceiverAddress] = useState("");
  const [qty, setQty] = useState("1");
  const [codAmount, setCodAmount] = useState("0");
  const [deliveryPrice, setDeliveryPrice] = useState("6000");
  const [note, setNote] = useState("");
  const [prepaid, setPrepaid] = useState(false);

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const unsub = subscribeCompanies((list) => setCompanies(list), () => {});
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = subscribeProducts((list) => setProducts(list), () => {});
    return () => unsub();
  }, []);

  const activeCompanies = useMemo(
    () => companies.filter((c) => c.isActive),
    [companies],
  );

  // Сонгосон байгууллагын active бараанууд.
  const companyProducts = useMemo(
    () => products.filter((p) => p.isActive && p.companyId === companyId),
    [products, companyId],
  );

  const totalAmount = (Number(codAmount) || 0) + (Number(deliveryPrice) || 0);

  function handleCompanyChange(id: string) {
    setCompanyId(id);
    // Байгууллага солих үед барааны сонголтыг цэвэрлэнэ.
    setProductId("");
  }

  // COD = барааны үнэ × тоо ширхэг. Бараа эсвэл тоо ширхэг өөрчлөгдөх бүрт дахин бодно.
  // (Бараа сонгоогүй бол гараар оруулсан COD-д хүрэхгүй.)
  function recalcCod(pid: string, qtyStr: string) {
    const product = products.find((p) => p.id === pid);
    if (!product) return;
    const n = Number(qtyStr);
    if (!Number.isFinite(n) || n < 1) return;
    setCodAmount(String(product.price * n));
  }

  function handleProductChange(id: string) {
    setProductId(id);
    const product = products.find((p) => p.id === id);
    if (product) setItemName(product.name);
    recalcCod(id, qty);
  }

  function handleQtyChange(v: string) {
    setQty(v);
    recalcCod(productId, v);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!companyId) return setError("Харилцагч байгууллага сонгоно уу.");
    if (!receiverPhone.trim()) return setError("Хүлээн авагчийн утас заавал бөглөнө.");
    if (!receiverAddress.trim()) return setError("Хаяг заавал бөглөнө.");

    const qtyNum = Number(qty);
    if (!qty.trim() || Number.isNaN(qtyNum) || qtyNum < 1) {
      return setError("Тоо ширхэг зөв тоо байх ёстой.");
    }
    const deliveryNum = Number(deliveryPrice);
    if (!deliveryPrice.trim() || Number.isNaN(deliveryNum) || deliveryNum < 0) {
      return setError("Хүргэлтийн үнэ зөв тоо байх ёстой.");
    }
    const codNum = Number(codAmount) || 0;

    const companyName = activeCompanies.find((c) => c.id === companyId)?.name ?? "";
    const product = products.find((p) => p.id === productId);

    const payload: OrderInput = {
      companyId,
      companyName,
      // Нэрийн талбар маягтаас хасагдсан — хүснэгт/карт хоосон харагдахгүйн тулд
      // утасны дугаарыг таних тэмдэг болгож хадгална.
      receiverName: receiverPhone.trim(),
      receiverPhone,
      receiverAddress,
      itemName,
      productId: product?.id,
      productName: product?.name,
      productImageUrl: product?.thumbnailUrl || product?.photoUrl,
      qty: qtyNum,
      deliveryPrice: deliveryNum,
      codAmount: codNum,
      prepaid,
      note,
    };

    setBusy(true);
    try {
      await addOrder(payload);
      router.push("/admin/orders");
    } catch {
      setError("Захиалга хадгалахад алдаа гарлаа. Дахин оролдоно уу.");
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      noValidate
    >
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      {/* Байгууллага + бараа */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Харилцагч байгууллага *</label>
          <select
            className={inputClass}
            value={companyId}
            onChange={(e) => handleCompanyChange(e.target.value)}
            disabled={busy}
          >
            <option value="">— Сонгох —</option>
            {activeCompanies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Бараа сонгох</label>
          <select
            className={inputClass}
            value={productId}
            onChange={(e) => handleProductChange(e.target.value)}
            disabled={busy || !companyId}
          >
            <option value="">
              {companyId ? "— Сонгох (заавал биш) —" : "Эхлээд байгууллага сонго"}
            </option>
            {companyProducts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.price.toLocaleString("mn-MN")}₮
              </option>
            ))}
          </select>
        </div>
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

      {/* Хүлээн авагч */}
      <div>
        <label className={labelClass}>Хүлээн авагчийн утас *</label>
        <input
          className={inputClass}
          value={receiverPhone}
          onChange={(e) => setReceiverPhone(e.target.value)}
          disabled={busy}
        />
      </div>

      <div>
        <label className={labelClass}>Хаяг *</label>
        <input
          className={inputClass}
          value={receiverAddress}
          onChange={(e) => setReceiverAddress(e.target.value)}
          disabled={busy}
        />
      </div>

      {/* Тоо, мөнгөн дүн */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass}>Тоо ширхэг *</label>
          <input
            className={inputClass}
            type="number"
            min={1}
            value={qty}
            onChange={(e) => handleQtyChange(e.target.value)}
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
        <div>
          <label className={labelClass}>Хүргэлтийн үнэ (₮) *</label>
          <input
            className={inputClass}
            type="number"
            min={0}
            step={100}
            value={deliveryPrice}
            onChange={(e) => setDeliveryPrice(e.target.value)}
            disabled={busy}
          />
        </div>
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

      {/* Нийт дүн */}
      <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
        <span className="text-sm font-medium text-slate-600">Нийт дүн (COD + хүргэлт)</span>
        <span className="text-lg font-bold text-navy">
          {totalAmount.toLocaleString("mn-MN")}₮
        </span>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.push("/admin/orders")}
          disabled={busy}
          className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-navy transition hover:bg-slate-50 disabled:opacity-60 sm:flex-none sm:px-6"
        >
          Болих
        </button>
        <button
          type="submit"
          disabled={busy}
          className="flex-1 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-60 sm:flex-none sm:px-6"
        >
          {busy ? "Хадгалж байна…" : "Захиалга үүсгэх"}
        </button>
      </div>
    </form>
  );
}
