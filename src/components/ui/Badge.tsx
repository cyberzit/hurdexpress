import type { ReactNode } from "react";

type Tone = "navy" | "orange" | "green" | "amber" | "blue" | "red" | "slate";

const TONES: Record<Tone, string> = {
  navy: "bg-navy/10 text-navy",
  orange: "bg-brand/10 text-brand-dark",
  green: "bg-green-50 text-green-700",
  amber: "bg-amber-50 text-amber-700",
  blue: "bg-blue-50 text-blue-700",
  red: "bg-red-50 text-red-600",
  slate: "bg-slate-100 text-slate-500",
};

interface Props {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}

// Ерөнхий pill badge. Тодорхой класс өгөх бол `className` ашиглана.
export default function Badge({ tone = "slate", className = "", children }: Props) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
        className || TONES[tone]
      }`}
    >
      {children}
    </span>
  );
}
