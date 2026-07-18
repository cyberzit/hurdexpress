"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import DriverOrderCard from "@/components/driver/DriverOrderCard";
import LocationShareToggle from "@/components/driver/LocationShareToggle";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import LoadingState from "@/components/ui/LoadingState";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeOrdersByDriver } from "@/lib/firebase/orders";
import { dateKeyOf } from "@/lib/firebase/driverSettlement";
import { getListScroll } from "@/lib/listScroll";
import { ORDER_STATUS_LABELS, type Order, type OrderStatus } from "@/types";

// Шүүлтүүрийн chip-үүд. "Бараа авсан" + "Замдаа" нь нэг "Жолооч хүлээн авсан"
// болж нэгдсэн тул picked_up chip нь on_the_way-г ч хамруулна.
const FILTERS: { key: OrderStatus; match: OrderStatus[] }[] = [
  { key: "assigned", match: ["assigned"] },
  { key: "picked_up", match: ["picked_up", "on_the_way"] },
  { key: "delivered", match: ["delivered"] },
  { key: "failed", match: ["failed"] },
];

// Байршил хуваалцах toggle-д — идэвхтэй захиалга байгаа эсэх.
const DRIVER_STATUSES: OrderStatus[] = [
  "assigned",
  "picked_up",
  "on_the_way",
  "delivered",
  "failed",
];

// Захиалга аль өдрийн хүргэлтэд хамаарах вэ:
//   хойшлуулсан бол сонгосон огноо, эс бөгөөс жолоочид оноосон (эсвэл үүсгэсэн) өдөр.
function orderDayKey(o: Order): string {
  if (o.scheduledDate) return o.scheduledDate;
  return dateKeyOf(new Date(o.assignedAt ?? o.createdAt));
}

function dayLabel(key: string): string {
  const [y, m, d] = key.split("-");
  return `${y}.${m}.${d}`;
}

// Дэлгэрэнгүй рүү ороод буцахад жагсаалтын харагдац хэвээр үлдэх ёстой.
// Модулийн хувьсагч — SPA навигацийн туршид амьд, hydration зөрчил үүсгэхгүй
// (бүрэн refresh дээр анхны утга руу буцна, энэ нь зөв).
const lastView = { period: "today", status: "" as OrderStatus | "", search: "" };

// Статусын шүүлтүүрийн chip — баруун дээд буланд тоон badge.
function Chip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition ${
        active ? "bg-navy text-white" : "border border-slate-200 bg-white text-slate-500"
      }`}
    >
      {label}
      {count > 0 && (
        <span
          className={`absolute -right-1.5 -top-2 min-w-5 rounded-full px-1.5 py-0.5 text-[11px] font-bold leading-none shadow-sm ${
            active ? "bg-brand text-white" : "bg-navy text-white"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// Утасны дугаарыг зөвхөн цифрээр харьцуулна ("9910-2443" → "99102443").
function digits(s: string): string {
  return s.replace(/\D/g, "");
}

export default function DriverOrdersPage() {
  const { user, profile } = useAuth();
  const driverId = profile?.driverId ?? user?.uid ?? "";

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Буцаж ирэхэд өмнөх харагдацаа сэргээнэ.
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">(lastView.status);
  // "today" эсвэл тодорхой өдөр "YYYY-MM-DD".
  const [period, setPeriod] = useState<string>(lastView.period);
  const [search, setSearch] = useState(lastView.search);
  const [todayKey] = useState(() => dateKeyOf(new Date()));

  // Сонголтыг handler дотор санана (render цэвэр байх ёстой).
  function changePeriod(p: string) {
    lastView.period = p;
    setPeriod(p);
  }
  function changeStatus(s: OrderStatus | "") {
    lastView.status = s;
    setStatusFilter(s);
  }
  function changeSearch(v: string) {
    lastView.search = v;
    setSearch(v);
  }

  useEffect(() => {
    if (!driverId) return;
    const unsub = subscribeOrdersByDriver(
      driverId,
      (list) => {
        setOrders(list);
        setLoading(false);
      },
      () => {
        setError("Захиалгуудыг ачаалахад алдаа гарлаа.");
        setLoading(false);
      },
    );
    return () => unsub();
  }, [driverId]);

  const q = search.trim().toLowerCase();
  const searching = q.length > 0;

  const inPeriod = useMemo(() => {
    const key = period === "today" ? todayKey : period;
    return orders.filter((o) => orderDayKey(o) === key);
  }, [orders, period, todayKey]);

  // Статусын шүүлтүүр хэрэглэхийн ӨМНӨХ багц — chip-үүдийн тоог үүнээс бодно.
  const beforeStatus = useMemo(() => {
    // Хайж байх үед огнооны хязгаарыг үл тоомсорлоно — жолооч тодорхой захиалга хайж байна.
    const base = searching ? orders : inPeriod;
    if (!searching) return base;
    const qDigits = digits(q);
    return base.filter((o) => {
      const haystack = [
        o.orderCode,
        o.receiverName,
        o.receiverAddress,
        o.productName,
        o.itemName,
        o.companyName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (haystack.includes(q)) return true;
      // Утасны дугаар — зураас/зайг үл тоомсорлон харьцуулна.
      return qDigits.length > 0 && digits(o.receiverPhone ?? "").includes(qDigits);
    });
  }, [orders, inPeriod, q, searching]);

  const filtered = useMemo(() => {
    if (!statusFilter) return beforeStatus;
    const match = FILTERS.find((f) => f.key === statusFilter)?.match ?? [statusFilter];
    return beforeStatus.filter((o) => match.includes(o.status));
  }, [beforeStatus, statusFilter]);

  // Chip бүрийн тоо (нэгтгэсэн статусуудыг нийлүүлж тооцно).
  const counts = useMemo(() => {
    const m = new Map<OrderStatus, number>();
    for (const f of FILTERS) {
      m.set(f.key, beforeStatus.filter((o) => f.match.includes(o.status)).length);
    }
    return m;
  }, [beforeStatus]);

  const todayCount = useMemo(
    () => orders.filter((o) => orderDayKey(o) === todayKey).length,
    [orders, todayKey],
  );

  // Байрлалыг "Дэлгэрэнгүй" дарах агшинд картаас нь хадгалдаг (listScroll.ts).
  // Энд зөвхөн СЭРГЭЭНЭ. Хоёр frame хүлээнэ: эхнийхэд картууд байрлана,
  // дараагийнхад хуудасны өндөр эцэслэгдэнэ (эс бөгөөс гүйлт тасалдана).
  const restoredRef = useRef(false);
  useEffect(() => {
    if (loading || restoredRef.current) return;
    restoredRef.current = true;
    const y = getListScroll();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => window.scrollTo(0, y));
    });
  }, [loading]);

  const hasActiveOrders = useMemo(
    () => orders.some((o) => DRIVER_STATUSES.includes(o.status) && o.status !== "delivered" && o.status !== "failed"),
    [orders],
  );

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="text-xl font-bold text-navy">Миний хүргэлтүүд</h1>
        <span className="shrink-0 rounded-full bg-brand/10 px-3 py-1 text-sm font-semibold text-brand">
          Өнөөдөр: {todayCount}
        </span>
      </div>

      {/* Байршил хуваалцах */}
      {driverId && (
        <div className="mt-3">
          <LocationShareToggle
            driverId={driverId}
            driverName={profile?.name ?? ""}
            hasActiveOrders={hasActiveOrders}
          />
        </div>
      )}

      {/* Хайлт — дугаар / утас / хаяг / бараа */}
      <div className="relative mt-3">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          🔍
        </span>
        <input
          type="search"
          inputMode="search"
          value={search}
          onChange={(e) => changeSearch(e.target.value)}
          placeholder="Дугаар, утас, хаяг, бараагаар хайх…"
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-navy outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        {searching && (
          <button
            type="button"
            onClick={() => changeSearch("")}
            aria-label="Хайлт цэвэрлэх"
            className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-navy"
          >
            ✕
          </button>
        )}
      </div>

      {/* Хугацааны filter — өнөөдөр / он сараар. Хайлт идэвхтэй үед утгагүй тул нуухна. */}
      <div className={`mt-3 flex items-center gap-2 ${searching ? "hidden" : ""}`}>
        <button
          onClick={() => changePeriod("today")}
          className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
            period === "today"
              ? "bg-brand text-white"
              : "border border-slate-200 bg-white text-slate-500"
          }`}
        >
          Өнөөдөр
        </button>
        <input
          type="date"
          value={period === "today" ? todayKey : period}
          onChange={(e) => changePeriod(e.target.value || "today")}
          aria-label="Огноогоор шүүх"
          className={`min-w-0 flex-1 rounded-full border px-3 py-1.5 text-sm font-medium outline-none transition ${
            period === "today"
              ? "border-slate-200 bg-white text-slate-500"
              : "border-brand bg-brand/10 text-brand"
          }`}
        />
      </div>

      <p className="mt-2 text-xs text-slate-500">
        {searching
          ? `Бүх захиалгаас хайж байна · ${filtered.length} олдлоо`
          : `${period === "today" ? "Өнөөдрийн хүргэлт" : dayLabel(period)} · ${inPeriod.length} захиалга`}
      </p>

      {/* Статус filter — chip-үүд. Баруун дээд буланд тоон badge.
          pt-2.5 — badge нь chip-ээс дээш гарах тул зай үлдээнэ. */}
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1 pt-2.5">
        <Chip
          label="Бүгд"
          count={beforeStatus.length}
          active={statusFilter === ""}
          onClick={() => changeStatus("")}
        />
        {FILTERS.map((f) => (
          <Chip
            key={f.key}
            label={ORDER_STATUS_LABELS[f.key]}
            count={counts.get(f.key) ?? 0}
            active={statusFilter === f.key}
            onClick={() => changeStatus(f.key)}
          />
        ))}
      </div>

      {error && (
        <div className="mt-4">
          <ErrorState message={error} />
        </div>
      )}

      <div className="mt-4">
        {loading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="🚚"
            title={
              searching
                ? `"${search.trim()}" — олдсонгүй`
                : statusFilter
                  ? "Энэ статустай захиалга алга"
                  : period === "today"
                    ? "Өнөөдөр хүргэх захиалга алга"
                    : `${dayLabel(period)} — захиалга алга`
            }
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((o) => (
              <DriverOrderCard key={o.id} order={o} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
