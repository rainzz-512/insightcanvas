// app/charts/[id]/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import ChartViewer from "@/components/ChartViewer";
import Link from "next/link";

const prisma = new PrismaClient();

export default async function ChartDetailPage({
  params,
}: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect(`/api/auth/signin?callbackUrl=/charts/${params.id}`);
  }

  // Fetch the chart the signed-in user owns (via dataset ownership)
  const chart = await prisma.chart.findFirst({
    where: {
      id: params.id,
      dataset: { owner: { email: session!.user!.email! } },
    },
    select: {
      id: true,
      name: true,
      type: true,           // "bar" | "line" | "pie"
      configJson: true,     // { xKey, yKey } or { labelKey, valueKey }
      createdAt: true,
      dataset: {
        select: {
          id: true,
          name: true,
          sampleRowsJson: true, // preview rows saved on dataset
        },
      },
    },
  });

  if (!chart) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold">Chart not found</h1>
        <p className="text-sm text-gray-600">
          It may have been removed or you don’t have access.
        </p >
      </main>
    );
  }

  const cfg = (chart.configJson as any) || {};
  const data = (chart.dataset.sampleRowsJson as any[]) ?? [];

  // Normalize props for ChartViewer
  const viewerProps =
    chart.type === "pie"
      ? ({
          type: "pie" as const,
          data,
          labelKey: cfg.labelKey,
          valueKey: cfg.valueKey,
        } as const)
      : ({
          type: chart.type as "bar" | "line",
          data,
          xKey: cfg.xKey,
          yKey: cfg.yKey,
        } as const);

  return (
    <main className="max-w-3xl mx-auto p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold mb-1">{chart.name}</h1>
          <p className="text-sm text-gray-600 mb-4">
            Type: {chart.type} · Dataset: {chart.dataset.name} ·{" "}
            {new Date(chart.createdAt).toLocaleString()}
          </p >
        </div>

        {/* ✅ Correct Edit link */}
        <Link
          href={`/charts/${chart.id}/edit`}
          className="text-sm px-3 py-2 border rounded hover:bg-gray-50"
        >
          Edit
        </Link>
      </div>

      {/* ✅ Actual chart render */}
      <div className="border rounded bg-white p-4 shadow-sm">
        <ChartViewer {...viewerProps} />
      </div>
    </main>
  );
}