// app/datasets/[id]/page.tsx
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function DatasetPreviewPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect(`/api/auth/signin?callbackUrl=/datasets/${params.id}`);
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) {
    redirect("/datasets");
  }

  const dataset = await prisma.dataset.findFirst({
    where: { id: params.id, ownerId: user.id },
    select: {
      id: true,
      name: true,
      createdAt: true,
      rowCount: true,
      schemaJson: true,      // { columns: [{ name, type }, ...] }
      sampleRowsJson: true,  // [{ colName: value, ... }, ...]
    },
  });

  if (!dataset) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold mb-2">Dataset not found</h1>
        <p className="text-sm text-gray-600">
          It may have been removed or you don’t have access.
        </p >
      </main>
    );
  }

  const columns: { name: string; type: "string" | "number" | "date" }[] =
    (dataset.schemaJson as any)?.columns ?? [];
  const sampleRows: Record<string, string>[] =
    (dataset.sampleRowsJson as any) ?? [];

  return (
    <main className="p-6">
      {/* Header with "Create Chart" button */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{dataset.name}</h1>
          <p className="text-sm text-gray-600">
            Uploaded: {new Date(dataset.createdAt).toLocaleString()} ·{" "}
            {dataset.rowCount} rows
          </p >
        </div>

        {/* Use Link styled as a button (safe in Server Component) */}
        <Link
          href={`/charts/new?datasetId=${dataset.id}`}
          className="inline-block rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition"
        >
          + Create Chart
        </Link>
      </div>

      {/* Columns */}
      <h2 className="font-medium mb-2">Detected Columns</h2>
      <div className="overflow-x-auto mb-6">
        <table className="min-w-[400px] border border-gray-200 bg-white">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left p-2 border-b">Name</th>
              <th className="text-left p-2 border-b">Type</th>
            </tr>
          </thead>
          <tbody>
            {columns.length > 0 ? (
              columns.map((c, i) => (
                <tr key={i} className="border-b">
                  <td className="p-2">{c.name}</td>
                  <td className="p-2">{c.type}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="p-2" colSpan={2}>
                  No columns saved in schemaJson.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Sample rows */}
      <h2 className="font-medium mb-2">
        Sample Rows (first {Math.min(sampleRows.length || 10, dataset.rowCount)} rows)
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-[600px] border border-gray-200 bg-white">
          <thead>
            <tr className="bg-gray-50">
              {columns.map((c) => (
                <th key={c.name} className="text-left p-2 border-b">
                  {c.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sampleRows.length > 0 ? (
              sampleRows.map((row, idx) => (
                <tr key={idx} className="border-b">
                  {columns.map((c) => (
                    <td key={c.name} className="p-2">
                      {row[c.name] ?? ""}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="p-2 text-gray-600"
                  colSpan={Math.max(columns.length, 1)}
                >
                  No sample rows saved for this dataset.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}