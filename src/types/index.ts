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

// users/{uid} document-ийг удирдлагад ашиглах (uid + ms timestamp) хэлбэр
export interface User {
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: StaffRole;
  companyId?: string;
  driverId?: string;
  isActive: boolean;
  createdAt: number; // ms
  updatedAt: number; // ms
}

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  admin: "Админ",
  partner: "Харилцагч",
  driver: "Жолооч",
};

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
  // Банкны мэдээлэл — тооцоо шилжүүлэхэд
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string; // данс эзэмшигч (байгууллагын нэрээс өөр байж болно)
  managerName?: string; // партнер хэрэглэгчийн нэр (нэвтрэх эзэн)
  managerEmail?: string; // партнерийн нэвтрэх имэйл (Auth)
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
  photoUrl?: string; // үндсэн зураг (webp, 800px)
  thumbnailUrl?: string; // жижиг зураг (webp, 250px)
  imagePath?: string; // Storage зам — main.webp (солих/устгахад)
  thumbnailPath?: string; // Storage зам — thumb.webp
  description?: string;
  // Агуулахын үлдэгдэл (admin удирдана; availableQty = stockQty - reservedQty)
  stockQty: number; // нийт үлдэгдэл
  reservedQty: number; // захиалгад түгжигдсэн
  availableQty: number; // боломжит (stockQty - reservedQty)
  lowStockAlertQty: number; // бага үлдэгдлийн анхааруулгын босго
  isActive: boolean;
  createdAt: number; // ms
  updatedAt: number; // ms
}

// Агуулахын хөдөлгөөн (Firestore: inventoryMovements)
export type InventoryMovementType = "in" | "out" | "adjustment" | "reserve" | "release";

export interface InventoryMovement {
  id: string;
  productId: string;
  companyId: string;
  type: InventoryMovementType;
  qty: number;
  beforeQty: number;
  afterQty: number;
  reason?: string;
  orderId?: string;
  actorId: string;
  actorName: string;
  createdAt: number; // ms
}

export const INVENTORY_MOVEMENT_LABELS: Record<InventoryMovementType, string> = {
  in: "Орлого",
  out: "Зарлага",
  adjustment: "Тохируулга",
  reserve: "Захиалгад түгжсэн",
  release: "Чөлөөлсөн",
};

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
  // Auto-dispatch талбарууд
  currentOrderCount: number; // идэвхтэй оноогдсон захиалгын тоо (load balancing)
  serviceDistricts?: string[]; // үйлчилдэг дүүргүүд (district matching)
  lastLocation?: { lat: number; lng: number }; // сүүлийн байршил (proximity)
  // Банкны мэдээлэл — цалин/тооцоо шилжүүлэхэд (тооцооны тайланд харагдана)
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string; // данс эзэмшигчийн нэр (жолоочийн нэрээс өөр байж болно)
  // Нэвтрэх эрх (Firebase Auth)
  authUid?: string; // холбоотой Auth хэрэглэгчийн uid
  loginEmail?: string; // нэвтрэх имэйл
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

// Хүргэлтийн бүс — нийслэл эсвэл орон нутаг
export type DeliveryType = "city" | "province";

export const DELIVERY_TYPE_LABELS: Record<DeliveryType, string> = {
  city: "Нийслэл",
  province: "Орон нутаг",
};

export interface Order {
  id: string;
  orderCode: string;
  companyId: string;
  companyName: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string; // автоматаар бүрдсэн бүтэн хаяг (хайлт/харуулахад)
  // Хүргэлтийн бүс + бүтэцлэгдсэн хаягийн талбарууд
  deliveryType?: DeliveryType;
  cityDistrict?: string; // нийслэл: дүүрэг
  cityKhoroo?: string; // нийслэл: хороо/баг
  street?: string; // гудамж / хороолол / хотхон
  building?: string; // байр
  entrance?: string; // орц / тоот
  entranceCode?: string; // орцны код
  addressNote?: string; // хаягийн нэмэлт тайлбар
  province?: string; // орон нутаг: аймаг
  soum?: string; // орон нутаг: сум / дүүрэг
  terminalName?: string; // хүлээн авах унаа / вокзал / терминал
  location?: { lat: number; lng: number }; // газрын зураг дээрх marker
  routeOrder?: number; // маршрут дахь дараалал (optimization)
  deliveryProofs?: DeliveryProof[]; // хүргэгдсэн баталгаажуулалт (зураг)
  failedProofs?: DeliveryProof[]; // амжилтгүй болсон баталгаажуулалт (зураг/screenshot)
  // Олон бараатай захиалга. Хуучин нэг бараатай захиалгад items байхгүй —
  // тэр тохиолдолд productId/productName/qty/codAmount талбарууд хүчинтэй.
  items?: OrderItem[];
  itemName: string;
  productId?: string;
  productName?: string;
  // Барааны зураг — захиалганд хуулж хадгална. Жолооч products цуглуулгыг унших
  // эрхгүй тул (firestore.rules) зөвхөн ингэж өөрийн захиалгын зургийг харна.
  productImageUrl?: string;
  qty: number;
  deliveryPrice: number;
  codAmount: number; // барааны үнэ (үнэ × тоо ширхэг)
  discount?: number; // хөнгөлөх дүн — нийт төлбөрөөс хасагдана
  totalAmount: number; // авах нийт төлбөр = codAmount + deliveryPrice − discount
  note?: string;
  status: OrderStatus;
  createdByUid?: string; // захиалга үүсгэсэн хэрэглэгчийн uid (мэдэгдэлд)
  driverId?: string;
  driverName?: string;
  driverPhone?: string; // denormalized — public tracking-д
  autoAssigned?: boolean; // авто-dispatch-аар оноогдсон эсэх (badge)
  assignedAt?: number; // ms — жолооч оноосон
  pickedUpAt?: number; // ms — бараа авсан
  deliveredAt?: number; // ms — хүргэгдсэн
  codCollected?: boolean; // DEPRECATED — cashPaid/transferPaid ашиглана (хуучин өгөгдөлд үлдсэн)
  // ── Төлбөр ──────────────────────────────────────────────────────────────
  // prepaid: байгууллага захиалга үүсгэхдээ "төлбөр төлөгдсөн" гэж тэмдэглэсэн.
  //   → жолооч мөнгө авахгүй, төлбөрийн талбарууд идэвхгүй.
  // cashPaid + transferPaid: жолооч хэдийг бэлнээр, хэдийг шилжүүлгээр авсан.
  //   Хагас төлөлт (жишээ: 50,000 бэлнээр + 50,000 шилжүүлсэн) ингэж илэрхийлэгдэнэ.
  prepaid?: boolean;
  cashPaid?: number;
  transferPaid?: number;
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
  failedNote?: string; // амжилтгүйн нэмэлт тайлбар (жолооч бичнэ)
  // "Дараа авна" — захиалга амжилтгүй БОЛОХГҮЙ, зөвхөн хойшилно (төлөв assigned руу буцна).
  scheduledDate?: string; // хойшилсон огноо, YYYY-MM-DD
  postponedAt?: number; // ms — хамгийн сүүлд хойшлуулсан
  postponedNote?: string; // хойшлуулсан шалтгааны тайлбар
  postponeProofs?: DeliveryProof[]; // хойшлуулахад хавсаргасан зураг (failed-proofs/ зам ашиглана)
  createdAt: number; // ms
  updatedAt: number; // ms
}

// Захиалгын мөр — нэг хаяг дээр олон бараа (Firestore: orders.items)
export interface OrderItem {
  productId?: string;
  productName: string;
  productImageUrl?: string;
  qty: number;
  price: number; // нэгжийн үнэ
  subtotal: number; // price × qty
}

// Хүргэлт / амжилтгүйн зургийн баталгаажуулалт (Firestore: orders.deliveryProofs / failedProofs)
export interface DeliveryProof {
  imageUrl: string; // download URL (webp)
  imagePath: string; // Storage зам (устгахад)
  uploadedAt: number; // ms
  driverId: string;
  lat?: number; // байршуулсан үеийн GPS
  lng?: number;
}

// Амжилтгүй болсон шалтгааны сонголтууд (driver).
export const FAILED_REASONS = [
  "Хаяг дээр очсон",
  "Утасаа аваагүй",
  "Холбогдох боломжгүй",
  "Хүлээн авагч татгалзсан",
  "Дараа авна",
  "Хойшилсон",
] as const;

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Шинэ",
  assigned: "Жолоочид оноосон",
  picked_up: "Жолооч хүлээн авсан",
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

// Жолоочийн цалин тооцооны горим
export type DriverSalaryMode = "fixed" | "per_delivery";

// Жолоочийн сарын KPI (Firestore: driverKpi — эсвэл orders-аас динамик тооцоолно)
export interface DriverKpi {
  driverId: string;
  driverName: string;
  month: string; // YYYY-MM
  totalAssigned: number;
  totalDelivered: number;
  totalFailed: number;
  successRate: number; // 0..100
  totalDeliveryIncome: number;
  totalCodCollected: number;
  codDifference: number;
  baseSalary: number;
  bonus: number;
  calculatedSalary: number;
}

// Харилцагч байгууллагын сарын KPI (orders-аас динамик тооцоолно)
export interface PartnerKpi {
  companyId: string;
  companyName: string;
  month: string; // YYYY-MM
  totalOrders: number;
  deliveredOrders: number;
  failedOrders: number;
  cancelledOrders: number;
  successRate: number; // 0..100
  deliveryFeeTotal: number;
  codTotal: number;
  averageCodAmount: number;
}

// Системийн тохиргоо (Firestore: settings/general)
export interface GeneralSettings {
  companyName: string;
  brandName: string;
  aboutText: string; // нүүр (login) хуудасны "Бидний тухай" текст
  phone: string;
  secondaryPhone?: string; // нэмэлт утас
  email?: string;
  address?: string;
  facebookUrl?: string; // Facebook хуудасны холбоос
  brochureUrl?: string; // танилцуулга (PDF) татах холбоос
  brochureName?: string; // танилцуулгын файлын нэр (харуулахад)
  defaultDeliveryPrice: number;
  zoneName: string;
  logoUrl?: string;
  primaryColor?: string;
  codEnabled: boolean;
  trackingEnabled: boolean;
  autoAssignEnabled: boolean; // шинэ захиалгад жолооч авто-оноох эсэх
  // Жолоочийн цалин тооцоо
  driverSalaryMode: DriverSalaryMode;
  baseSalary?: number; // fixed — суурь цалин
  perDeliveryAmount?: number; // per_delivery — нэг хүргэлтийн дүн
  bonusThreshold?: number; // урамшуулал авах хүргэлтийн доод тоо
  bonusAmount?: number; // урамшууллын дүн
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

// Жолоочийн өдрийн COD тушаалт / өдөр хаалт (Firestore: driverSettlements)
export type DriverSettlementStatus = "open" | "submitted" | "approved";

export interface DriverSettlement {
  id: string;
  driverId: string;
  driverName: string;
  date: number; // ms — өдрийн эхлэл
  dateKey: string; // YYYY-MM-DD
  totalOrders: number;
  deliveredOrders: number;
  codCollected: number; // нийт COD (delivered)
  cashCollected: number; // бэлнээр цуглуулсан (codCollected===true)
  handedAmount: number; // тушаасан дүн
  differenceAmount: number; // codCollected - handedAmount
  // Admin тооцоо нийлүүлэлт (Deligo загварын тайлан)
  deliveryTotal?: number; // жолоочийн олговор (хүргэлтийн үнийн нийлбэр)
  payable?: number; // тушаах дүн = codCollected - deliveryTotal
  reconciled?: boolean; // admin "тооцоо нийлсэн" гэж тэмдэглэсэн эсэх
  reconciledAt?: number;
  reconciledBy?: string;
  status: DriverSettlementStatus;
  submittedAt?: number;
  approvedAt?: number;
  approvedBy?: string;
  note?: string;
  createdAt: number;
  updatedAt: number;
}

export const DRIVER_SETTLEMENT_STATUS_LABELS: Record<DriverSettlementStatus, string> = {
  open: "Нээлттэй",
  submitted: "Илгээсэн",
  approved: "Баталсан",
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
