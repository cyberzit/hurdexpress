// Харилцагчийн захиалгын тайлан → PDF (client-side, pdfmake).
//
// Яагаад pdfmake:
//  · Roboto фонт нь JS bundle дотор явна → /public-д ил гарахгүй, Монгол кирилл
//    (Ө, Ү, №) бүрэн дэмжинэ. HTML screenshot биш, жинхэнэ текст PDF.
//  · headerRows давтагдах, мөр тасрахгүй, урт текст автоматаар мөр шилжих
//    боломжийг сан өөрөө хангадаг.
// Bundle том тул зөвхөн товч дарах үед dynamic import хийнэ.
import { formatCurrency, formatDateISO, formatDateTimeISO } from "@/lib/format";
import { driverLabel, goodsAmount, productLabel, safeFileName } from "@/lib/orderReport";
import type { ReportSummary } from "@/lib/orderReport";
import { ORDER_STATUS_LABELS, type Order, type OrderStatus } from "@/types";

export interface PdfInput {
  orders: Order[]; // шүүлтүүрт таарсан БҮХ мөр (pagination-аас хамаарахгүй)
  reportTitle: string; // PDF гарчиг
  footerText: string; // хуудасны хөл
  fileNamePrefix: string; // файлын нэрийн угтвар
  companyName: string;
  start: string;
  end: string;
  driverName: string; // "Бүх жолооч" эсвэл нэр
  statusLabel: string; // "Бүх статус" эсвэл нэр
  summary: ReportSummary;
}

const HEAD = [
  "№",
  "Огноо",
  "Хүлээн авагч",
  "Утас",
  "Хаяг",
  "Бараа",
  "Тоо",
  "Барааны үнэ",
  "Жолооч",
  "Статус",
  "Хүргэгдсэн огноо",
  "Тэмдэглэл",
];

// A4 landscape (802pt ашиглах өргөн) дээр нийлбэр нь багтахаар сонгосон.
const WIDTHS = [16, 46, 74, 56, 150, 110, 22, 56, 60, 66, 62, 76];

function txt(v: unknown): string {
  const s = typeof v === "string" ? v : v == null ? "" : String(v);
  // Мөр таслах тэмдэгтүүд хүснэгтийн нүдийг эвдэхээс сэргийлнэ.
  return s.replace(/\s+/g, " ").trim() || "—";
}

export async function generateOrderReportPdf(input: PdfInput): Promise<void> {
  const {
    orders,
    companyName,
    start,
    end,
    driverName,
    statusLabel,
    summary,
    reportTitle,
    footerText,
    fileNamePrefix,
  } = input;
  if (orders.length === 0) throw new Error("EMPTY");

  const [pdfMakeMod, vfsMod] = await Promise.all([
    import("pdfmake/build/pdfmake"),
    import("pdfmake/build/vfs_fonts"),
  ]);
  const pdfMake = (pdfMakeMod as unknown as { default: typeof import("pdfmake/build/pdfmake") })
    .default ?? pdfMakeMod;
  const vfs = (vfsMod as unknown as { default?: unknown }).default ?? vfsMod;
  // pdfmake 0.3 — vfs-ийг ингэж холбоно (Roboto нь Cyrillic бүрэн агуулна).
  (pdfMake as unknown as { addVirtualFileSystem: (v: unknown) => void }).addVirtualFileSystem(
    vfs,
  );

  const body = [
    HEAD.map((h) => ({ text: h, style: "th" })),
    ...orders.map((o, i) => [
      { text: String(i + 1), style: "td" },
      { text: formatDateISO(o.createdAt), style: "td" },
      { text: txt(o.receiverName), style: "td" },
      { text: txt(o.receiverPhone), style: "td" },
      { text: txt(o.receiverAddress), style: "td" },
      { text: txt(productLabel(o)), style: "td" },
      { text: String(o.qty ?? 0), style: "tdNum" },
      { text: formatCurrency(goodsAmount(o)), style: "tdNum" },
      { text: txt(driverLabel(o)), style: "td" },
      { text: ORDER_STATUS_LABELS[o.status as OrderStatus] ?? txt(o.status), style: "td" },
      { text: o.deliveredAt ? formatDateISO(o.deliveredAt) : "—", style: "td" },
      { text: txt(o.driverNote || o.note), style: "td" },
    ]),
  ];

  const generatedAt = formatDateTimeISO(Date.now());

  const docDefinition = {
    pageSize: "A4",
    pageOrientation: "landscape",
    pageMargins: [20, 64, 20, 32] as [number, number, number, number],
    defaultStyle: { font: "Roboto", fontSize: 7 },

    // Толгой хуудас бүрт.
    header: (currentPage: number) => ({
      margin: [20, 16, 20, 0] as [number, number, number, number],
      stack: [
        {
          columns: [
            { text: "HurdExpress", style: "brand" },
            {
              text: `Үүсгэсэн: ${generatedAt}`,
              style: "meta",
              alignment: "right" as const,
            },
          ],
        },
        {
          text: `${reportTitle} — ${companyName}`,
          style: "title",
          margin: [0, 2, 0, 0] as [number, number, number, number],
        },
        {
          text:
            `Хугацаа: ${start} — ${end}   ·   Жолооч: ${driverName}   ·   ` +
            `Статус: ${statusLabel}   ·   Нийт захиалга: ${summary.total}   ·   ` +
            `Нийт барааны үнэ: ${formatCurrency(summary.goodsTotal)}`,
          style: "meta",
          margin: [0, 2, 0, 0] as [number, number, number, number],
        },
        ...(currentPage > 1 ? [] : []),
      ],
    }),

    footer: (currentPage: number, pageCount: number) => ({
      margin: [20, 0, 20, 0] as [number, number, number, number],
      columns: [
        { text: footerText, style: "meta" },
        {
          text: `Хуудас ${currentPage} / ${pageCount}`,
          style: "meta",
          alignment: "right" as const,
        },
      ],
    }),

    content: [
      {
        table: {
          headerRows: 1, // хуудас бүрт давтагдана
          dontBreakRows: true, // мөр хоёр хуудас дундуур тасрахгүй
          widths: WIDTHS,
          body,
        },
        layout: {
          hLineWidth: () => 0.4,
          vLineWidth: () => 0.4,
          hLineColor: () => "#cbd5e1",
          vLineColor: () => "#cbd5e1",
          fillColor: (rowIndex: number) =>
            rowIndex === 0 ? "#0f172a" : rowIndex % 2 === 0 ? "#f8fafc" : null,
          paddingTop: () => 3,
          paddingBottom: () => 3,
          paddingLeft: () => 3,
          paddingRight: () => 3,
        },
      },
    ],

    styles: {
      brand: { fontSize: 12, bold: true, color: "#ea580c" },
      title: { fontSize: 10, bold: true, color: "#0f172a" },
      meta: { fontSize: 7, color: "#475569" },
      th: { fontSize: 7, bold: true, color: "#ffffff" },
      td: { fontSize: 7, color: "#0f172a" },
      tdNum: { fontSize: 7, color: "#0f172a", alignment: "right" as const },
    },
  };

  const fileName = `${fileNamePrefix}_${safeFileName(companyName)}_${start}_${end}.pdf`;
  (
    pdfMake as unknown as {
      createPdf: (d: unknown) => { download: (n: string) => void };
    }
  )
    .createPdf(docDefinition)
    .download(fileName);
}
