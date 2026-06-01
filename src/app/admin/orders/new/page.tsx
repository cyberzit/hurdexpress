import Link from "next/link";
import OrderForm from "@/components/admin/OrderForm";

export default function NewOrderPage() {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/admin/orders" className="hover:text-brand">
          Захиалгууд
        </Link>
        <span>/</span>
        <span className="text-navy">Шинэ захиалга</span>
      </div>

      <h1 className="mt-2 text-2xl font-bold text-navy">Шинэ захиалга</h1>
      <p className="mt-1 text-sm text-slate-500">
        Захиалгын код хадгалах үед автоматаар үүснэ.
      </p>

      <div className="mt-6">
        <OrderForm />
      </div>
    </div>
  );
}
