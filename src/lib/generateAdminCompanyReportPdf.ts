// Админ талын "Харилцагч байгууллагын тайлан" PDF.
// Өгөгдөл, хүснэгт, фонт бүгд generateOrderReportPdf-тэй нэг — зөвхөн нэршил өөр.
import { generateOrderReportPdf, type PdfInput } from "@/lib/generateOrderReportPdf";

export type AdminCompanyPdfInput = Omit<
  PdfInput,
  "reportTitle" | "footerText" | "fileNamePrefix"
>;

export function generateAdminCompanyReportPdf(input: AdminCompanyPdfInput): Promise<void> {
  return generateOrderReportPdf({
    ...input,
    reportTitle: "Харилцагч байгууллагын захиалгын тайлан",
    footerText: "HurdExpress — Харилцагч байгууллагын тайлан",
    fileNamePrefix: "company-report",
  });
}
