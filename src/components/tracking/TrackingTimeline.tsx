import { TIMELINE_STEPS, TRACKING_STATUS_LABELS } from "@/lib/tracking-status";
import type { OrderStatus } from "@/types";

export default function TrackingTimeline({ status }: { status: OrderStatus }) {
  // failed / cancelled — timeline-ийн оронд warning харуулна.
  if (status === "failed" || status === "cancelled") {
    const isFailed = status === "failed";
    return (
      <div
        className={`rounded-xl border px-4 py-3 ${
          isFailed
            ? "border-red-200 bg-red-50 text-red-700"
            : "border-slate-200 bg-slate-50 text-slate-600"
        }`}
      >
        <p className="flex items-center gap-2 text-sm font-semibold">
          <span>{isFailed ? "⚠️" : "🚫"}</span>
          {TRACKING_STATUS_LABELS[status]}
        </p>
        <p className="mt-1 text-xs opacity-80">
          {isFailed
            ? "Хүргэлт амжилтгүй болсон. Дэлгүүртэй холбогдоно уу."
            : "Энэ захиалга цуцлагдсан байна."}
        </p>
      </div>
    );
  }

  const activeIndex = TIMELINE_STEPS.indexOf(status);

  return (
    <ol>
      {TIMELINE_STEPS.map((step, i) => {
        const done = i <= activeIndex;
        const current = i === activeIndex;
        const isLast = i === TIMELINE_STEPS.length - 1;
        return (
          <li key={step} className="flex gap-3">
            {/* Dot + line */}
            <div className="flex flex-col items-center">
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full border-2 transition ${
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
            {/* Label */}
            <div className={`pb-6 ${isLast ? "pb-0" : ""}`}>
              <p
                className={`text-sm ${
                  done ? "font-semibold text-navy" : "text-slate-400"
                }`}
              >
                {TRACKING_STATUS_LABELS[step]}
              </p>
              {current && (
                <p className="text-xs text-brand-dark">Одоогийн төлөв</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
