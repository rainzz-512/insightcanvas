import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import ChartViewer from "@/components/ChartViewer";

const prisma = new PrismaClient();

export default async function PublicDashboardPage({
  params,
}: { params: { id: string } }) {
  const dash = await prisma.dashboard.findFirst({
    where: { id: params.id, isPublic: true },
    select: {
      id: true,
      name: true,
      createdAt: true,
      items: {
        orderBy: { id: "asc" },
        select: {
          id: true,
          layoutJson: true,
          chart: {
            select: {
              id: true,
              name: true,
              type: true,
              configJson: true,
              dataset: {
                select: { name: true, sampleRowsJson: true },
              },
            },
          },
        },
      },
    },
  });

  if (!dash) {
    notFound();
  }

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{dash.name}</h1>
          <p className="text-sm text-gray-600">
            Public dashboard · {new Date(dash.createdAt).toLocaleString()}
          </p >
        </div>
      </header>

      {/* Simple responsive grid */}
      <section className="grid gap-6 md:grid-cols-2">
        {dash.items.map((it) => {
          const chart = it.chart!;
          const cfg = (chart.configJson as any) || {};
          const data = (chart.dataset?.sampleRowsJson as any[]) ?? [];

          const viewerProps =
            chart.type === "pie"
              ? {
                  type: "pie" as const,
                  data,
                  labelKey: cfg.labelKey,
                  valueKey: cfg.valueKey,
                }
              : {
                  type: chart.type as "bar" | "line",
                  data,
                  xKey: cfg.xKey,
                  yKey: cfg.yKey,
                };

        return (
          <div key={it.id} className="border rounded bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-medium">{chart.name}</h2>
              <span className="text-xs text-gray-500">{chart.type}</span>
            </div>
            <ChartViewer {...viewerProps} />
          </div>
        );
        })}
      </section>
    </main>
  );
}