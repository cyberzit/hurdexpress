import StatusBadge from "@/components/admin/StatusBadge";
import Card from "@/components/ui/Card";
import { formatCurrency } from "@/lib/format";
import type { Order } from "@/types";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-navy">{value}</span>
    </div>
  );
}

// Захиалгын бүх мэдээллийг харуулах дахин ашиглах карт (admin/partner/driver).
export default function OrderDetailCard({ order }: { order: Order }) {
  const item = order.productName || order.itemName || "—";
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.receiverAddress)}`;

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

      {/* Бараа + дүн */}
      <Card>
        <Row label="Бараа" value={item} />
        <div className="mt-2">
          <Row label="Тоо ширхэг" value={order.qty} />
        </div>
        <div className="mt-2">
          <Row label="COD дүн" value={formatCurrency(order.codAmount)} />
        </div>
        <div className="mt-2">
          <Row label="Хүргэлтийн үнэ" value={formatCurrency(order.deliveryPrice)} />
        </div>
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
      </Card>

      {/* Жолооч */}
      <Card>
        <p className="text-xs uppercase tracking-wide text-slate-400">Жолооч</p>
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
