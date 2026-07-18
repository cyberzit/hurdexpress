import { ORDER_STATUS_BADGE, orderStatusLabel } from "@/lib/status";
import type { OrderStatus } from "@/types";

export default function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${ORDER_STATUS_BADGE[status]}`}
    >
      {orderStatusLabel(status)}
    </span>
  );
}
