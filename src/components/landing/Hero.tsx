import HeroIllustration from "@/components/landing/HeroIllustration";

export default function Hero() {
  return (
    <section
      id="home"
      className="relative overflow-hidden bg-gradient-to-br from-navy via-navy to-navy-light text-white"
    >
      {/* Grid + glow давхаргууд */}
      <div className="bg-grid-light pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-blue-500/15 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:py-24">
        {/* Зүүн — текст */}
        <div className="hx-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">
            🚚 Хүргэлтийн цогц шийдэл
          </span>

          <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            Таны бизнесийг хэрэглэгчтэй нь{" "}
            <span className="text-brand">хурдан, найдвартай</span> холбоно
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
            HurdExpress нь онлайн дэлгүүрүүд болон бизнес байгууллагуудын бараа
            бүтээгдэхүүнийг Улаанбаатар хотын аль ч бүсэд, бүсчлэл үл харгалзан
            шуурхай хүргэж, хөдөө орон нутгийн чиглэлийн унаанд илгээмжийг
            найдвартай тавьж өгдөг хүргэлтийн үйлчилгээний систем юм.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#track"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-dark"
            >
              🔎 Хүргэлт шалгах
            </a>
            <a
              href="#login"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Харилцагчаар бүртгүүлэх
            </a>
          </div>

          {/* Жижиг статистик */}
          <div className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-white/10 pt-6">
            {[
              { v: "500+", k: "Өдрийн хүргэлт" },
              { v: "Бүх бүс", k: "Улаанбаатар" },
              { v: "Real-time", k: "GPS хяналт" },
            ].map((s) => (
              <div key={s.k}>
                <p className="text-xl font-bold text-white sm:text-2xl">{s.v}</p>
                <p className="mt-0.5 text-xs text-white/60">{s.k}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Баруун — illustration */}
        <div className="relative hx-fade-up">
          <HeroIllustration />
        </div>
      </div>

      {/* Доод давалгаа — дараагийн section руу зөөлөн шилжилт */}
      <div className="relative">
        <svg
          className="block h-12 w-full text-slate-50 sm:h-16"
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            fill="currentColor"
            d="M0,40 C240,80 480,0 720,24 C960,48 1200,88 1440,48 L1440,80 L0,80 Z"
          />
        </svg>
      </div>
    </section>
  );
}
