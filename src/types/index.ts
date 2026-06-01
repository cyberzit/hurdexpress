// hurdexpress — хүргэлтийн үйлчилгээний домэйн төрлүүд

import type { Timestamp } from "firebase/firestore";

// Системийн ажилтны эрх (Firestore users document)
export type StaffRole = "admin" | "partner" | "driver";

// Firestore: users/{uid} document-ийн бүтэц
export interface UserDoc {
  name: string;
  email: string;
  phone: string;
  role: StaffRole;
  companyId?: string; // partner-д тухайн байгууллага
  driverId?: string; // driver-д drivers collection-ийн document id
  isActive: boolean;
  createdAt: Timestamp;
}

// Харилцагч байгууллага (Firestore: companies)
export interface Company {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  contractPrice: number; // гэрээт хүргэлтийн үнэ (₮)
  contactPerson?: string;
  note?: string;
  isActive: boolean;
  createdAt: number; // ms
  updatedAt: number; // ms
}

// Бараа бүтээгдэхүүн (Firestore: products)
export interface Product {
  id: string;
  companyId: string;
  companyName: string; // denormalized — хүснэгтэд харуулахад
  name: string;
  sku?: string;
  price: number;
  photoUrl?: string;
  description?: string;
  isActive: boolean;
  createdAt: number; // ms
  updatedAt: number; // ms
}

// Жолооч (Firestore: drivers)
export type VehicleType = "car" | "motorcycle" | "bike" | "walking";
export type DriverStatus = "available" | "busy" | "offline";

export interface Driver {
  id: string;
  name: string;
  phone: string;
  email?: string;
  vehicleType: VehicleType;
  plateNumber?: string;
  currentStatus: DriverStatus;
  isActive: boolean;
  createdAt: number; // ms
  updatedAt: number; // ms
}

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  car: "Машин",
  motorcycle: "Мотоцикл",
  bike: "Дугуй",
  walking: "Явган",
};

export const DRIVER_STATUS_LABELS: Record<DriverStatus, string> = {
  available: "Сул байгаа",
  busy: "Завгүй",
  offline: "Холбогдоогүй",
};

// Захиалга (Firestore: orders)
export type OrderStatus =
  | "pending"
  | "assigned"
  | "picked_up"
  | "on_the_way"
  | "delivered"
  | "failed"
  | "cancelled";

export interface Order {
  id: string;
  orderCode: string;
  companyId: string;
  companyName: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  itemName: string;
  productId?: string;
  productName?: string;
  qty: number;
  deliveryPrice: number;
  codAmount: number;
  totalAmount: number;
  note?: string;
  status: OrderStatus;
  createdByUid?: string; // захиалга үүсгэсэн хэрэглэгчийн uid (мэдэгдэлд)
  driverId?: string;
  driverName?: string;
  driverPhone?: string; // denormalized — public tracking-д
  assignedAt?: number; // ms — жолооч оноосон
  pickedUpAt?: number; // ms — бараа авсан
  deliveredAt?: number; // ms — хүргэгдсэн
  codCollected?: boolean; // COD цуглуулсан эсэх
  driverNote?: string; // жолоочийн тэмдэглэл
  lastDriverLocation?: OrderDriverLocation; // хүргэлтэнд яваа үед
  cancelReason?: string;
  failedReason?: string;
  editedAt?: number;
  editedBy?: string;
  cancelledAt?: number;
  cancelledBy?: string;
  failedAt?: number;
  failedBy?: string;
  createdAt: number; // ms
  updatedAt: number; // ms
}

// Амжилтгүй болсон шалтгааны сонголтууд (driver).
export const FAILED_REASONS = [
  "Утас авахгүй байна",
  "Хаяг буруу байна",
  "Хүлээн авагч байхгүй",
  "Захиалга авахаас татгалзсан",
  "Бусад",
] as const;

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Шинэ",
  assigned: "Жолоочид оноосон",
  picked_up: "Бараа авсан",
  on_the_way: "Замдаа",
  delivered: "Хүргэгдсэн",
  failed: "Амжилтгүй",
  cancelled: "Цуцлагдсан",
};

// Мэдэгдэл (Firestore: notifications)
export type NotificationType = "order" | "driver" | "system";

export interface AppNotification {
  id: string;
  userId: string; // хүлээн авагч (auth uid эсвэл broadcast аудиенс)
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: number; // ms
}

// Үйл ажиллагааны лог (Firestore: activities)
export interface Activity {
  id: string;
  orderId: string;
  orderCode: string;
  action: string;
  actorId: string;
  actorName: string;
  actorRole: StaffRole;
  createdAt: number; // ms
}

// Системийн тохиргоо (Firestore: settings/general)
export interface GeneralSettings {
  companyName: string;
  brandName: string;
  phone: string;
  email?: string;
  address?: string;
  defaultDeliveryPrice: number;
  zoneName: string;
  logoUrl?: string;
  primaryColor?: string;
  codEnabled: boolean;
  trackingEnabled: boolean;
  // SMS (нууц биш хэсэг — API key нь settings/sms admin-only doc-д тусдаа)
  smsEnabled: boolean;
  smsProvider: SmsProvider;
  smsApiUrl?: string;
  updatedAt: number; // ms
}

// SMS notification (Firestore: smsLogs)
export type SmsProvider = "mock" | "custom";
export type SmsStatus = "pending" | "sent" | "failed";

export interface SmsLog {
  id: string;
  orderId: string;
  orderCode: string;
  phone: string;
  message: string;
  provider: string;
  status: SmsStatus;
  errorMessage?: string;
  createdAt: number; // ms
  sentAt?: number; // ms
}

export const SMS_STATUS_LABELS: Record<SmsStatus, string> = {
  pending: "Хүлээгдэж буй",
  sent: "Илгээсэн",
  failed: "Амжилтгүй",
};

// Тооцоо/нэхэмжлэл (Firestore: settlements)
export type SettlementStatus = "draft" | "confirmed" | "paid";

export interface Settlement {
  id: string;
  companyId: string;
  companyName: string;
  periodStart: number; // ms
  periodEnd: number; // ms
  totalOrders: number;
  deliveredOrders: number;
  deliveryFeeTotal: number;
  codTotal: number;
  paidAmount: number;
  balanceAmount: number;
  status: SettlementStatus;
  createdAt: number; // ms
  updatedAt: number; // ms
}

export const SETTLEMENT_STATUS_LABELS: Record<SettlementStatus, string> = {
  draft: "Ноорог",
  confirmed: "Баталгаажсан",
  paid: "Төлөгдсөн",
};

// Төлбөр (Firestore: payments)
export type PaymentType = "delivery_fee" | "cod_return" | "adjustment";

export interface Payment {
  id: string;
  companyId: string;
  settlementId?: string;
  amount: number;
  type: PaymentType;
  note?: string;
  createdAt: number; // ms
}

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  delivery_fee: "Хүргэлтийн төлбөр",
  cod_return: "COD буцаалт",
  adjustment: "Тохируулга",
};

// Жолоочийн байршил (Firestore: driverLocations/{driverId})
export interface DriverLocation {
  driverId: string;
  driverName: string;
  lat: number;
  lng: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  updatedAt: number; // ms
}

// Order дээрх денормализ хийсэн сүүлийн байршил
export interface OrderDriverLocation {
  lat: number;
  lng: number;
  updatedAt: number; // ms
}

export type UserRole = "customer" | "courier" | "admin";

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  phone?: string;
  role: UserRole;
  createdAt: number;
}

// Хүргэлтийн захиалгын төлөв
export type ShipmentStatus =
  | "created" // Үүсгэсэн
  | "picked_up" // Авсан
  | "in_transit" // Замд яваа
  | "out_for_delivery" // Хүргэхээр гарсан
  | "delivered" // Хүргэгдсэн
  | "cancelled"; // Цуцалсан

export interface Address {
  label?: string;
  line1: string;
  district?: string;
  city: string;
  phone: string;
  contactName: string;
  note?: string;
}

export interface TrackingEvent {
  status: ShipmentStatus;
  note?: string;
  location?: string;
  at: number; // timestamp (ms)
}

export interface Shipment {
  id: string;
  trackingNumber: string; // жишээ: HX-2026-000123
  ownerUid: string; // захиалга үүсгэсэн хэрэглэгч
  courierUid?: string; // хариуцсан хүргэгч
  status: ShipmentStatus;
  from: Address;
  to: Address;
  description?: string;
  weightKg?: number;
  priceMnt?: number;
  photoUrl?: string; // Storage-д хадгалсан зураг
  history: TrackingEvent[];
  createdAt: number;
  updatedAt: number;
}

export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  created: "Үүсгэсэн",
  picked_up: "Авсан",
  in_transit: "Замд яваа",
  out_for_delivery: "Хүргэхээр гарсан",
  delivered: "Хүргэгдсэн",
  cancelled: "Цуцалсан",
};
