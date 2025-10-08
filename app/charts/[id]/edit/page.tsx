'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Button from '@/components/Button';
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
} from 'recharts';

type Column = { name: string; type: 'string' | 'number' | 'date' };

type ChartAPI = {
  id: string;
  name: string;
  type: 'bar' | 'line' | 'pie';
  configJson:
    | { xKey: string; yKey: string }
    | { labelKey: string; valueKey: string };
  dataset: {
    id: string;
    name: string;
    sampleRowsJson: Record<string, any>[] | null;
    schemaJson?: { columns?: Column[] } | null;
  };
};

type DatasetAPI = {
  id: string;
  name: string;
  rowCount: number;
  schemaJson: { columns?: Column[] } | null;
  sampleRowsJson: Record<string, any>[] | null;
};

const COLORS = [
  '#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#14B8A6',
];

// --- helper to safely parse JSON or return text/empty
async function readBodySafe(res: Response) {
  const text = await res.text(); // read once
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text; // maybe HTML error page or plain text
  }
}

export default function EditChartPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [fetchErr, setFetchErr] = useState<string | null>(null);
  const [chart, setChart] = useState<ChartAPI | null>(null);

  // If sample rows are empty and schemaJson wasn’t returned with the chart, fetch dataset schema:
  const [schemaCols, setSchemaCols] = useState<Column[] | null>(null);

  // editable state
  const [name, setName] = useState('');
  const [type, setType] = useState<'bar' | 'line' | 'pie'>('bar');
  const [xKey, setXKey] = useState('');
  const [yKey, setYKey] = useState('');
  const [labelKey, setLabelKey] = useState('');
  const [valueKey, setValueKey] = useState('');

  const rows = (chart?.dataset.sampleRowsJson ?? []) as Record<string, any>[];

  // Columns = prefer fetched schema → chart.schemaJson → infer from first sample row
  const columns: Column[] = useMemo(() => {
    if (schemaCols && schemaCols.length) return schemaCols;

    const apiSchema = chart?.dataset.schemaJson?.columns;
    if (apiSchema && apiSchema.length) return apiSchema;

    const first = rows[0] || {};
    return Object.keys(first).map((k) => {
      const v = first[k];
      const t =
        typeof v === 'number'
          ? 'number'
          : /^\d{4}-\d{2}-\d{2}/.test(String(v))
          ? 'date'
          : 'string';
      return { name: k, type: t };
    });
  }, [schemaCols, chart?.dataset.schemaJson, rows]);

  const numericColumns = useMemo(
    () => columns.filter((c) => c.type === 'number'),
    [columns]
  );

  // Initial fetch of chart
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/charts/${id}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'Failed to load chart');

        const c: ChartAPI = json.chart ?? json;
        setChart(c);
        setName(c.name);
        setType(c.type);

        if (c.type === 'pie') {
          const cfg = c.configJson as any;
          setLabelKey(cfg?.labelKey || '');
          setValueKey(cfg?.valueKey || '');
        } else {
          const cfg = c.configJson as any;
          setXKey(cfg?.xKey || '');
          setYKey(cfg?.yKey || '');
        }
      } catch (e: any) {
        setFetchErr(e?.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Fetch dataset schema if needed (no rows and no schema came with the chart)
  useEffect(() => {
    (async () => {
      if (!chart?.dataset?.id) return;

      const alreadyHaveColumns =
        (chart.dataset.schemaJson?.columns?.length ?? 0) > 0 ||
        (schemaCols?.length ?? 0) > 0 ||
        rows.length > 0;

      if (alreadyHaveColumns) return;

      try {
        const res = await fetch(`/api/datasets/${chart.dataset.id}`);
        const json = await res.json();
        const d: DatasetAPI = json?.dataset ?? json;
        const cols = d?.schemaJson?.columns ?? [];
        if (Array.isArray(cols) && cols.length) setSchemaCols(cols);
      } catch {
        // ignore; selects will just be empty if truly no schema
      }
    })();
  }, [chart?.dataset?.id, chart?.dataset?.schemaJson, rows.length, schemaCols?.length]);

  const canPreview =
    rows.length > 0 &&
    ((type === 'pie' && labelKey && valueKey) ||
      (type !== 'pie' && xKey && yKey));

  // -------- Save / Delete with safe body parsing --------
  const onSave = async () => {
    try {
      const body =
        type === 'pie'
          ? { name, type, configJson: { labelKey, valueKey } }
          : { name, type, configJson: { xKey, yKey } };

      const res = await fetch(`/api/charts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const payload = await readBodySafe(res);
      if (!res.ok) {
        const msg =
          (payload && (payload as any).error) ||
          (typeof payload === 'string' ? payload : '') ||
          `HTTP ${res.status}`;
        throw new Error(msg);
      }

      // Optional: if API returns chart, you could use it. We just navigate back.
      router.push(`/charts/${id}`);
    } catch (e: any) {
      alert(e?.message || 'Update failed');
    }
  };

  const onDelete = async () => {
    if (!confirm('Delete this chart?')) return;
    try {
      const res = await fetch(`/api/charts/${id}`, { method: 'DELETE' });
      const payload = await readBodySafe(res);
      if (!res.ok) {
        const msg =
          (payload && (payload as any).error) ||
          (typeof payload === 'string' ? payload : '') ||
          `HTTP ${res.status}`;
        throw new Error(msg);
      }
      router.push('/charts');
    } catch (e: any) {
      alert(e?.message || 'Delete failed');
    }
  };

  // -------- Preview --------
  const Preview = () => {
    if (!canPreview) {
      return (
        <div className="text-sm text-gray-500 text-center py-10">
          Select fields to preview your chart.
        </div>
      );
    }

    if (type === 'pie') {
      const data = rows
        .map((r) => ({
          name: String(r[labelKey] ?? ''),
          value: Number(r[valueKey] ?? 0),
        }))
        .filter((d) => !Number.isNaN(d.value));

      return (
        <ResponsiveContainer width="100%" height={340}>
          <PieChart>
            <Tooltip />
            <Legend />
            <Pie data={data} dataKey="value" nameKey="name" outerRadius={120}>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      );
    }

    if (type === 'bar') {
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
  };

  // -------- Render --------
  if (loading) return <main className="p-6">Loading chart…</main>;
  if (fetchErr) return <main className="p-6 text-red-600">Error: {fetchErr}</main>;
  if (!chart) return <main className="p-6">Chart not found.</main>;

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <header>
        <h1 className="text-xl font-semibold">Edit Chart</h1>
        <p className="text-gray-600">
          Dataset: <span className="font-medium">{chart.dataset.name}</span>
        </p >
      </header>

      <div className="grid gap-4">
        <div>
          <label className="block text-sm font-medium">Chart name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border p-2 rounded w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Chart type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="border p-2 rounded w-full"
          >
            <option value="bar">Bar</option>
            <option value="line">Line</option>
            <option value="pie">Pie</option>
          </select>
        </div>

        {type === 'pie' ? (
          <>
            <div>
              <label className="block text-sm font-medium">Label (X)</label>
              <select
                value={labelKey}
                onChange={(e) => setLabelKey(e.target.value)}
                className="border p-2 rounded w-full"
              >
                <option value="" disabled>
                  {columns.length ? 'Select label column…' : 'No columns found'}
                </option>
                {columns.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Value (Y)</label>
              <select
                value={valueKey}
                onChange={(e) => setValueKey(e.target.value)}
                className="border p-2 rounded w-full"
              >
                <option value="" disabled>
                  {numericColumns.length ? 'Select numeric column…' : 'No numeric columns'}
                </option>
                {numericColumns.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} (number)
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium">X axis</label>
              <select
                value={xKey}
                onChange={(e) => setXKey(e.target.value)}
                className="border p-2 rounded w-full"
              >
                <option value="" disabled>
                  {columns.length ? 'Select X…' : 'No columns found'}
                </option>
                {columns.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} {c.type !== 'string' ? `(${c.type})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Y axis</label>
              <select
                value={yKey}
                onChange={(e) => setYKey(e.target.value)}
                className="border p-2 rounded w-full"
              >
                <option value="" disabled>
                  {columns.length ? 'Select Y…' : 'No columns found'}
                </option>
                {columns
                  .filter((c) => c.name !== xKey)
                  .map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name} {c.type !== 'string' ? `(${c.type})` : ''}
                    </option>
                  ))}
              </select>
            </div>
          </>
        )}

        <section className="border rounded bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-medium">Preview</h2>
            <span className="text-xs text-gray-500">
              {rows.length} sample row{rows.length === 1 ? '' : 's'}
            </span>
          </div>
          <Preview />
        </section>

        <div className="flex gap-3">
          <Button onClick={onSave} className="bg-blue-600 text-white">
            Save changes
          </Button>
          <Button variant="ghost" onClick={() => router.push(`/charts/${id}`)}>
            Cancel
          </Button>
          <Button variant="ghost" onClick={onDelete}>
            Delete chart
          </Button>
        </div>
      </div>
    </main>
  );
} 