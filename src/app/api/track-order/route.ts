import { NextResponse, type NextRequest } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";

// Admin SDK нь Node.js runtime шаардана (edge биш).
export const runtime = "nodejs";
// Хэзээ ч кэшлэхгүй — захиалгын төлөв байнга өөрчлөгддөг.
export const dynamic = "force-dynamic";

// Утсыг бүтнээр буцаахгүй — зөвхөн сүүлийн 4 орон.
function maskPhone(phone?: string): string {
  const digits = (phone ?? "").replace(/\D/g, "");
  return digits.length >= 4 ? `••••${digits.slice(-4)}` : "••••";
}

function toMillis(value: unknown): number | null {
  if (value && typeof value === "object" && "toMillis" in value) {
    return (value as { toMillis: () => number }).toMillis();
  }
  return null;
}

// GET /api/track-order?code=HX123456
// Public tracking — зөвхөн orderCode-оор хайж, хязгаарлагдмал safe талбар буцаана.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.trim().toUpperCase();
  if (!code) {
    return NextResponse.json(
      { error: "Захиалгын дугаар (code) шаардлагатай." },
      { status: 400 },
    );
  }

  try {
    const db = getAdminDb();
    const snap = await db
      .collection("orders")
      .where("orderCode", "==", code)
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({ found: false }, { status: 404 });
    }

    const d = snap.docs[0].data();

    // ⚠️ Зөвхөн ил гаргаж болох талбарыг буцаана.
    // receiverAddress-г огт буцаахгүй, receiverPhone-г masked хэлбэрээр.
    return NextResponse.json({
      found: true,
      orderCode: d.orderCode,
      status: d.status,
      companyName: d.companyName ?? null,
      receiverName: d.receiverName ?? null,
      receiverPhoneMasked: maskPhone(d.receiverPhone),
      driverName: d.driverName ?? null,
      driverPhone: d.driverPhone ?? null,
      createdAt: toMillis(d.createdAt),
      deliveredAt: toMillis(d.deliveredAt),
    });
  } catch (err) {
    // Service account тохируулаагүй эсвэл серверийн алдаа.
    const message =
      err instanceof Error && err.message.includes("FIREBASE_SERVICE_ACCOUNT_KEY")
        ? "Серверийн тохиргоо дутуу байна (FIREBASE_SERVICE_ACCOUNT_KEY)."
        : "Серверийн алдаа гарлаа.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
