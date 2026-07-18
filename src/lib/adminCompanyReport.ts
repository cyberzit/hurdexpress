// Админ талын "Харилцагч байгууллагын тайлан" — тохиргоо ба анхдагч утга.
// Шүүх/эрэмбэлэх/нэгтгэх логик нь orderReport.ts-д нэгдсэн (partner-тэй хуваалцана),
// ингэснээр хоёр тайлангийн тоо хэзээ ч зөрөхгүй.
import { rangeOf, type ReportFilters } from "@/lib/orderReport";

export {
  filterOrders,
  sortOrders,
  summarize,
  uniqueDrivers,
  driverLabel,
  goodsAmount,
  productLabel,
  safeFileName,
  rangeOf,
  type ReportFilters,
  type ReportSummary,
  type SortDir,
  type SortKey,
  type QuickRange,
} from "@/lib/orderReport";

// Анхдагч: байгууллага СОНГООГҮЙ, энэ сарын эхнээс өнөөдөр хүртэл.
export function defaultAdminFilters(): ReportFilters {
  const { start, end } = rangeOf("thisMonth");
  return { companyId: "", start, end, driverId: "", status: "", search: "" };
}
