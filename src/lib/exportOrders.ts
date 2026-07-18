// Захиалгуудыг Excel (.xlsx) файл руу экспортлох — client дээр (static export).
// xlsx library ашиглана; writeFile (Node) биш, Blob + download ашиглана.

import * as XLSX from "xlsx";
import { ORDER_STATUS_LABELS, type Order } from "@/types";

function formatDate(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// YYYYMMDD — файлын нэрэнд.
function dateStamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

// Захиалгын аймаг/дүүргийг нэг талбар болгож гаргана.
function regionOf(o: Order): string {
  if (o.deliveryType === "province") return o.province || o.soum || "—";
  return o.cityDistrict || o.cityKhoroo || "—";
}

const HEADERS = [
  "Код",
  "Огноо",
  "Байгууллага",
  "Хүлээн авагч",
  "Утас",
  "Аймаг/Дүүрэг",
  "Хаяг",
  "Бараа",
  "Тоо",
  "COD",
  "Хүргэлт",
  "Нийт",
  "Төлөв",
  "Жолооч",
  "Тэмдэглэл",
] as const;

function orderToRow(o: Order): (string | number)[] {
  return [
    o.orderCode,
    formatDate(o.createdAt),
    o.companyName || "",
    o.receiverName || "",
    o.receiverPhone || "",
    regionOf(o),
    o.receiverAddress || "",
    o.productName || o.itemName || "",
    o.qty ?? 0,
    o.codAmount ?? 0,
    o.deliveryPrice ?? 0,
    o.totalAmount ?? 0,
    ORDER_STATUS_LABELS[o.status] ?? o.status,
    o.driverName || "",
    o.note || "",
  ];
}

/**
 * Өгөгдсөн захиалгуудыг Excel файл болгож татаж авна.
 * Файлын нэр: orders_YYYYMMDD.xlsx
 */
export function exportOrdersToExcel(orders: Order[]): void {
  const rows = [HEADERS as unknown as string[], ...orders.map(orderToRow)];
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Баганын өргөн (ойролцоо).
  ws["!cols"] = [
    { wch: 12 }, // Код
    { wch: 17 }, // Огноо
    { wch: 22 }, // Байгууллага
    { wch: 18 }, // Хүлээн авагч
    { wch: 12 }, // Утас
    { wch: 16 }, // Аймаг/Дүүрэг
    { wch: 30 }, // Хаяг
    { wch: 20 }, // Бараа
    { wch: 6 }, // Тоо
    { wch: 12 }, // COD
    { wch: 12 }, // Хүргэлт
    { wch: 12 }, // Нийт
    { wch: 14 }, // Төлөв
    { wch: 16 }, // Жолооч
    { wch: 24 }, // Тэмдэглэл
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Захиалгууд");

  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
  const blob = new Blob([out], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `orders_${dateStamp()}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
