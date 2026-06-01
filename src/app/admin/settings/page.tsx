import SettingsForm from "@/components/admin/SettingsForm";

export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Тохиргоо</h1>
      <p className="mt-1 text-sm text-slate-500">
        Системийн ерөнхий тохиргоо ба брэнд мэдээлэл
      </p>
      <div className="mt-6">
        <SettingsForm />
      </div>
    </div>
  );
}
