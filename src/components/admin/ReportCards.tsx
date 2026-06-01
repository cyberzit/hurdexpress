import StatCard from "@/components/admin/StatCard";
import type { ReportSummary } from "@/lib/reports";

function mnt(n: number): string {
  return `${n.toLocaleString("mn-MN")}₮`;
}

export default function ReportCards({ summary }: { summary: ReportSummary }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard
        title="Нийт захиалга"
        value={summary.totalOrders.toLocaleString("mn-MN")}
        icon="📦"
        accent="navy"
      />
      <StatCard
        title="Амжилттай хүргэлт"
        value={summary.deliveredOrders.toLocaleString("mn-MN")}
        icon="✅"
        accent="green"
      />
      <StatCard
        title="Амжилтгүй хүргэлт"
        value={summary.failedOrders.toLocaleString("mn-MN")}
        icon="⚠️"
        accent="amber"
      />
      <StatCard
        title="Хүлээгдэж буй захиалга"
        value={summary.pendingOrders.toLocaleString("mn-MN")}
        icon="⏳"
        accent="blue"
      />
      <StatCard
        title="Нийт хүргэлтийн орлого"
        value={mnt(summary.deliveryFeeTotal)}
        icon="📈"
        accent="orange"
      />
      <StatCard
        title="Нийт COD дүн"
        value={mnt(summary.codTotal)}
        icon="💵"
        accent="navy"
      />
    </div>
  );
}
