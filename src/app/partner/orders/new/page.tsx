import Link from "next/link";
import PartnerOrderForm from "@/components/partner/PartnerOrderForm";

export default function PartnerNewOrderPage() {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/partner/orders" className="hover:text-brand">
          Миний захиалгууд
        </Link>
        <span>/</span>
        <span className="text-navy">Шинэ захиалга</span>
      </div>

      <h1 className="mt-2 text-2xl font-bold text-navy">Шинэ захиалга</h1>
      <p className="mt-1 text-sm text-slate-500">
        Захиалгын код хадгалах үед автоматаар үүснэ.
      </p>

      <div className="mt-6">
        <PartnerOrderForm />
      </div>
    </div>
  );
}
