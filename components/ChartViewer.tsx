// components/ChartViewer.tsx
"use client";

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

type BaseProps = {
  data: Record<string, any>[];
};

type BarLineProps = BaseProps & {
  type: "bar" | "line";
  xKey: string;
  yKey: string;
};

type PieProps = BaseProps & {
  type: "pie";
  labelKey: string;
  valueKey: string;
};

type Props = BarLineProps | PieProps;

const COLORS = [
  "#2563EB",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
  "#F97316",
  "#84CC16",
  "#EC4899",
  "#14B8A6",
];

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function isMonthName(v: string) {
  return MONTHS.includes(v);
}

function monthCompare(a: string, b: string) {
  return MONTHS.indexOf(a) - MONTHS.indexOf(b);
}

/** Sum-aggregate rows that share the same key */
function aggregateByKey(
  rows: Record<string, any>[],
  key: string,
  valueKey: string
) {
  const bucket = new Map<string, number>();

  for (const r of rows) {
    const k = String(r[key] ?? "");
    const v = Number(r[valueKey] ?? 0);
    if (!Number.isFinite(v)) continue;
    bucket.set(k, (bucket.get(k) ?? 0) + v);
  }

  // If keys look like month names, keep calendar order
  const entries = Array.from(bucket.entries());
  const allMonths = entries.every(([k]) => isMonthName(k));
  if (allMonths) entries.sort(([a], [b]) => monthCompare(a, b));
  else entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

  return entries.map(([k, sum]) => ({ [key]: k, [valueKey]: sum }));
}

/** For pie charts, group by label and sum the values */
function aggregateForPie(
  rows: Record<string, any>[],
  labelKey: string,
  valueKey: string
) {
  const bucket = new Map<string, number>();
  for (const r of rows) {
    const k = String(r[labelKey] ?? "");
    const v = Number(r[valueKey] ?? 0);
    if (!Number.isFinite(v)) continue;
    bucket.set(k, (bucket.get(k) ?? 0) + v);
  }
  const entries = Array.from(bucket.entries());
  // Month-aware order if labels are months
  const allMonths = entries.every(([k]) => isMonthName(k));
  if (allMonths) entries.sort(([a], [b]) => monthCompare(a, b));
  else entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return entries.map(([name, value]) => ({ name, value }));
}

export default function ChartViewer(props: Props) {
  if (props.type === "pie") {
    const pieData = aggregateForPie(props.data, props.labelKey, props.valueKey);

    return (
      <ResponsiveContainer width="100%" height={360}>
        <PieChart>
          <Tooltip />
          <Legend />
          <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={120}>
            {pieData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    );
  }

  // bar / line
  const { xKey, yKey } = props;
  const agg = aggregateByKey(props.data, xKey, yKey);

  if (props.type === "bar") {
    return (
      <ResponsiveContainer width="100%" height={360}>
        <BarChart data={agg}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip />
          <Bar dataKey={yKey} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // line
  return (
    <ResponsiveContainer width="100%" height={360}>
      <LineChart data={agg}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xKey} />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey={yKey} />
      </LineChart>
    </ResponsiveContainer>
  );
}