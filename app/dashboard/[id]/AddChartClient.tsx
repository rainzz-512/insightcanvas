// app/dashboard/[id]/AddChartClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ChartRow = {
  id: string;
  name: string;
  type: string;
  dataset: { id: string; name: string };
  createdAt: string;
};

export default function AddChartClient({ dashboardId }: { dashboardId: string }) {
  const [charts, setCharts] = useState<ChartRow[]>([]);
  const [selected, setSelected] = useState("");
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    (async () => {
      setMsg("");
      const res = await fetch("/api/charts");
      const json = await res.json();
      if (res.ok) setCharts(json.charts || []);
      else setMsg(json.error || "Failed to load charts");
    })();
  }, []);

  async function handleAdd() {
    if (!selected) return;
    try {
      setAdding(true);
      setMsg("");
      const res = await fetch(`/api/dashboards/${dashboardId}/add-chart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chartId: selected }),
      });
      const json = await res.json();
      if (res.ok) {
        setMsg("✅ Chart added.");
        setSelected("");
        // refresh the server component to show new item
        router.refresh();
      } else {
        setMsg(`❌ ${json.error || "Failed to add."}`);
      }
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="border rounded bg-white p-4 shadow-sm space-y-3">
      <h2 className="text-sm font-medium">Add an existing chart</h2>
      <div className="flex gap-2">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="border rounded p-2 flex-1"
        >
          <option value="">Select a chart…</option>
          {charts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} · {c.type} ({c.dataset?.name})
            </option>
          ))}
        </select>
        <button
          onClick={handleAdd}
          disabled={!selected || adding}
          className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
        >
          {adding ? "Adding…" : "Add"}
        </button>
      </div>
      {msg && <p className="text-sm text-gray-600">{msg}</p >}
    </div>
  );
}