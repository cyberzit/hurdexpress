import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { GeneralSettings } from "@/types";

const settingsRef = () => doc(db, "settings", "general");
// API key нь public-read settings/general-д БИШ, admin-only settings/sms-д.
const smsSecretRef = () => doc(db, "settings", "sms");

// Нүүр хуудасны "Бидний тухай" анхдагч текст.
export const DEFAULT_ABOUT_TEXT =
  "HurdExpress нь онлайн дэлгүүрүүд болон бизнесийн байгууллагуудын бараа " +
  "бүтээгдэхүүнийг Улаанбаатар хотын аль ч бүсэд, бүсчлэл үл харгалзан түргэн " +
  "шуурхай хүргэхээс гадна хөдөө орон нутгийн чиглэлийн унаанд бараа, илгээмжийг " +
  "найдвартай тавьж өгдөг нэгдсэн хүргэлтийн үйлчилгээний систем юм. Бид хүргэлтийн " +
  "үйл явцыг хялбарчилж, бизнес эрхлэгчид болон хэрэглэгчдийн цаг хугацаа, зардлыг " +
  "хэмнэхэд чиглэн ажилладаг.";

// Document байхгүй үед ашиглах анхдагч утгууд.
export const DEFAULT_SETTINGS: Omit<GeneralSettings, "updatedAt"> = {
  companyName: "",
  brandName: "HurdExpress",
  aboutText: DEFAULT_ABOUT_TEXT,
  phone: "",
  email: "",
  address: "",
  defaultDeliveryPrice: 6000,
  zoneName: "А бүс",
  logoUrl: "",
  primaryColor: "#f97316",
  codEnabled: true,
  trackingEnabled: true,
  autoAssignEnabled: false,
  driverSalaryMode: "per_delivery",
  baseSalary: 0,
  perDeliveryAmount: 3000,
  bonusThreshold: 0,
  bonusAmount: 0,
  smsEnabled: false,
  smsProvider: "mock",
  smsApiUrl: "",
};

function toMillis(value: unknown): number {
  if (value && typeof value === "object" && "toMillis" in value) {
    return (value as { toMillis: () => number }).toMillis();
  }
  return typeof value === "number" ? value : Date.now();
}

function mapSettings(data: Record<string, unknown>): GeneralSettings {
  return {
    companyName: (data.companyName as string) ?? "",
    brandName: (data.brandName as string) ?? DEFAULT_SETTINGS.brandName,
    aboutText: (data.aboutText as string) ?? DEFAULT_ABOUT_TEXT,
    phone: (data.phone as string) ?? "",
    email: data.email as string | undefined,
    address: data.address as string | undefined,
    defaultDeliveryPrice:
      (data.defaultDeliveryPrice as number) ?? DEFAULT_SETTINGS.defaultDeliveryPrice,
    zoneName: (data.zoneName as string) ?? DEFAULT_SETTINGS.zoneName,
    logoUrl: data.logoUrl as string | undefined,
    primaryColor: data.primaryColor as string | undefined,
    codEnabled: data.codEnabled !== false,
    trackingEnabled: data.trackingEnabled !== false,
    autoAssignEnabled: data.autoAssignEnabled === true,
    driverSalaryMode:
      (data.driverSalaryMode as GeneralSettings["driverSalaryMode"]) ?? "per_delivery",
    baseSalary: (data.baseSalary as number) ?? 0,
    perDeliveryAmount: (data.perDeliveryAmount as number) ?? 0,
    bonusThreshold: (data.bonusThreshold as number) ?? 0,
    bonusAmount: (data.bonusAmount as number) ?? 0,
    smsEnabled: data.smsEnabled === true,
    smsProvider: (data.smsProvider as GeneralSettings["smsProvider"]) ?? "mock",
    smsApiUrl: data.smsApiUrl as string | undefined,
    updatedAt: toMillis(data.updatedAt),
  };
}

// Realtime — settings/general document.
export function subscribeSettings(
  onData: (settings: GeneralSettings | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    settingsRef(),
    (snap) => onData(snap.exists() ? mapSettings(snap.data()) : null),
    (err) => onError?.(err),
  );
}

// Нэг удаагийн унших (partner form, tracking).
export async function getSettings(): Promise<GeneralSettings | null> {
  const snap = await getDoc(settingsRef());
  return snap.exists() ? mapSettings(snap.data()) : null;
}

export type SettingsInput = Omit<GeneralSettings, "updatedAt">;

// Хадгалах — байхгүй бол үүсгэнэ (merge).
export async function saveSettings(input: SettingsInput): Promise<void> {
  const payload: Record<string, unknown> = {
    companyName: input.companyName.trim(),
    brandName: input.brandName.trim(),
    aboutText: input.aboutText.trim(),
    phone: input.phone.trim(),
    defaultDeliveryPrice: input.defaultDeliveryPrice,
    zoneName: input.zoneName.trim(),
    codEnabled: input.codEnabled,
    trackingEnabled: input.trackingEnabled,
    autoAssignEnabled: input.autoAssignEnabled,
    driverSalaryMode: input.driverSalaryMode,
    baseSalary: input.baseSalary ?? 0,
    perDeliveryAmount: input.perDeliveryAmount ?? 0,
    bonusThreshold: input.bonusThreshold ?? 0,
    bonusAmount: input.bonusAmount ?? 0,
    smsEnabled: input.smsEnabled,
    smsProvider: input.smsProvider,
    updatedAt: serverTimestamp(),
  };
  // Сонголттой талбарууд — хоосон биш бол хадгална.
  if (input.email?.trim()) payload.email = input.email.trim();
  if (input.address?.trim()) payload.address = input.address.trim();
  if (input.logoUrl?.trim()) payload.logoUrl = input.logoUrl.trim();
  if (input.primaryColor?.trim()) payload.primaryColor = input.primaryColor.trim();
  if (input.smsApiUrl?.trim()) payload.smsApiUrl = input.smsApiUrl.trim();

  await setDoc(settingsRef(), payload, { merge: true });
}

// SMS API key — admin-only settings/sms doc (public-read settings/general-д БИШ).
export async function getSmsApiKey(): Promise<string> {
  const snap = await getDoc(smsSecretRef());
  return snap.exists() ? ((snap.data().smsApiKey as string) ?? "") : "";
}

export async function saveSmsApiKey(apiKey: string): Promise<void> {
  await setDoc(
    smsSecretRef(),
    { smsApiKey: apiKey.trim(), updatedAt: serverTimestamp() },
    { merge: true },
  );
}
