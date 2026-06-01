"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import CreateShipmentForm from "@/components/CreateShipmentForm";
import { useAuth } from "@/contexts/AuthContext";
import { getShipmentsByOwner } from "@/lib/firebase/shipments";
import { SHIPMENT_STATUS_LABELS, type Shipment } from "@/types";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showForm, setShowForm] = useState(false);

  const listLoading = !loaded;

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    let active = true;
    getShipmentsByOwner(user.uid)
      .then((list) => {
        if (active) setShipments(list);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [user, loading, router, refreshKey]);

  if (loading || !user) {
    return (
      <>
        <Navbar />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-sm text-black/60 dark:text-white/60">Уншиж байна...</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Миний захиалгууд</h1>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
          >
            {showForm ? "Хаах" : "+ Шинэ захиалга"}
          </button>
        </div>

        {showForm && (
          <div className="mt-6">
            <CreateShipmentForm
              ownerUid={user.uid}
              onCreated={() => {
                setShowForm(false);
                setLoaded(false);
                setRefreshKey((k) => k + 1);
              }}
            />
          </div>
        )}

        <div className="mt-8 space-y-3">
          {listLoading ? (
            <p className="text-sm text-black/60 dark:text-white/60">Ачааллаж байна...</p>
          ) : shipments.length === 0 ? (
            <p className="rounded-md bg-black/5 px-4 py-6 text-center text-sm dark:bg-white/5">
              Захиалга алга. Дээрх товчоор шинэ захиалга үүсгэнэ үү.
            </p>
          ) : (
            shipments.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-xl border border-black/10 px-5 py-4 dark:border-white/10"
              >
                <div>
                  <p className="font-mono text-sm font-semibold">{s.trackingNumber}</p>
                  <p className="mt-0.5 text-sm text-black/60 dark:text-white/60">
                    {s.from.city} → {s.to.city}
                  </p>
                </div>
                <span className="rounded-full bg-orange-500/15 px-3 py-1 text-xs font-medium text-orange-600">
                  {SHIPMENT_STATUS_LABELS[s.status]}
                </span>
              </div>
            ))
          )}
        </div>
      </main>
    </>
  );
}
