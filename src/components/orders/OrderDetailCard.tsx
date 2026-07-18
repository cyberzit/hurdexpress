import StatusBadge from "@/components/admin/StatusBadge";
import ProductImageViewer from "@/components/orders/ProductImageViewer";
import Card from "@/components/ui/Card";
import { formatCurrency } from "@/lib/format";
import { DELIVERY_TYPE_LABELS, type Order } from "@/types";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-navy">{value}</span>
    </div>
  );
}

// Утгатай үед л мөр харуулна (бүтэцлэгдсэн хаягт).
function OptRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return <Row label={label} value={value} />;
}

// Захиалгын бүх мэдээллийг харуулах дахин ашиглах карт (admin/partner/driver).
// hideDeliveryFee — partner-д хүргэлтийн үнэ/нийт дүн нуух (гэрээт үнэ дотоод).
export default function OrderDetailCard({
  order,
  hideDeliveryFee = false,
  driverView = false,
}: {
  order: Order;
  hideDeliveryFee?: boolean;
  // driverView — жолоочид зөвхөн "Авах төлбөр" (бараа + хүргэлт нийлбэр) харагдана.
  driverView?: boolean;
}) {
  const item = order.productName || order.itemName || "—";
  const items = order.items ?? [];
  const hasItems = items.length > 0;
  const mapsUrl = order.location
    ? `https://www.google.com/maps?q=${order.location.lat},${order.location.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.receiverAddress)}`;
  const isCity = order.deliveryType === "city";
  const isProvince = order.deliveryType === "province";

  return (
    <div className="space-y-3">
      {/* Толгой */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-2xl font-bold text-navy">{order.orderCode}</p>
          <p className="text-sm text-slate-500">{order.companyName}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Жолооч хойшлуулсан бол — аль өдөр рүү шилжсэн, шалтгаан нь юу вэ. */}
      {order.scheduledDate && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-bold text-amber-800">
            📅 Хойшлуулсан · {order.scheduledDate}
          </p>
          {order.postponedNote && (
            <p className="mt-0.5 text-xs text-amber-700">{order.postponedNote}</p>
          )}
        </div>
      )}

      {/* Хүлээн авагч */}
      <Card>
        <p className="text-xs uppercase tracking-wide text-slate-400">Хүлээн авагч</p>
        <p className="mt-1 text-lg font-semibold text-navy">{order.receiverName}</p>
        <a href={`tel:${order.receiverPhone}`} className="text-slate-500 hover:text-brand">
          {order.receiverPhone}
        </a>
        <p className="mt-1 text-slate-600">{order.receiverAddress}</p>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-sm font-medium text-brand hover:underline"
        >
          🗺️ Google Maps дээр нээх
        </a>
      </Card>

      {/* Хүргэлтийн бүс + бүтэцлэгдсэн хаяг (deliveryType-тай захиалгад) */}
      {order.deliveryType && (
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-slate-400">Хүргэх хаяг</p>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                isProvince ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"
              }`}
            >
              {DELIVERY_TYPE_LABELS[order.deliveryType]}
            </span>
          </div>

          <div className="mt-3 space-y-2">
            {isCity && (
              <>
                <OptRow label="Дүүрэг" value={order.cityDistrict} />
                <OptRow label="Хороо / баг" value={order.cityKhoroo} />
                <OptRow label="Гудамж / хороолол" value={order.street} />
                <OptRow label="Байр" value={order.building} />
                <OptRow label="Орц / тоот" value={order.entrance} />
                <OptRow label="Орцны код" value={order.entranceCode} />
              </>
            )}
            {isProvince && (
              <>
                <OptRow label="Аймаг" value={order.province} />
                <OptRow label="Сум / дүүрэг" value={order.soum} />
                <OptRow label="Унаа / терминал" value={order.terminalName} />
              </>
            )}
            <OptRow label="Нэмэлт тайлбар" value={order.addressNote} />
          </div>

          {isProvince && (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              📦 Орон нутгийн унаанд тавьж хүргүүлнэ.
            </p>
          )}
        </Card>
      )}

      {/* Бараа + дүн */}
      <Card>
        {/* Нэг бараатай захиалгад л том зураг — олон бараатайд мөр бүрд нь гарна. */}
        {order.productImageUrl && !hasItems && (
          <div className="mb-3 flex items-center gap-3">
            <ProductImageViewer url={order.productImageUrl} alt={item} />
            <p className="text-sm font-medium text-navy">{item}</p>
          </div>
        )}
        {hasItems ? (
          /* Олон бараатай захиалга — мөр бүрээр задалж харуулна. */
          <div className="space-y-1.5">
            <p className="text-sm text-slate-500">Бараанууд</p>
            {items.map((it, i) => (
              <div
                key={`${it.productId ?? it.productName}-${i}`}
                className="flex items-center gap-2.5 border-b border-slate-100 py-1.5 text-sm last:border-0"
              >
                {it.productImageUrl ? (
                  <ProductImageViewer url={it.productImageUrl} alt={it.productName} small />
                ) : (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-base">
                    📦
                  </span>
                )}
                <span className="min-w-0 flex-1 font-medium text-navy">
                  {it.productName}
                  <span className="ml-1.5 text-slate-400">×{it.qty}</span>
                </span>
                <span className="whitespace-nowrap text-slate-600">
                  {formatCurrency(it.subtotal)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <>
            <Row label="Бараа" value={item} />
            <div className="mt-2">
              <Row label="Тоо ширхэг" value={order.qty} />
            </div>
          </>
        )}
        {/* Жолоочид задаргаа хэрэггүй — зөвхөн авах нийт төлбөр. */}
        {driverView ? (
          <div className="mt-3 border-t border-slate-100 pt-2">
            <Row
              label="Авах төлбөр"
              value={
                order.prepaid ? (
                  <span className="font-bold text-green-700">Төлөгдсөн</span>
                ) : (
                  <span className="text-base font-bold text-navy">
                    {formatCurrency(order.totalAmount)}
                  </span>
                )
              }
            />
          </div>
        ) : (
          <div className="mt-2">
            <Row
              label="Төлбөрийн дүн"
              value={
                order.prepaid ? (
                  <span className="text-green-700">
                    {formatCurrency(order.codAmount)} · төлөгдсөн
                  </span>
                ) : (
                  formatCurrency(order.codAmount)
                )
              }
            />
          </div>
        )}
        {!hideDeliveryFee && !driverView && (
          <>
            <div className="mt-2">
              <Row label="Хүргэлтийн үнэ" value={formatCurrency(order.deliveryPrice)} />
            </div>
            {/* Хөнгөлөлт нийт дүнгээс хасагдсан — ил харуулахгүй бол тоо зөрж харагдана. */}
            {(order.discount ?? 0) > 0 && (
              <div className="mt-2">
                <Row
                  label="Хөнгөлөлт"
                  value={
                    <span className="text-red-600">
                      −{formatCurrency(order.discount ?? 0)}
                    </span>
                  }
                />
              </div>
            )}
            <div className="mt-3 border-t border-slate-100 pt-2">
              <Row
                label="Нийт дүн"
                value={
                  <span className="text-base font-bold text-navy">
                    {formatCurrency(order.totalAmount)}
                  </span>
                }
              />
            </div>
          </>
        )}
      </Card>

      {/* Жолооч */}
      <Card>
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-wide text-slate-400">Жолооч</p>
          {order.autoAssigned && order.driverName && (
            <span className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand-dark">
              🤖 Авто оноосон
            </span>
          )}
        </div>
        {order.driverName ? (
          <>
            <p className="mt-1 font-semibold text-navy">{order.driverName}</p>
            {order.driverPhone && (
              <a
                href={`tel:${order.driverPhone}`}
                className="text-slate-500 hover:text-brand"
              >
                {order.driverPhone}
              </a>
            )}
          </>
        ) : (
          <p className="mt-1 text-sm text-slate-400">Хараахан оноогоогүй</p>
        )}
      </Card>

      {order.note && (
        <Card>
          <p className="text-xs uppercase tracking-wide text-slate-400">Тэмдэглэл</p>
          <p className="mt-1 text-sm text-slate-600">{order.note}</p>
        </Card>
      )}
    </div>
  );
}
