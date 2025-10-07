// app/dashboard/[id]/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";          // keep for auth redirect
import { revalidatePath } from "next/cache";         // ✅ correct import
import { PrismaClient } from "@prisma/client";
import ChartViewer from "@/components/ChartViewer";
import CopyButton from "@/components/CopyButton";

const prisma = new PrismaClient();

export default async function DashboardViewPage({
  params,
}: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect(`/api/auth/signin?callbackUrl=/dashboard/${params.id}`);
  }

  const dash = await prisma.dashboard.findFirst({
    where: { id: params.id, owner: { email: session.user!.email! } },
    select: {
      id: true,
      name: true,
      isPublic: true,
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
              dataset: { select: { id: true, name: true, sampleRowsJson: true } },
            },
          },
        },
      },
    },
  });

  if (!dash) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold">Dashboard not found</h1>
        <p className="text-sm text-gray-600">It may have been removed or you don’t have access.</p >
      </main>
    );
  }

  // -------- server actions --------
  async function togglePublic(formData: FormData) {
    "use server";
    const makePublic = formData.get("makePublic") === "true";
    await prisma.dashboard.update({
      where: { id: dash.id },
      data: { isPublic: makePublic },
    });
    revalidatePath(`/dashboard/${dash.id}`); // ✅ now works
  }

  async function rename(formData: FormData) {
    "use server";
    const name = (formData.get("name") as string)?.trim();
    if (!name) return;
    await prisma.dashboard.update({ where: { id: dash.id }, data: { name } });
    revalidatePath(`/dashboard/${dash.id}`); // ✅
  }

  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/p/${dash.id}`;

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-1">{dash.name}</h1>
          <p className="text-sm text-gray-600">
            {dash.isPublic ? "Public" : "Private"} · {new Date(dash.createdAt).toLocaleString()}
          </p >
        </div>

        <div className="flex flex-wrap gap-2">
          <form action={rename} className="flex items-center gap-2">
            <input
              name="name"
              defaultValue={dash.name}
              className="border rounded px-2 py-1 text-sm"
              aria-label="Dashboard name"
            />
            <button type="submit" className="text-sm px-3 py-1 border rounded hover:bg-gray-50">
              Rename
            </button>
          </form>

          <form action={togglePublic} className="flex items-center gap-2">
            <input type="hidden" name="makePublic" value={dash.isPublic ? "false" : "true"} />
            <button type="submit" className="text-sm px-3 py-1 border rounded hover:bg-gray-50">
              {dash.isPublic ? "Make Private" : "Make Public"}
            </button>
          </form>

          {dash.isPublic && <CopyButton text={publicUrl} />}

          <a className="text-sm px-3 py-1 border rounded hover:bg-gray-50" href={`/dashboard/${dash.id}/edit`}>
            Edit layout
          </a >
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        {dash.items.map((it) => {
          const chart = it.chart!;
          const cfg = (chart.configJson as any) || {};
          const data = (chart.dataset?.sampleRowsJson as any[]) ?? [];

          const viewerProps =
            chart.type === "pie"
              ? { type: "pie" as const, data, labelKey: cfg.labelKey, valueKey: cfg.valueKey }
              : { type: chart.type as "bar" | "line", data, xKey: cfg.xKey, yKey: cfg.yKey };

          return (
            <div key={it.id} className="border rounded bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <a className="font-medium text-blue-600 hover:underline" href={`/charts/${chart.id}`}>
                  {chart.name}
                </a >
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