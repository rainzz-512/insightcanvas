// app/dashboard/[id]/edit/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Button from "@/components/Button";

type ChartLite = { id: string; name: string; type: "bar" | "line" | "pie" };
type DashboardItemLite = {
  id: string;
  layoutJson: any | null;
  chart: ChartLite;
};

type DashboardResp = {
  dashboard: {
    id: string;
    name: string;
    isPublic: boolean;
    createdAt: string;
    items: DashboardItemLite[];
  };
};

export default function DashboardEditPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [dash, setDash] = useState<DashboardResp["dashboard"] | null>(null);
  const [items, setItems] = useState<DashboardItemLite[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  // Load dashboard + normalize order
  useEffect(() => {
    let canceled = false;

    const run = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setErr(null);
        const res = await fetch(`/api/dashboards/${id}`);
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(`GET /api/dashboards/${id} -> ${res.status}${txt ? ` (${txt})` : ""}`);
        }
        const json: DashboardResp = await res.json();
        if (canceled) return;

        const normalized = json.dashboard.items
          .map((it, idx) => {
            const order =
              typeof it.layoutJson?.order === "number" ? it.layoutJson.order : idx;
            return { ...it, layoutJson: { ...(it.layoutJson || {}), order } };
          })
          .sort((a, b) => (a.layoutJson.order ?? 0) - (b.layoutJson.order ?? 0));

        setDash(json.dashboard);
        setItems(normalized);
      } catch (e: any) {
        setErr(e?.message || "Failed to load dashboard");
      } finally {
        if (!canceled) setLoading(false);
      }
    };

    run();
    return () => {
      canceled = true;
    };
  }, [id]);

  const title = useMemo(() => (dash ? `Edit layout · ${dash.name}` : "Edit layout"), [dash]);

  // ---------- Drag & Drop handlers ----------
  const onDragStart = (index: number) => (e: React.DragEvent) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // Some browsers need data to start a drag
    e.dataTransfer.setData("text/plain", String(index));
  };

  const onDragOver = (index: number) => (e: React.DragEvent) => {
    e.preventDefault(); // allow drop
    if (overIndex !== index) setOverIndex(index);
  };

  const onDragLeave = () => setOverIndex(null);

  const onDrop = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    const from = dragIndex;
    if (from == null || from === index) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(index, 0, moved);
      return next.map((it, i) => ({
        ...it,
        layoutJson: { ...(it.layoutJson || {}), order: i },
      }));
    });
    setDragIndex(null);
    setOverIndex(null);
  };

  // Keyboard helpers (↑ / ↓ on focused card)
  const onKeyReorder = (index: number, dir: -1 | 1) => {
    setItems((prev) => {
      const j = index + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[j]] = [next[j], next[index]];
      return next.map((it, i) => ({
        ...it,
        layoutJson: { ...(it.layoutJson || {}), order: i },
      }));
    });
  };

  // Save
  const onSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const payload = {
        items: items.map((it) => ({
          id: it.id,
          layoutJson: it.layoutJson || { order: 0 },
        })),
      };
      const res = await fetch(`/api/dashboards/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`PUT /api/dashboards/${id} -> ${res.status}${txt ? ` (${txt})` : ""}`);
      }
      router.push(`/dashboard/${id}`);
    } catch (e: any) {
      alert(e?.message || "Failed to save order");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <main className="p-6">Loading dashboard…</main>;
  if (err) return <main className="p-6 text-red-600">Error: {err}</main>;
  if (!dash) return <main className="p-6">Dashboard not found.</main>;

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-5">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{title}</h1>
        <div className="flex gap-3">
          <Button onClick={onSave} disabled={saving} className="bg-blue-600 text-white">
            {saving ? "Saving…" : "Save order"}
          </Button>
          <Button variant="ghost" onClick={() => router.push(`/dashboard/${dash.id}`)}>
            Done
          </Button>
        </div>
      </header>

      <section className="border rounded bg-white p-4 shadow-sm">
        <p className="text-sm text-gray-600 mb-3">
          Drag cards to reorder (or focus a card and press ↑ / ↓). Charts aren’t rendered here to
          keep the editor fast — you’ll see the new order on the dashboard view.
        </p >

        <ul className="space-y-3">
          {items.map((it, index) => {
            const isOver = overIndex === index;
            const isDragging = dragIndex === index;
            return (
              <li
                key={it.id}
                draggable
                onDragStart={onDragStart(index)}
                onDragOver={onDragOver(index)}
                onDragLeave={onDragLeave}
                onDrop={onDrop(index)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    onKeyReorder(index, -1);
                  } else if (e.key === "ArrowDown") {
                    e.preventDefault();
                    onKeyReorder(index, 1);
                  }
                }}
                className={[
                  "border rounded p-3 flex items-center justify-between select-none outline-none",
                  isDragging ? "opacity-60" : "",
                  isOver ? "ring-2 ring-blue-400" : "",
                ].join(" ")}
              >
                <div className="text-sm">
                  <div className="text-gray-700 font-medium">
                    {it.chart.name} <span className="text-gray-500">({it.chart.type})</span>
                  </div>
                  <div className="font-mono text-xs text-gray-500">
                    {JSON.stringify(it.layoutJson ?? {})}
                  </div>
                </div>

                <div className="flex gap-2 text-xs text-gray-600">
                  <span className="px-2 py-1 border rounded bg-gray-50">Drag</span>
                </div>
              </li>
            );
          })}
          {items.length === 0 && (
            <li className="text-sm text-gray-500">No items on this dashboard yet.</li>
          )}
        </ul>
      </section>
    </main>
  );
}