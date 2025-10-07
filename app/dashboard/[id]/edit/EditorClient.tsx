'use client';
import { useMemo, useState } from "react";
import { WidthProvider, Responsive, Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { useRouter } from "next/navigation";

type Item = {
  id: string;
  chart: { id: string; name: string; type: string; configJson: any };
  layout: null | { x: number; y: number; w: number; h: number };
};

const ResponsiveGridLayout = WidthProvider(Responsive);

/**
 * Simple defaults: 12-column grid. If item has no saved layout, we place it automatically.
 */
export default function EditorClient({
  dashboardId,
  items,
}: {
  dashboardId: string;
  items: Item[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // construct an initial layout for "lg" breakpoint
  const initialLg: Layout[] = useMemo(() => {
    const cols = 12;
    const defaultW = 6; // half width
    const defaultH = 6; // tile height

    let cursorX = 0;
    let cursorY = 0;

    return items.map((it, idx) => {
      if (it.layout) {
        return {
          i: it.id,
          x: it.layout.x,
          y: it.layout.y,
          w: it.layout.w,
          h: it.layout.h,
        };
      }

      // auto place
      const w = defaultW;
      const h = defaultH;
      const x = cursorX;
      const y = cursorY;

      cursorX += w;
      if (cursorX >= cols) {
        cursorX = 0;
        cursorY += h;
      }

      return { i: it.id, x, y, w, h };
    });
  }, [items]);

  const [layouts, setLayouts] = useState<{ [key: string]: Layout[] }>({
    lg: initialLg,
  });

  async function handleSave() {
    try {
      setSaving(true);
      setMessage("");

      const lg = layouts.lg ?? [];
      const payload = lg.map((l) => ({
        id: l.i,
        x: l.x,
        y: l.y,
        w: l.w,
        h: l.h,
      }));

      const res = await fetch(`/api/dashboards/${dashboardId}/layout`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payload }),
      });

      const json = await res.json();
      if (!res.ok) {
        setMessage(json?.error || "Failed to save.");
        return;
      }
      setMessage("✅ Layout saved.");
      // refresh dashboard page when user goes back
      router.refresh();
    } catch (e) {
      console.error(e);
      setMessage("Network error.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save layout"}
        </button>
        {message && <span className="text-sm text-gray-700">{message}</span>}
      </div>

      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768 }}
        cols={{ lg: 12, md: 10, sm: 6 }}
        rowHeight={20}
        isResizable
        isDraggable
        onLayoutChange={(currLayout /*, allLayouts */) => {
          setLayouts((prev) => ({ ...prev, lg: currLayout }));
        }}
        draggableHandle=".tile-handle"
      >
        {items.map((it) => (
          <div key={it.id} className="border rounded bg-white shadow-sm">
            <div className="tile-handle cursor-move px-3 py-2 border-b bg-gray-50 text-sm font-medium">
              {it.chart.name}
            </div>
            <div className="p-3 text-sm text-gray-600">
              <div>Type: {it.chart.type}</div>
              <div className="text-xs text-gray-500">
                Drag the top bar to move, drag edges to resize.
              </div>
            </div>
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
}