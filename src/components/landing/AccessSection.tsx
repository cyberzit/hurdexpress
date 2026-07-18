import TrackingSearch from "@/components/tracking/TrackingSearch";
import LoginCard from "@/components/login/LoginCard";
import PWAInstallHint from "@/components/PWAInstallHint";

// Хүргэлт шалгах + Нэвтрэх — одоо байгаа функцийг хэвээр ашиглана.
export default function AccessSection() {
  return (
    <section className="bg-slate-50 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-navy sm:text-3xl">
            Хүргэлтээ шалгах · Системд нэвтрэх
          </h2>
          <p className="mt-3 text-slate-500">
            Захиалгын дугаараараа төлвөө шалгана уу, эсвэл харилцагчийн эрхээрээ нэвтэрнэ үү.
          </p>
        </div>

        {/* PWA суулгах hint (зөвхөн суулгах боломжтой үед харагдана) */}
        <div className="mx-auto mt-8 max-w-4xl">
          <PWAInstallHint />
        </div>

        <div className="mx-auto mt-6 grid max-w-4xl gap-6 lg:grid-cols-2 lg:items-start">
          <div id="track" className="scroll-mt-24">
            <TrackingSearch />
          </div>
          <div id="login" className="scroll-mt-24">
            <LoginCard />
          </div>
        </div>
      </div>
    </section>
  );
}
