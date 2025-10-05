// app/charts/new/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Button from "@/components/Button";

import {
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

type Column = { name: string; type: "string" | "number" | "date" };

type DatasetAPI = {
  id: string;
  name: string;
  rowCount: number;
  createdAt: string;
  schemaJson: { columns: Column[] };
  sampleRowsJson: Record<string, string | number>[] | null;
};

const DEFAULT_COLORS = [
  "#2563EB", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
  "#06B6D4", "#F97316", "#84CC16", "#EC4899", "#14B8A6",
];

export default function NewChartPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const datasetId = searchParams.get("datasetId");

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [dataset, setDataset] = useState<DatasetAPI | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [rows, setRows] = useState<Record<string, any>[]>([]);

  // Chart editor state
  const [chartType, setChartType] = useState<"bar" | "line" | "pie">("bar");
  const [xKey, setXKey] = useState<string>("");
  const [yKey, setYKey] = useState<string>(""); // numeric recommended
  const [name, setName] = useState<string>("");

  const [saving, setSaving] = useState(false);

  // -------- Fetch dataset (flat API response expected) --------
  useEffect(() => {
    const run = async () => {
      if (!datasetId) return;
      try {
        setLoading(true);
        setFetchError(null);

        const res = await fetch(`/api/datasets/${datasetId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to load dataset");

        // If your API returns { dataset: {...} }, unwrap it:
        const d: DatasetAPI = json?.id ? json : json?.dataset;

        setDataset(d);
        const cols = d?.schemaJson?.columns ?? [];
        setColumns(Array.isArray(cols) ? cols : []);
        const sample = (d?.sampleRowsJson ?? []) as Record<string, any>[];
        setRows(Array.isArray(sample) ? sample : []);

        // Sensible defaults
        if (cols.length >= 2) {
          setXKey(cols[0].name);
          // Prefer a numeric yKey if available
          const numericCol = cols.find((c) => c.type === "number") ?? cols[1];
          setYKey(numericCol?.name ?? cols[1].name);
          setName(`${numericCol?.name ?? cols[1].name} by ${cols[0].name}`);
        } else if (cols.length === 1) {
          setXKey(cols[0].name);
          setYKey(cols[0].name);
          setName(`${cols[0].name}`);
        }
      } catch (e: any) {
        setFetchError(e?.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [datasetId]);

  // -------- Helpers --------
  const numericColumns = useMemo(
    () => columns.filter((c) => c.type === "number"),
    [columns]
  );

  const canPreview = useMemo(() => {
    if (!rows.length || !xKey) return false;
    if (chartType === "pie") {
      // Pie needs a label (xKey) + numeric value (yKey)
      return !!yKey;
    }
    // bar/line need x and y
    return !!yKey;
  }, [rows.length, xKey, yKey, chartType]);

  const previewTitle = useMemo(() => {
    if (!name) return "Untitled chart";
    return name;
  }, [name]);

  // -------- Save chart --------
  const onSave = async () => {
    if (!datasetId || !xKey || !yKey) return;
    setSaving(true);
    try {
      const res = await fetch("/api/charts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          datasetId,
          name: name || `${yKey} by ${xKey}`,
          type: chartType,
          configJson:
            chartType === "pie"
              ? { labelKey: xKey, valueKey: yKey }
              : { xKey, yKey },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to save chart");
      // go to detail page
      const id = json?.chart?.id ?? json?.id;
      router.push(`/charts/${id}`);
    } catch (e: any) {
      alert(e?.message || "Failed to save chart");
    } finally {
      setSaving(false);
    }
  };

  // -------- Chart preview (client-only) --------
  const Preview = () => {
    if (!canPreview) {
      return (
        <div className="text-sm text-gray-500 text-center py-10">
          {rows.length === 0
            ? "This dataset has no sample rows. Re-upload the CSV to generate previews."
            : "Select X and Y to preview your chart."}
        </div>
      );
    }

    if (chartType === "bar") {
      return (
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Bar dataKey={yKey} />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === "line") {
      return (
        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey={yKey} />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    // pie
    // For pie, we map rows into { name: rows[xKey], value: Number(rows[yKey]) }
    const pieData = rows
      .map((r) => ({
        name: String(r[xKey] ?? ""),
        value: Number(r[yKey] ?? 0),
      }))
      .filter((d) => !Number.isNaN(d.value));

    return (
      <ResponsiveContainer width="100%" height={340}>
        <PieChart>
          <Tooltip />
          <Legend />
          <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={120}>
            {pieData.map((_, idx) => (
              <Cell key={idx} fill={DEFAULT_COLORS[idx % DEFAULT_COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    );
  };

  // -------- Render --------
  if (!datasetId) {
    return <main className="p-6 text-red-600">Missing datasetId</main>;
  }
  if (loading) {
    return <main className="p-6">Loading dataset…</main>;
  }
  if (fetchError) {
    return (
      <main className="p-6">
        <p className="text-red-600">Error: {fetchError}</p >
      </main>
    );
  }
  if (!dataset) {
    return <main className="p-6">Dataset not found.</main>;
  }

  const hasEnoughCols = columns.length >= 1; // at least one column to show something

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <header>
        <h1 className="text-xl font-semibold">Create Chart</h1>
        <p className="text-gray-600">
          Dataset: <span className="font-medium">{dataset.name}</span> ·{" "}
          {dataset.rowCount} rows
        </p >
      </header>

      {!hasEnoughCols ? (
        <p className="text-sm text-gray-600">
          This dataset doesn’t have enough columns to build a chart.
        </p >
      ) : (
        <div className="grid gap-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium">Chart name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border p-2 rounded w-full"
              placeholder={
                chartType === "pie"
                  ? `${yKey || "value"} by ${xKey || "label"}`
                  : `${yKey || "y"} by ${xKey || "x"}`
              }
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium">Chart type</label>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value as any)}
              className="border p-2 rounded w-full"
            >
              <option value="bar">Bar</option>
              <option value="line">Line</option>
              <option value="pie">Pie</option>
            </select>
          </div>

          {/* X */}
          <div>
            <label className="block text-sm font-medium">
              {chartType === "pie" ? "Label (X)" : "X axis"}
            </label>
            <select
              value={xKey}
              onChange={(e) => setXKey(e.target.value)}
              className="border p-2 rounded w-full"
            >
              {columns.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name} {c.type !== "string" ? `(${c.type})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Y */}
          <div>
            <label className="block text-sm font-medium">
              {chartType === "pie" ? "Value (Y)" : "Y axis"}
            </label>
            <select
              value={yKey}
              onChange={(e) => setYKey(e.target.value)}
              className="border p-2 rounded w-full"
            >
              {(chartType === "pie" ? numericColumns : columns)
                .filter((c) => c.name !== xKey)
                .map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} {c.type !== "string" ? `(${c.type})` : ""}
                  </option>
                ))}
            </select>
            {chartType === "pie" && numericColumns.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                No numeric columns detected. Pie requires a numeric value column.
              </p >
            )}
          </div>

          {/* Preview */}
          <section className="border rounded bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-medium">{previewTitle}</h2>
              <span className="text-xs text-gray-500">
                Previewing {rows.length} sample row{rows.length === 1 ? "" : "s"}
              </span>
            </div>
            <Preview />
          </section>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={onSave}
              disabled={saving || !canPreview}
              className="bg-blue-600 text-white"
            >
              {saving ? "Saving…" : "Save chart"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push(`/datasets/${dataset.id}`)}
            >
              Back to dataset
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}