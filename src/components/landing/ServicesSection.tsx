const SERVICES = [
  {
    icon: "🚪",
    title: "Хаалгаас хаалганд хүргэлт",
    desc: "Илгээгчээс хүлээн авагч хүртэл шууд, найдвартай хүргэлт.",
  },
  {
    icon: "🛒",
    title: "Онлайн дэлгүүрийн бараа хүргэлт",
    desc: "E-commerce, олон нийтийн сүлжээний захиалгыг шуурхай хүргэнэ.",
  },
  {
    icon: "💵",
    title: "COD төлбөр цуглуулалт",
    desc: "Бараагаа хүргэхдээ төлбөрийг хүлээн авч танд шилжүүлнэ.",
  },
  {
    icon: "🚌",
    title: "Орон нутгийн унаанд илгээмж",
    desc: "Хөдөө орон нутгийн чиглэлийн унаанд илгээмжийг найдвартай тавьж өгнө.",
  },
  {
    icon: "📍",
    title: "Live tracking",
    desc: "Хүргэлтийн явц, жолоочийн байршлыг real-time хянана.",
  },
  {
    icon: "📊",
    title: "Тайлан, хяналт",
    desc: "Захиалга, орлого, гүйцэтгэлийн тайланг ил тод харна.",
  },
];

export default function ServicesSection() {
  return (
    <section id="services" className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wide text-brand">
            Үйлчилгээ
          </span>
          <h2 className="mt-2 text-2xl font-bold text-navy sm:text-3xl">
            Бидний үзүүлдэг үйлчилгээ
          </h2>
          <p className="mt-3 text-slate-500">
            Бизнесийн бүх төрлийн хүргэлтийн хэрэгцээг нэг дороос.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <div
              key={s.title}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-brand/40 hover:shadow-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy text-2xl text-white transition group-hover:bg-brand">
                {s.icon}
              </div>
              <h3 className="mt-4 text-lg font-bold text-navy">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
