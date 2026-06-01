import { ORDER_STATUS_LABELS } from "@/types";
import { ORDER_STATUS_BAR } from "@/lib/status";
import type { StatusCount } from "@/lib/dashboard";

export default function DashboardStatusSummary({
  total,
  counts,
}: {
  total: number;
  counts: StatusCount[];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-navy">Өнөөдрийн статус</h2>
        <span className="text-xs text-slate-400">Нийт {total}</span>
      </div>

      {total === 0 ? (
        <p className="mt-4 text-sm text-slate-400">Өнөөдөр захиалга алга.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {counts
            .filter((c) => c.count > 0)
            .map((c) => {
              const pct = Math.round((c.count / total) * 100);
              return (
                <div key={c.status}>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">
                      {ORDER_STATUS_LABELS[c.status]}
                    </span>
                    <span className="text-slate-400">
                      {c.count} ({pct}%)
                    </span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${ORDER_STATUS_BAR[c.status]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
