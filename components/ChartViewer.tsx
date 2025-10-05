"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

type CommonProps = {
  type: "bar" | "line" | "pie";
  data: any[]; // array of row objects
};

// Bar/Line config: { xKey, yKey }
// Pie config: { labelKey, valueKey }
type Config =
  | { xKey: string; yKey: string; labelKey?: never; valueKey?: never }
  | { labelKey: string; valueKey: string; xKey?: never; yKey?: never };

type Props = CommonProps & Config;

const COLORS = [
  "#2563EB", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
  "#06B6D4", "#F97316", "#84CC16", "#EC4899", "#14B8A6",
];

export default function ChartViewer(props: Props) {
  const { type, data } = props;

  if (!data || data.length === 0) {
    return <p className="text-gray-500 text-sm">Not enough data to render.</p >;
  }

  if (type === "pie") {
    const { labelKey, valueKey } = props as Extract<Props, { labelKey: string }>;
    if (!labelKey || !valueKey) {
      return <p className="text-gray-500 text-sm">Missing label/value keys for pie.</p >;
    }

    const pieData = data
      .map((row) => ({
        name: String(row[labelKey] ?? ""),
        value: Number(row[valueKey] ?? 0),
      }))
      .filter((d) => !Number.isNaN(d.value));

    if (pieData.length === 0) {
      return <p className="text-gray-500 text-sm">No numeric values for pie chart.</p >;
    }

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

  // Bar & Line
  const { xKey, yKey } = props as Extract<Props, { xKey: string }>;
  if (!xKey || !yKey) {
    return <p className="text-gray-500 text-sm">Select X and Y to preview your chart.</p >;
  }

  if (type === "bar") {
    return (
      <ResponsiveContainer width="100%" height={360}>
        <BarChart data={data}>
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
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xKey} />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey={yKey} />
      </LineChart>
    </ResponsiveContainer>
  );
}