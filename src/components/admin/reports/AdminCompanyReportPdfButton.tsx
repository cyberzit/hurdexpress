"use client";

import { useState } from "react";
import {
  generateAdminCompanyReportPdf,
  type AdminCompanyPdfInput,
} from "@/lib/generateAdminCompanyReportPdf";

interface Props {
  build: () => AdminCompanyPdfInput; // дарах агшинд шүүлтүүрийн БҮХ мөрийг цуглуулна
  disabled?: boolean;
  onError: (message: string) => void;
}

export default function AdminCompanyReportPdfButton({ build, disabled, onError }: Props) {
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    setBusy(true);
    try {
      await generateAdminCompanyReportPdf(build());
    } catch (e) {
      onError(
        e instanceof Error && e.message === "EMPTY"
          ? "Шүүлтүүрт таарах захиалга алга — татах тайлан байхгүй."
          : "PDF үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || busy}
      className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-50"
    >
      {busy ? "PDF тайлан бэлтгэж байна…" : "⬇ PDF татах"}
    </button>
  );
}
