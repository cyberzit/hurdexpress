"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  CLEANUP_STEPS,
  SMOKE_STEPS,
  cleanupSmokeTest,
  runSmokeTest,
  type SmokeArtifacts,
  type StepResult,
  type StepStatus,
} from "@/lib/smoke-test";

const STATUS_STYLES: Record<StepStatus, string> = {
  pending: "bg-slate-100 text-slate-500",
  running: "bg-blue-50 text-blue-700",
  success: "bg-green-50 text-green-700",
  failed: "bg-red-50 text-red-600",
};

const STATUS_LABELS: Record<StepStatus, string> = {
  pending: "Хүлээгдэж буй",
  running: "Ажиллаж байна…",
  success: "Амжилттай",
  failed: "Алдаа",
};

function StatusBadge({ status }: { status: StepStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {status === "running" && (
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-300 border-t-blue-600" />
      )}
      {status === "success" && "✓ "}
      {status === "failed" && "✕ "}
      {STATUS_LABELS[status]}
    </span>
  );
}

function ResultTable({
  steps,
  results,
}: {
  steps: { key: string; name: string }[];
  results: Record<string, StepResult>;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[680px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
            <th className="px-4 py-3 font-medium">Алхам</th>
            <th className="px-4 py-3 font-medium">Төлөв</th>
            <th className="px-4 py-3 font-medium">Алдаа / тэмдэглэл</th>
            <th className="px-4 py-3 font-medium">Document ID</th>
          </tr>
        </thead>
        <tbody>
          {steps.map((s) => {
            const r = results[s.key] ?? { status: "pending" as StepStatus };
            return (
              <tr
                key={s.key}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
              >
                <td className="px-4 py-3 font-medium text-navy">{s.name}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-4 py-3 text-xs text-red-600">{r.error || "—"}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">
                  {r.docId || "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function TestFlowPage() {
  const { profile } = useAuth();

  const [results, setResults] = useState<Record<string, StepResult>>({});
  const [cleanupResults, setCleanupResults] = useState<Record<string, StepResult>>({});
  const [artifacts, setArtifacts] = useState<SmokeArtifacts | null>(null);
  const [cleaned, setCleaned] = useState(false);
  const [running, setRunning] = useState(false);
  const [cleaning, setCleaning] = useState(false);

  const summary = useMemo(() => {
    const list = Object.values(results);
    return {
      total: SMOKE_STEPS.length,
      success: list.filter((r) => r.status === "success").length,
      failed: list.filter((r) => r.status === "failed").length,
    };
  }, [results]);

  async function handleRun() {
    if (!profile || running) return;
    setRunning(true);
    setArtifacts(null);
    setCleaned(false);
    setCleanupResults({});

    // pending мөрүүдийг урьдчилан харуулна.
    const init: Record<string, StepResult> = {};
    SMOKE_STEPS.forEach((s) => {
      init[s.key] = { key: s.key, name: s.name, status: "pending" };
    });
    setResults(init);

    try {
      const a = await runSmokeTest(
        { uid: profile.uid, name: profile.name || "Admin" },
        (r) => setResults((prev) => ({ ...prev, [r.key]: r })),
      );
      setArtifacts(a);
    } finally {
      setRunning(false);
    }
  }

  async function handleCleanup() {
    if (!profile || !artifacts || cleaning) return;
    setCleaning(true);

    const init: Record<string, StepResult> = {};
    CLEANUP_STEPS.forEach((s) => {
      init[s.key] = { key: s.key, name: s.name, status: "pending" };
    });
    setCleanupResults(init);

    try {
      await cleanupSmokeTest(artifacts, { uid: profile.uid, name: profile.name || "Admin" }, (r) =>
        setCleanupResults((prev) => ({ ...prev, [r.key]: r })),
      );
      setCleaned(true);
    } finally {
      setCleaning(false);
    }
  }

  const hasArtifacts = Boolean(
    artifacts &&
      (artifacts.companyId ||
        artifacts.productId ||
        artifacts.driverId ||
        artifacts.orderId ||
        artifacts.partnerUid ||
        artifacts.driverUid),
  );

  return (
    <div>
      {/* Толгой */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Test Flow</h1>
          <p className="mt-1 text-sm text-slate-500">
            Production smoke test — үндсэн flow-г бодит өгөгдлөөр шалгана
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRun}
            disabled={running || cleaning}
            className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-60"
          >
            {running ? "Шалгаж байна…" : "▶ Run Test"}
          </button>
          <button
            onClick={handleCleanup}
            disabled={!hasArtifacts || running || cleaning || cleaned}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-navy transition hover:bg-slate-50 disabled:opacity-50"
          >
            {cleaning ? "Цэвэрлэж байна…" : cleaned ? "Цэвэрлэсэн ✓" : "🧹 Cleanup"}
          </button>
        </div>
      </div>

      {/* Анхааруулга */}
      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        ⚠️ Энэ тест нь <span className="font-semibold">TEST_</span> угтвартай{" "}
        <span className="font-semibold">бодит Firestore өгөгдөл</span> үүсгэнэ. Cleanup нь
        зөвхөн тухайн тестийн үүсгэсэн өгөгдлийг идэвхгүй/цуцлах болгоно —{" "}
        <span className="font-semibold">production өгөгдлийг хөндөхгүй</span> (delete хийхгүй).
      </div>

      {/* Дүн */}
      {Object.keys(results).length > 0 && (
        <div className="mt-5 flex flex-wrap gap-3">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm">
            Нийт: <span className="font-bold text-navy">{summary.total}</span>
          </div>
          <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-2.5 text-sm text-green-700 shadow-sm">
            Амжилттай: <span className="font-bold">{summary.success}</span>
          </div>
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm text-red-600 shadow-sm">
            Алдаатай: <span className="font-bold">{summary.failed}</span>
          </div>
        </div>
      )}

      {/* Үр дүнгийн хүснэгт */}
      <div className="mt-5">
        <ResultTable steps={SMOKE_STEPS} results={results} />
      </div>

      {/* Cleanup үр дүн */}
      {Object.keys(cleanupResults).length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-navy">Cleanup үр дүн</h2>
          <p className="mt-1 text-sm text-slate-500">
            Тестийн өгөгдлийг идэвхгүй/цуцлав (устгаагүй).
          </p>
          <div className="mt-3">
            <ResultTable steps={CLEANUP_STEPS} results={cleanupResults} />
          </div>
        </div>
      )}
    </div>
  );
}
