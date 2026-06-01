"use client";

import { useEffect, useMemo, useState } from "react";
import UserForm from "@/components/admin/UserForm";
import UserTable from "@/components/admin/UserTable";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import LoadingState from "@/components/ui/LoadingState";
import { setUserActive, subscribeUsers } from "@/lib/firebase/users";
import type { User } from "@/types";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  useEffect(() => {
    const unsub = subscribeUsers(
      (list) => {
        setUsers(list);
        setLoading(false);
      },
      () => {
        setError("Хэрэглэгчдийн жагсаалтыг ачаалахад алдаа гарлаа.");
        setLoading(false);
      },
    );
    return () => unsub();
  }, []);

  // Зөвхөн admin хэрэглэгчид (partner/driver-г тус панелиудаас удирдана).
  const admins = useMemo(() => users.filter((u) => u.role === "admin"), [users]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return admins;
    return admins.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone.toLowerCase().includes(q),
    );
  }, [admins, search]);

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(user: User) {
    setEditing(user);
    setFormOpen(true);
  }

  async function toggleActive(user: User) {
    try {
      await setUserActive(user.uid, !user.isActive);
    } catch {
      setError("Төлөв солиход алдаа гарлаа.");
    }
  }

  return (
    <div>
      {/* Толгой */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Админ хэрэглэгчид</h1>
          <p className="mt-1 text-sm text-slate-500">
            Системийн админ эрхтэй хэрэглэгчдийг удирдах
          </p>
        </div>
        <button
          onClick={openAdd}
          className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
        >
          + Шинэ админ
        </button>
      </div>

      {/* Хайлт */}
      <div className="mt-5">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Нэр, имэйл эсвэл утсаар хайх…"
          className="w-full max-w-sm rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-navy outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      </div>

      {error && (
        <div className="mt-4">
          <ErrorState message={error} />
        </div>
      )}

      {/* Контент */}
      <div className="mt-5">
        {loading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="🛡️"
            title={search ? "Илэрц олдсонгүй" : "Одоогоор админ алга"}
            description={
              search ? "Хайлтаа өөрчилж үзнэ үү." : "Дээрх товчоор шинэ админ нэмнэ үү."
            }
          />
        ) : (
          <UserTable users={filtered} onEdit={openEdit} onToggleActive={toggleActive} />
        )}
      </div>

      {formOpen && <UserForm initial={editing} onClose={() => setFormOpen(false)} />}
    </div>
  );
}
