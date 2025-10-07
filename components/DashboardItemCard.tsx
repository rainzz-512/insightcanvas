// components/DashboardItemCard.tsx
"use client";

import ChartViewer from "@/components/ChartViewer";

type Props = {
  title: string;
  type: "bar" | "line" | "pie";
  configJson: any;                   // expects {xKey,yKey} or {labelKey,valueKey}
  data: Record<string, any>[];       // dataset.sampleRowsJson
};

export default function DashboardItemCard({ title, type, configJson, data }: Props) {
  // Normalize props for ChartViewer
  const viewerProps =
    type === "pie"
      ? {
          type: "pie" as const,
          data,
          labelKey: configJson?.labelKey,
          valueKey: configJson?.valueKey,
        }
      : {
          type: type as "bar" | "line",
          data,
          xKey: configJson?.xKey,
          yKey: configJson?.yKey,
        };

  const hasData = Array.isArray(data) && data.length > 0;

  return (
    <div className="border rounded bg-white p-3 shadow-sm hover:bg-gray-50 transition">
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium">{title}</div>
        <span className="text-xs text-gray-500">{type}</span>
      </div>

      <div className="h-48">
        {hasData ? (
          <ChartViewer {...viewerProps} />
        ) : (
          <div className="h-full grid place-items-center text-xs text-gray-500">
            No sample rows saved for this dataset.
          </div>
        )}
      </div>
    </div>
  );
}