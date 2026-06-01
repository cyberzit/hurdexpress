import type { ReactNode } from "react";

interface Props {
  icon?: ReactNode;
  title: string;
  description?: string;
}

// Нэгдсэн empty state — жагсаалт хоосон / илэрц олдоогүй үед.
export default function EmptyState({ icon = "📭", title, description }: Props) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
      <p className="text-3xl">{icon}</p>
      <p className="mt-2 font-medium text-navy">{title}</p>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
    </div>
  );
}
