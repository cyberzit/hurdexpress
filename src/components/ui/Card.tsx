import type { HTMLAttributes, ReactNode } from "react";

interface Props extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
  children: ReactNode;
}

// Нэгдсэн card — rounded-2xl, soft shadow, slate border.
export default function Card({ padded = true, className = "", children, ...props }: Props) {
  return (
    <div
      className={[
        "rounded-2xl border border-slate-200 bg-white shadow-sm",
        padded ? "p-5 sm:p-6" : "",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
