// Партнёрын захиалгын тайлан PDF — ерөнхий цөмийг нэр/хөл/файлын нэрээр тохируулна.
import { generateOrderReportPdf, type PdfInput } from "@/lib/generateOrderReportPdf";

export type PartnerPdfInput = Omit<
  PdfInput,
  "reportTitle" | "footerText" | "fileNamePrefix"
>;

export function generatePartnerReportPdf(input: PartnerPdfInput): Promise<void> {
  return generateOrderReportPdf({
    ...input,
    reportTitle: "Захиалгын тайлан",
    footerText: "HurdExpress — Захиалгын тайлан",
    fileNamePrefix: "partner-report",
  });
}
