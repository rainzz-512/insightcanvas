// app/datasets/[id]/page.tsx
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

  // Fetch directly via Prisma on the server (faster/cleaner than calling our own API)
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
      schemaJson: true, // { columns: [{ name, type }, ...] }
    },
  });

  if (!dataset) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold mb-2">Dataset not found</h1>
        <p className="text-sm text-gray-600">It may have been removed or you don’t have access.</p>
      </main>
    );
  }

  const columns: { name: string; type: "string" | "number" | "date" }[] =
    (dataset.schemaJson as any)?.columns ?? [];

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold">{dataset.name}</h1>
      <p className="text-sm text-gray-600 mb-4">
        Uploaded: {new Date(dataset.createdAt).toLocaleString()} · {dataset.rowCount} rows
      </p>

      <h2 className="font-medium mb-2">Detected Columns</h2>
      <div className="overflow-x-auto">
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
    </main>
  );
}
