import Card from "@/components/ui/Card";
import { ORDER_STATUS_LABELS, type Order, type OrderStatus } from "@/types";
import { formatDateTime } from "@/lib/format";

const STEPS: OrderStatus[] = [
  "pending",
  "assigned",
  "picked_up",
  "on_the_way",
  "delivered",
];

export default function OrderStatusTimeline({ order }: { order: Order }) {
  // failed / cancelled — тусдаа warning.
  if (order.status === "failed" || order.status === "cancelled") {
    const isFailed = order.status === "failed";
    return (
      <Card>
        <div
          className={`rounded-xl px-4 py-3 ${
            isFailed ? "bg-red-50 text-red-700" : "bg-slate-50 text-slate-600"
          }`}
        >
          <p className="flex items-center gap-2 text-sm font-semibold">
            <span>{isFailed ? "⚠️" : "🚫"}</span>
            {ORDER_STATUS_LABELS[order.status]}
          </p>
          {(order.failedReason || order.cancelReason) && (
            <p className="mt-1 text-xs opacity-80">
              Шалтгаан: {order.failedReason || order.cancelReason}
            </p>
          )}
        </div>
      </Card>
    );
  }

  const activeIndex = STEPS.indexOf(order.status);
  const tsFor = (s: OrderStatus): number | undefined => {
    if (s === "pending") return order.createdAt;
    if (s === "assigned") return order.assignedAt;
    if (s === "picked_up") return order.pickedUpAt;
    if (s === "delivered") return order.deliveredAt;
    return undefined;
  };

  return (
    <Card>
      <h2 className="mb-4 text-sm font-bold text-navy">Захиалгын явц</h2>
      <ol>
        {STEPS.map((step, i) => {
          const done = i <= activeIndex;
          const current = i === activeIndex;
          const isLast = i === STEPS.length - 1;
          const ts = tsFor(step);
          return (
            <li key={step} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={`h-4 w-4 shrink-0 rounded-full border-2 transition ${
                    done ? "border-brand bg-brand" : "border-slate-300 bg-white"
                  } ${current ? "ring-2 ring-brand/30" : ""}`}
                />
                {!isLast && (
                  <span
                    className={`min-h-8 w-0.5 flex-1 ${
                      i < activeIndex ? "bg-brand" : "bg-slate-200"
                    }`}
                  />
                )}
              </div>
              <div className={isLast ? "" : "pb-5"}>
                <p
                  className={`text-sm ${
                    done ? "font-semibold text-navy" : "text-slate-400"
                  }`}
                >
                  {ORDER_STATUS_LABELS[step]}
                </p>
                {done && ts && (
                  <p className="text-xs text-slate-400">{formatDateTime(ts)}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
