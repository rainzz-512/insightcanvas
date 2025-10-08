// app/charts/[id]/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import ChartViewer from "@/components/ChartViewer";

const prisma = new PrismaClient();

export default async function ChartDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect(`/api/auth/signin?callbackUrl=/charts/${params.id}`);
  }

  // Load the chart the signed-in user owns (via dataset ownership)
  const chart = await prisma.chart.findFirst({
    where: { id: params.id, dataset: { owner: { email: session.user.email! } } },
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
        <p className="text-sm text-gray-600">It may have been removed or you don’t have access.</p >
      </main>
    );
  }

  // Load user dashboards for the "Add to dashboard" select
  const dashboards = await prisma.dashboard.findMany({
    where: { owner: { email: session.user.email! } },
    select: { id: true, name: true },
    orderBy: { createdAt: "desc" },
  });

  const cfg = (chart.configJson as any) || {};
  const data = (chart.dataset.sampleRowsJson as any[]) ?? [];

  // Normalize props for ChartViewer
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

  /** ---------- Server actions ---------- */

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

  async function deleteChart() {
    "use server";
    // Remove from any dashboards first
    await prisma.dashboardItem.deleteMany({ where: { chartId: chart.id } });
    await prisma.chart.delete({ where: { id: chart.id } });
    redirect("/charts");
  }

  async function addToDashboard(formData: FormData) {
    "use server";
    const dashboardId = (formData.get("dashboardId") as string) || "";

    // Verify dashboard belongs to the same user
    const dash = await prisma.dashboard.findFirst({
      where: { id: dashboardId, owner: { email: session!.user!.email! } },
      select: { id: true },
    });
    if (!dash) return;

    // Determine next order (simple count-based)
    const count = await prisma.dashboardItem.count({ where: { dashboardId } });
    await prisma.dashboardItem.create({
      data: {
        dashboardId,
        chartId: chart.id,
        // Store a tiny bit of layout metadata for now
        layoutJson: { order: count },
      },
    });

    revalidatePath(`/dashboard/${dashboardId}`);
    redirect(`/dashboard/${dashboardId}`);
  }

  /** ---------- UI ---------- */
  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold mb-1">{chart.name}</h1>
          <p className="text-sm text-gray-600">
            Type: {chart.type} · Dataset: {chart.dataset.name} ·{" "}
            {new Date(chart.createdAt).toLocaleString()}
          </p >
        </div>

        <div className="flex items-center gap-2">
          {/* rename */}
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

          {/* delete */}
          <form action={deleteChart}>
            <button
              type="submit"
              className="text-sm px-3 py-1 border rounded hover:bg-red-50 text-red-600"
            >
              Delete
            </button>
          </form>

          <a
            href={`/charts/${chart.id}/edit`}
            className="text-sm px-3 py-1 border rounded hover:bg-gray-50"
          >
            Edit
          </a>
        </div>
      </header>

      {/* Add to dashboard */}
      <section className="border rounded bg-white p-4">
        <form action={addToDashboard} className="flex items-center gap-3">
          <label className="text-sm text-gray-700">Add to dashboard:</label>
          <select
            name="dashboardId"
            className="border rounded px-2 py-1 text-sm"
            defaultValue=""
            required
          >
            <option value="" disabled>
              Select a dashboard…
            </option>
            {dashboards.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <button className="text-sm px-3 py-1 border rounded hover:bg-gray-50" type="submit">
            Add
          </button>
          <a
            href="/dashboard/new"
            className="text-xs text-blue-600 underline underline-offset-2"
          >
            create new dashboard
          </a >
        </form>
      </section>

      {/* Chart itself */}
      <section className="border rounded bg-white p-4 shadow-sm">
        <ChartViewer {...viewerProps} />
      </section>
    </main>
  );
}