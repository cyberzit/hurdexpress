const STEPS = [
  { n: "01", title: "Холбогдох", desc: "Утсаар эсвэл онлайнаар бидэнтэй холбогдоно." },
  { n: "02", title: "Хэрэгцээг тодорхойлох", desc: "Таны бизнесийн хэрэгцээг тодорхойлно." },
  { n: "03", title: "Гэрээ байгуулах", desc: "Уян хатан нөхцөлтэй гэрээ байгуулна." },
  { n: "04", title: "Системд холбох", desc: "API / Excel-ээр системээ холбоно." },
  { n: "05", title: "Хүргэлт эхлүүлэх", desc: "Захиалга хүлээн авч хүргэлтээ эхлүүлнэ." },
];

export default function CooperationSection() {
  return (
    <section id="cooperation" className="bg-slate-50 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wide text-brand">
            Хамтрах
          </span>
          <h2 className="mt-2 text-2xl font-bold text-navy sm:text-3xl">
            Хэрхэн хамтран ажиллах вэ?
          </h2>
          <p className="mt-3 text-slate-500">Энгийн процесс — итгэлтэй хамтын ажиллагаа.</p>
        </div>

        <div className="relative mt-12">
          {/* Холбоос шугам (desktop) */}
          <div
            className="absolute left-0 right-0 top-7 hidden h-0.5 bg-gradient-to-r from-brand/20 via-brand/40 to-brand/20 lg:block"
            aria-hidden
          />
          <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4">
            {STEPS.map((s) => (
              <li key={s.n} className="relative">
                <div className="relative z-10 mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-navy text-lg font-bold text-white shadow-lg lg:mx-0">
                  {s.n}
                </div>
                <div className="mt-4 text-center lg:text-left">
                  <h3 className="text-base font-bold text-navy">{s.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{s.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
