export default function AboutCard() {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Дээд тал — illustration placeholder */}
      <div className="relative flex h-52 items-center justify-center bg-gradient-to-br from-navy to-navy-light sm:h-64">
        {/* бүдэг grid pattern давхарга */}
        <div className="bg-grid absolute inset-0 opacity-30" />
        <div className="relative flex flex-col items-center text-white">
          <span className="text-6xl sm:text-7xl" role="img" aria-label="хүргэлт">
            🚚
          </span>
          <span className="mt-3 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
            Delivery / Team illustration
          </span>
        </div>
      </div>

      {/* Текст хэсэг */}
      <div className="p-6 sm:p-8">
        <h2 className="text-xl font-bold text-navy sm:text-2xl">Бидний тухай</h2>
        <p className="mt-3 leading-relaxed text-slate-600">
          HurdExpress нь онлайн дэлгүүрүүдийн барааг Улаанбаатар хотын А бүс дотор
          6,000₮-өөр шуурхай хүргэх, мөн хөдөө орон нутгийн унаанд бараа тавьж өгөх
          үйлчилгээ үзүүлдэг хүргэлтийн систем юм.
        </p>

        <ul className="mt-6 grid grid-cols-2 gap-3 text-sm">
          {[
            { k: "А бүс хүргэлт", v: "6,000₮" },
            { k: "Хөдөө орон нутаг", v: "Унаанд тавьж өгнө" },
          ].map((item) => (
            <li
              key={item.k}
              className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
            >
              <p className="text-xs text-slate-500">{item.k}</p>
              <p className="mt-0.5 font-semibold text-navy">{item.v}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
