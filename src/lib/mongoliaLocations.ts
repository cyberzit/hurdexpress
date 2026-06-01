// Монголын байршлын лавлах өгөгдөл + хаяг бүрдүүлэх туслах.
import type { DeliveryType } from "@/types";

// Улаанбаатарын дүүргүүд
export const UB_DISTRICTS = [
  "Багануур",
  "Багахангай",
  "Баянгол",
  "Баянзүрх",
  "Налайх",
  "Сонгинохайрхан",
  "Сүхбаатар",
  "Хан-Уул",
  "Чингэлтэй",
] as const;

// Аймгууд
export const PROVINCES = [
  "Архангай",
  "Баян-Өлгий",
  "Баянхонгор",
  "Булган",
  "Говь-Алтай",
  "Говьсүмбэр",
  "Дархан-Уул",
  "Дорноговь",
  "Дорнод",
  "Дундговь",
  "Завхан",
  "Орхон",
  "Өвөрхангай",
  "Өмнөговь",
  "Сүхбаатар",
  "Сэлэнгэ",
  "Төв",
  "Увс",
  "Ховд",
  "Хөвсгөл",
  "Хэнтий",
] as const;

// Жолоочийн үйлчлэх 6 үндсэн дүүрэг (auto-dispatch district matching).
export const SERVICE_DISTRICTS = [
  "Баянзүрх",
  "Сүхбаатар",
  "Чингэлтэй",
  "Баянгол",
  "Хан-Уул",
  "Сонгинохайрхан",
] as const;

// Зүүн / баруун бүсийн аймгууд (орон нутгийн хүргэлтийн терминал тогтооход).
export const EASTERN_PROVINCES = ["Дорнод", "Сүхбаатар", "Хэнтий"] as const;
export const WESTERN_PROVINCES = [
  "Баян-Өлгий",
  "Ховд",
  "Увс",
  "Завхан",
  "Говь-Алтай",
] as const;

// Орон нутгийн хүргэлт аль дүүргийн терминалаас унаанд тавигдах вэ.
// Зүүн аймгийн хүргэлт Баянзүрх дүүргийн Тэнгэр худалдааны төвөөс унаанд тавигдана.
// Баруун аймгийн хүргэлт Баянгол дүүргийн Драгон авто терминалаас унаанд тавигдана.
export const PROVINCE_TERMINAL_RULES = {
  eastern: { provinces: EASTERN_PROVINCES, terminalDistrict: "Баянзүрх" },
  western: { provinces: WESTERN_PROVINCES, terminalDistrict: "Баянгол" },
} as const;

// Аймгийн нэрээс тухайн хүргэлтийг хариуцах терминал дүүрэг.
export function terminalDistrictForProvince(province?: string): string | null {
  if (!province) return null;
  if ((EASTERN_PROVINCES as readonly string[]).includes(province)) {
    return PROVINCE_TERMINAL_RULES.eastern.terminalDistrict;
  }
  if ((WESTERN_PROVINCES as readonly string[]).includes(province)) {
    return PROVINCE_TERMINAL_RULES.western.terminalDistrict;
  }
  return null;
}

// Улаанбаатарын төв — газрын зургийн анхдагч center.
export const UB_CENTER = { lat: 47.9188, lng: 106.9176 };

// Хаягийн бүтэцлэгдсэн талбарууд (receiverAddress бүрдүүлэхэд).
export interface AddressParts {
  deliveryType: DeliveryType;
  cityDistrict?: string;
  cityKhoroo?: string;
  street?: string;
  building?: string;
  entrance?: string;
  addressNote?: string;
  province?: string;
  soum?: string;
  terminalName?: string;
}

// Хоосон биш хэсгүүдийг ", "-ээр нэгтгэнэ.
function join(parts: (string | undefined)[]): string {
  return parts.map((p) => p?.trim()).filter(Boolean).join(", ");
}

/**
 * Бүтэцлэгдсэн талбаруудаас бүтэн `receiverAddress` мөр үүсгэнэ.
 * - city: дүүрэг + хороо + гудамж + байр + орц + тайлбар
 * - province: аймаг + сум + терминал + тайлбар
 */
export function buildReceiverAddress(p: AddressParts): string {
  if (p.deliveryType === "province") {
    return join([
      p.province ? `${p.province} аймаг` : undefined,
      p.soum ? `${p.soum} сум` : undefined,
      p.terminalName,
      p.addressNote,
    ]);
  }
  // city (default)
  return join([
    p.cityDistrict ? `${p.cityDistrict} дүүрэг` : undefined,
    p.cityKhoroo ? `${p.cityKhoroo} хороо` : undefined,
    p.street,
    p.building,
    p.entrance,
    p.addressNote,
  ]);
}
