import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect, revalidatePath } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import ChartViewer from "@/components/ChartViewer";

const prisma = new PrismaClient();

export default async function ChartDetailPage({
  params,
}: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect(`/api/auth/signin?callbackUrl=/charts/${params.id}`);
  }

  const chart = await prisma.chart.findFirst({
    where: {
      id: params.id,
      dataset: { owner: { email: session!.user!.email! } },
    },
    select: {
      id: true,
      name: true,
      type: true,
      configJson: true,
      createdAt: true,
      dataset: {
        select: {
          id: true,
          name: true,
          sampleRowsJson: true,
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

  // ✅ Server Action: rename chart
  async function renameChart(formData: FormData) {
    "use server";
    const name = (formData.get("name") as string)?.trim();
    if (!name) return;
    await prisma.chart.update({
      where: { id: chart.id },
      data: { name },
    });
    revalidatePath(`/charts/${chart.id}`);
  }

  // ✅ Server Action: delete chart
  async function deleteChart() {
    "use server";
    await prisma.dashboardItem.deleteMany({ where: { chartId: chart.id } });
    await prisma.chart.delete({ where: { id: chart.id } });
    redirect("/charts");
  }

  const cfg = (chart.configJson as any) || {};
  const data = (chart.dataset.sampleRowsJson as any[]) ?? [];

  const viewerProps =
    chart.type === "pie"
      ? { type: "pie" as const, data, labelKey: cfg.labelKey, valueKey: cfg.valueKey }
      : { type: chart.type as "bar" | "line", data, xKey: cfg.xKey, yKey: cfg.yKey };

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold mb-1">{chart.name}</h1>
          <p className="text-sm text-gray-600">
            Type: {chart.type} · Dataset: {chart.dataset.name} ·{" "}
            {new Date(chart.createdAt).toLocaleString()}
          </p >
        </div>

        <div className="flex gap-2">
          <form action={renameChart} className="flex items-center gap-2">
            <input
              name="name"
              defaultValue={chart.name}
              className="border rounded px-2 py-1 text-sm"
              aria-label="Chart name"
            />
            <button className="text-sm px-3 py-1 border rounded hover:bg-gray-50" type="submit">
              Rename
            </button>
          </form>

          <form action={deleteChart}>
            <button
              type="submit"
              className="text-sm px-3 py-1 border rounded hover:bg-red-50 text-red-600"
            >
              Delete
            </button>
          </form>

          <a
            className="text-sm px-3 py-1 border rounded hover:bg-gray-50"
            href={`/charts/${chart.id}/edit`}
          >
            Edit
          </a>
        </div>
      </div>

      <div className="border rounded bg-white p-4 shadow-sm">
        <ChartViewer {...viewerProps} />
      </div>
    </main>
  );
}