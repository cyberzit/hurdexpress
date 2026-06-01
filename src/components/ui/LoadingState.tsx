// Нэгдсэн loading spinner (card дотор).
export default function LoadingState({ label = "Ачааллаж байна…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-16 text-sm text-slate-500 shadow-sm">
      <span className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-brand" />
      {label}
    </div>
  );
}

// Зөвхөн spinner (inline ашиглах).
export function Spinner({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-slate-300 border-t-brand ${className}`}
      role="status"
      aria-label="Ачааллаж байна"
    />
  );
}
