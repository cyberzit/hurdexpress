import LiveDriverMap from "@/components/admin/LiveDriverMap";

export default function LiveMapPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Жолоочдын байршил</h1>
      <p className="mt-1 text-sm text-slate-500">
        Байршил хуваалцаж буй идэвхтэй жолооч нар (realtime)
      </p>
      <div className="mt-6">
        <LiveDriverMap />
      </div>
    </div>
  );
}
