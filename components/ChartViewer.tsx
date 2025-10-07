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
  "#2563EB", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
  "#06B6D4", "#F97316", "#84CC16", "#EC4899", "#14B8A6",
];

export default function ChartViewer(props: Props) {
  // Wrapper adds padding and hides overflowing SVG bits
  return (
    <div className="rounded border bg-white p-4 overflow-hidden">
      {props.type === "bar" && (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart
            data={props.data}
            margin={{ top: 8, right: 12, bottom: 8, left: 12 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={props.xKey} />
            <YAxis />
            <Tooltip />
            <Bar dataKey={props.yKey} />
          </BarChart>
        </ResponsiveContainer>
      )}

      {props.type === "line" && (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart
            data={props.data}
            margin={{ top: 8, right: 12, bottom: 8, left: 12 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={props.xKey} />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey={props.yKey} />
          </LineChart>
        </ResponsiveContainer>
      )}

      {props.type === "pie" && (
        <ResponsiveContainer width="100%" height={320}>
          <PieChart margin={{ top: 8, right: 12, bottom: 8, left: 12 }}>
            <Tooltip />
            <Legend />
            <Pie
              data={(props.data || []).map((r) => ({
                name: String(r[(props as PieProps).labelKey] ?? ""),
                value: Number(r[(props as PieProps).valueKey] ?? 0),
              }))}
              dataKey="value"
              nameKey="name"
              outerRadius={120}
            >
              {(props.data || []).map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}