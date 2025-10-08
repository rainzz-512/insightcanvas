// app/datasets/[id]/page.tsx
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export default async function DatasetPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect(`/api/auth/signin?callbackUrl=/datasets/${params.id}`);
  }

  const dataset = await prisma.dataset.findFirst({
    where: { id: params.id, owner: { email: session.user!.email! } },
    select: {
      id: true,
      name: true,
      rowCount: true,
      createdAt: true,
      schemaJson: true,
      sampleRowsJson: true,
      charts: {
        select: { id: true, name: true, type: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!dataset) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold">Dataset not found</h1>
      </main>
    );
  }

  const columns: { name: string; type: string }[] =
    (dataset.schemaJson as any)?.columns ?? [];
  const rows: Record<string, any>[] =
    (dataset.sampleRowsJson as any[]) ?? [];

  // ✅ Server Action: rename dataset
  async function renameDataset(formData: FormData) {
    "use server";
    const name = (formData.get("name") as string)?.trim();
    if (!name) return;
    await prisma.dataset.update({
      where: { id: dataset.id },
      data: { name },
    });
    revalidatePath(`/datasets/${dataset.id}`);
  }

  // ✅ Server Action: delete dataset (cascade charts/items)
  async function deleteDataset() {
    "use server";
    const charts = await prisma.chart.findMany({
      where: { datasetId: dataset.id },
      select: { id: true },
    });
    const chartIds = charts.map((c) => c.id);
    if (chartIds.length) {
      await prisma.dashboardItem.deleteMany({
        where: { chartId: { in: chartIds } },
      });
      await prisma.chart.deleteMany({
        where: { id: { in: chartIds } },
      });
    }
    await prisma.dataset.delete({ where: { id: dataset.id } });
    redirect("/datasets");
  }

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold mb-1">{dataset.name}</h1>
          <p className="text-sm text-gray-600">
            {dataset.rowCount} rows ·{" "}
            {new Date(dataset.createdAt).toLocaleString()}
          </p >
        </div>

        <div className="flex gap-2">
          <form action={renameDataset} className="flex items-center gap-2">
            <input
              name="name"
              defaultValue={dataset.name}
              className="border rounded px-2 py-1 text-sm"
              aria-label="Dataset name"
            />
            <button
              className="text-sm px-3 py-1 border rounded hover:bg-gray-50"
              type="submit"
            >
              Rename
            </button>
          </form>

          <form action={deleteDataset}>
            <button
              type="submit"
              className="text-sm px-3 py-1 border rounded hover:bg-red-50 text-red-600"
            >
              Delete
            </button>
          </form>

          {/* ✅ Correct link to chart creator */}
          <Link
            href={`/charts/new?datasetId=${dataset.id}`}
            prefetch
            className="text-sm px-3 py-1 border rounded hover:bg-gray-50"
          >
            Create chart
          </Link>
        </div>
      </header>

      {/* Schema */}
      <section>
        <h2 className="font-medium mb-2">Detected Columns</h2>
        <div className="border rounded overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2 border-b">Name</th>
                <th className="text-left p-2 border-b">Type</th>
              </tr>
            </thead>
            <tbody>
              {columns.map((c) => (
                <tr key={c.name}>
                  <td className="p-2 border-b">{c.name}</td>
                  <td className="p-2 border-b">{c.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Sample rows */}
      <section>
        <h2 className="font-medium mb-2">
          Sample Rows (first {rows.length || 0} rows)
        </h2>
        <div className="border rounded overflow-auto bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((c) => (
                  <th key={c.name} className="text-left p-2 border-b">
                    {c.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td className="p-2 text-gray-500" colSpan={columns.length}>
                    No sample rows saved for this dataset.
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => (
                  <tr key={i}>
                    {columns.map((c) => (
                      <td key={c.name} className="p-2 border-b">
                        {String(r[c.name] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Charts created from this dataset */}
      <section>
        <h2 className="font-medium mb-2">Charts</h2>
        {dataset.charts.length === 0 ? (
          <p className="text-sm text-gray-600">No charts yet.</p >
        ) : (
          <ul className="space-y-2">
            {dataset.charts.map((c) => (
              <li key={c.id} className="border rounded p-3 bg-white">
                <Link
                  href={`/charts/${c.id}`}
                  className="font-medium text-blue-600 hover:underline"
                >
                  {c.name}
                </Link>{" "}
                <span className="text-xs text-gray-500">({c.type})</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}