import type { InputHTMLAttributes, ReactNode } from "react";

export const fieldClass =
  "w-full rounded-xl border bg-slate-50 px-4 py-2.5 text-sm text-navy outline-none transition " +
  "focus:bg-white focus:ring-2 focus:ring-brand/20 disabled:opacity-60";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  error?: string;
}

let autoId = 0;

export default function Input({ label, error, id, className = "", ...props }: Props) {
  const inputId = id ?? `input-${++autoId}`;
  return (
    <div>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-600">
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        className={[
          label ? "mt-1.5" : "",
          fieldClass,
          error ? "border-red-400 focus:border-red-400" : "border-slate-200 focus:border-brand",
          className,
        ].join(" ")}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
