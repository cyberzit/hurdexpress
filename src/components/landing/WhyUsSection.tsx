const REASONS = [
  { icon: "🛡️", title: "Итгэлтэй", desc: "Аюулгүй, найдвартай хүргэлт." },
  { icon: "⚡", title: "Шуурхай", desc: "Цаг хугацаанд нь хүргэнэ." },
  { icon: "💰", title: "Хэмнэлттэй", desc: "Бизнесийн зардлыг бууруулна." },
  { icon: "👥", title: "Туршлагатай", desc: "Мэргэшсэн баг, үр чадвартай." },
  { icon: "🗺️", title: "Хяналттай", desc: "Хүргэлтийн явцыг таны хяналтад." },
  { icon: "🤝", title: "Урт хугацааны түншлэл", desc: "Итгэлтэй хамтын ажиллагаа." },
];

export default function WhyUsSection() {
  return (
    <section id="why" className="relative overflow-hidden bg-navy py-16 text-white sm:py-24">
      <div className="bg-grid-light pointer-events-none absolute inset-0 opacity-50" aria-hidden />
      <div
        className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-brand/10 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wide text-brand">
            Давуу тал
          </span>
          <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Яагаад бидэнтэй хамтрах вэ?</h2>
          <p className="mt-3 text-white/60">
            Бизнесээ хүчирхэгжүүлэх итгэлтэй хүргэлтийн түнш.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {REASONS.map((r) => (
            <div
              key={r.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition hover:bg-white/10"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-2xl shadow-lg shadow-brand/20">
                {r.icon}
              </div>
              <h3 className="mt-4 text-lg font-bold">{r.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-white/60">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
