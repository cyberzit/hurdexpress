"use client";

import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";

// orderCode → public tracking URL-ийн QR. URL-ийг mount дараа барина
// (origin серверт байхгүй тул hydration mismatch-аас сэргийлнэ).
export default function OrderQRCode({
  orderCode,
  size = 140,
}: {
  orderCode: string;
  size?: number;
}) {
  const [value, setValue] = useState("");

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const t = setTimeout(() => setValue(`${base}/track/view?code=${orderCode}`), 0);
    return () => clearTimeout(t);
  }, [orderCode]);

  if (!value) {
    return (
      <div
        style={{ width: size, height: size }}
        className="animate-pulse rounded-lg bg-slate-100"
      />
    );
  }

  return (
    <QRCodeSVG value={value} size={size} level="M" marginSize={1} />
  );
}
