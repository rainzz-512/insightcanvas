// components/DashboardEditorClient.tsx
"use client";

import { useEffect, useState } from "react";
import Button from "@/components/Button";

type ChartLite = {
  id: string;
  name: string;
  type: "bar" | "line" | "pie";
};

type DashboardItemLite = {
  id: string;
  chart: ChartLite;
  layoutJson: any | null;
};

type DashboardAPI = {
  id: string;
  name: string;
  isPublic: boolean;
  items: DashboardItemLite[];
};

export default function DashboardEditorClient({
  dashboardId,
  dashboardName,
}: {
  dashboardId: string;
  dashboardName: string;
}) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<DashboardAPI | null>(null);

  // Fetch ONCE; avoid cache issues while editing
  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setLoading(true);
        setErr(null);
        const res = await fetch(`/api/dashboards/${dashboardId}`, {
          method: "GET",
          cache: "no-store",
        });
        // If the route accidentally returns HTML (like an error page),
        // this protects against JSON.parse crashes and re-render loops.
        const text = await res.text();
        let json: any;
        try {
          json = JSON.parse(text);
        } catch {
          throw new Error("Server returned non-JSON response.");
        }
        if (!res.ok) throw new Error(json?.error || "Failed to load dashboard");
        if (!cancelled) setData(json.dashboard ?? json);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Failed to load dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [dashboardId]);

  if (loading) {
    return <main className="p-6">Loading dashboard…</main>;
  }
  if (err) {
    return (
      <main className="p-6">
        <p className="text-red-600">Error: {err}</p >
      </main>
    );
  }
  if (!data) {
    return (
      <main className="p-6">
        <p className="text-red-600">Dashboard not found.</p >
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Edit layout · {dashboardName}</h1>
        <Button variant="ghost" onClick={() => history.back()}>
          Done
        </Button>
      </header>

      {/* Editor placeholder — we’ll add drag/resizing in Day 17 */}
      <section className="border rounded bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm text-gray-600">
          Layout editor coming soon. Below are the current items:
        </p >

        <div className="space-y-3">
          {data.items.map((it) => (
            <div key={it.id} className="border rounded p-3">
              <div className="text-xs text-gray-500 mb-1">
                Layout: {JSON.stringify(it.layoutJson ?? {})}
              </div>
              <div className="font-medium">
                Chart: {it.chart.name} ({it.chart.type})
              </div>
            </div>
          ))}
          {data.items.length === 0 && (
            <div className="text-sm text-gray-600">No items yet.</div>
          )}
        </div>
      </section>
    </main>
  );
}