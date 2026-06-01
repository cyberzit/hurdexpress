import Link from "next/link";
import Navbar from "@/components/Navbar";
import TrackForm from "@/components/TrackForm";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-4 py-20 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Хурдан, найдвартай <span className="text-orange-500">хүргэлт</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-black/60 dark:text-white/60">
            Илгээмжээ хаанаас ч хянаж, захиалгаа хэдхэн товшилтоор үүсгээрэй.
          </p>

          <div className="mx-auto mt-10 max-w-md">
            <TrackForm />
          </div>

          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/login"
              className="rounded-md bg-orange-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-orange-600"
            >
              Нэвтрэх
            </Link>
            <Link
              href="/track"
              className="rounded-md border border-black/15 px-5 py-2.5 text-sm font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5"
            >
              Илгээмж хайх
            </Link>
          </div>
        </section>

        <section className="mx-auto grid max-w-5xl gap-6 px-4 pb-20 sm:grid-cols-3">
          {[
            { title: "Бодит цагийн хяналт", desc: "Илгээмжийн төлвийг шууд харна." },
            { title: "Хялбар захиалга", desc: "Хэдхэн алхамаар захиалгаа үүсгэнэ." },
            { title: "Найдвартай", desc: "Хүргэлтийн түүх бүрэн хадгалагдана." },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-black/10 p-6 dark:border-white/10"
            >
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-black/60 dark:text-white/60">
                {f.desc}
              </p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-black/10 py-6 text-center text-sm text-black/50 dark:border-white/10 dark:text-white/50">
        © {new Date().getFullYear()} HurdExpress
      </footer>
    </>
  );
}
