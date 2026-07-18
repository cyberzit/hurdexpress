const TECH = [
  { icon: "🖥️", title: "Веб систем", desc: "Захиалгын удирдлагын цогц веб платформ." },
  { icon: "📑", title: "Excel / CSV импорт", desc: "Захиалгаа файлаар бөөнөөр оруулна." },
  { icon: "🛰️", title: "GPS tracking", desc: "Маршрутын оновчлол, байршлын хяналт." },
  { icon: "📱", title: "Driver panel", desc: "Жолоочийн гар утасны апп (Android)." },
  { icon: "🏬", title: "Partner panel", desc: "Харилцагчийн өөрийн удирдлагын самбар." },
  { icon: "📈", title: "Reports", desc: "Тайлан, статистик, дүн шинжилгээ." },
];

export default function TechSection() {
  return (
    <section id="tech" className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Зүүн — текст */}
          <div>
            <span className="text-sm font-semibold uppercase tracking-wide text-brand">
              Технологи
            </span>
            <h2 className="mt-2 text-2xl font-bold text-navy sm:text-3xl">
              Ашиглаж буй технологи
            </h2>
            <p className="mt-3 max-w-md text-slate-500">
              Орчин үеийн систем дээр суурилсан, найдвартай, хэмжээгээ тэлэх боломжтой шийдэл.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {TECH.map((t) => (
                <div key={t.title} className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                    {t.icon}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-navy">{t.title}</h3>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Баруун — device mockup */}
          <div className="relative">
            <div
              className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-tr from-navy/10 to-brand/10 blur-2xl"
              aria-hidden
            />
            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-navy to-navy-light p-8 shadow-xl">
              <div className="rounded-2xl bg-white/5 p-5 backdrop-blur-sm">
                {/* Жижиг dashboard mockup */}
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {["Захиалга", "Хүргэлт", "Орлого"].map((k) => (
                    <div key={k} className="rounded-xl bg-white/10 p-3 text-center">
                      <p className="text-[10px] text-white/60">{k}</p>
                      <p className="mt-1 text-sm font-bold text-white">●●●</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex h-24 items-end gap-1.5 rounded-xl bg-white/5 p-3">
                  {[40, 65, 50, 80, 60, 90, 75].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t bg-brand/80"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <div className="mt-3 space-y-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2">
                      <span className="h-6 w-6 rounded-lg bg-brand/30" />
                      <div className="flex-1">
                        <div className="h-2 w-2/3 rounded bg-white/20" />
                        <div className="mt-1.5 h-2 w-1/3 rounded bg-white/10" />
                      </div>
                      <span className="rounded-full bg-green-400/20 px-2 py-0.5 text-[9px] text-green-300">
                        идэвхтэй
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
