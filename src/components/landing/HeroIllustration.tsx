// Hero-ийн premium illustration — гадны зураг ашиглахгүй, цэвэр SVG + CSS.
// Хотын дүрс, гүйх замын зурвас, pin-ууд, цагаан ачааны машин, хөвөгч badge.
export default function HeroIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-lg">
      {/* Гэрэлт диск */}
      <div
        className="absolute inset-0 -z-10 rounded-[2rem] bg-gradient-to-tr from-brand/20 to-blue-400/10 blur-2xl"
        aria-hidden
      />

      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-sm">
        <svg viewBox="0 0 420 320" className="w-full" role="img" aria-label="Хүргэлтийн зам ба ачааны машин">
          <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#13294d" />
              <stop offset="100%" stopColor="#0b1b33" />
            </linearGradient>
            <linearGradient id="van" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>
          </defs>

          {/* Тэнгэр */}
          <rect x="0" y="0" width="420" height="320" rx="20" fill="url(#sky)" />

          {/* Хотын дүрс (барилгууд) */}
          <g fill="#1e3a63" opacity="0.85">
            <rect x="20" y="150" width="34" height="120" rx="4" />
            <rect x="60" y="110" width="28" height="160" rx="4" />
            <rect x="94" y="170" width="30" height="100" rx="4" />
            <rect x="300" y="130" width="30" height="140" rx="4" />
            <rect x="336" y="100" width="26" height="170" rx="4" />
            <rect x="368" y="160" width="32" height="110" rx="4" />
          </g>
          <g fill="#fbbf24" opacity="0.5">
            <rect x="66" y="124" width="5" height="6" /><rect x="76" y="124" width="5" height="6" />
            <rect x="66" y="140" width="5" height="6" /><rect x="76" y="140" width="5" height="6" />
            <rect x="342" y="116" width="5" height="6" /><rect x="352" y="116" width="5" height="6" />
            <rect x="342" y="132" width="5" height="6" /><rect x="352" y="132" width="5" height="6" />
          </g>

          {/* Гүйх замын зурвас */}
          <path
            d="M30,90 C120,40 200,140 300,70 C340,44 370,60 396,48"
            fill="none"
            stroke="#f97316"
            strokeWidth="3"
            strokeLinecap="round"
            className="hx-route-anim"
            opacity="0.9"
          />

          {/* Pin-ууд */}
          {[
            { x: 30, y: 90 },
            { x: 200, y: 118 },
            { x: 300, y: 70 },
            { x: 396, y: 48 },
          ].map((p, i) => (
            <g key={i} transform={`translate(${p.x - 9},${p.y - 24})`}>
              <path
                d="M9 0C4 0 0 4 0 9c0 6.5 9 15 9 15s9-8.5 9-15C18 4 14 0 9 0z"
                fill={i % 2 === 0 ? "#f97316" : "#3b82f6"}
              />
              <circle cx="9" cy="9" r="3.4" fill="#fff" />
            </g>
          ))}

          {/* Зам (road) */}
          <rect x="0" y="262" width="420" height="58" fill="#0a1628" />
          <g stroke="#475569" strokeWidth="3" strokeDasharray="18 16">
            <line x1="0" y1="291" x2="420" y2="291" />
          </g>

          {/* Ачааны машин */}
          <g transform="translate(126,196)">
            {/* их бие */}
            <rect x="0" y="14" width="118" height="56" rx="8" fill="url(#van)" />
            {/* кабин */}
            <path d="M118,22 h26 l20,22 v26 h-46 z" fill="url(#van)" />
            {/* салхины шил */}
            <path d="M124,26 h16 l13,15 h-29 z" fill="#bcd3ea" />
            {/* доод хар зурвас */}
            <rect x="0" y="60" width="164" height="10" rx="3" fill="#334155" />
            {/* лого */}
            <text x="40" y="48" textAnchor="middle" fontSize="16" fontWeight="700" fill="#7f1d1d" fontFamily="Arial">
              HE
            </text>
            {/* дугуй */}
            <circle cx="34" cy="72" r="14" fill="#0f172a" />
            <circle cx="34" cy="72" r="6" fill="#64748b" />
            <circle cx="138" cy="72" r="14" fill="#0f172a" />
            <circle cx="138" cy="72" r="6" fill="#64748b" />
          </g>
        </svg>
      </div>

      {/* Хөвөгч badge — баруун дээд */}
      <div className="hx-float absolute -right-3 top-6 rounded-2xl border border-slate-100 bg-white px-4 py-3 text-navy shadow-xl sm:-right-6">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-100 text-lg">📦</span>
          <div>
            <p className="text-sm font-bold leading-none">Хүргэгдсэн</p>
            <p className="mt-1 text-[11px] text-slate-500">Real-time төлөв</p>
          </div>
        </div>
      </div>

      {/* Хөвөгч badge — зүүн доод */}
      <div className="hx-float-slow absolute -left-3 bottom-8 rounded-2xl border border-slate-100 bg-white px-4 py-3 text-navy shadow-xl sm:-left-6">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/15 text-lg">📍</span>
          <div>
            <p className="text-sm font-bold leading-none">GPS хяналт</p>
            <p className="mt-1 text-[11px] text-slate-500">Газрын зураг дээр</p>
          </div>
        </div>
      </div>
    </div>
  );
}
