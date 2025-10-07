// app/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import Link from "next/link";

const prisma = new PrismaClient();

export default async function DashboardListPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/api/auth/signin?callbackUrl=/dashboard");
  }

  const dashboards = await prisma.dashboard.findMany({
    where: { owner: { email: session.user.email } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      isPublic: true,
      createdAt: true,
    },
  });

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">Your Dashboards</h1>
        <Link
          href="/dashboard/new"
          className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + New Dashboard
        </Link>
      </div>

      {dashboards.length === 0 ? (
        <p className="text-sm text-gray-600">No dashboards yet. Try creating one!</p >
      ) : (
        <ul className="space-y-2">
          {dashboards.map((d) => (
            <li key={d.id}>
              <Link
                href={`/dashboard/${d.id}`}
                className="block border rounded p-3 hover:bg-gray-50"
              >
                <div className="font-medium text-blue-600 hover:underline">
                  {d.name}
                </div>
                <div className="text-sm text-gray-600">
                  {d.isPublic ? "🌍 Public" : "🔒 Private"} ·{" "}
                  {new Date(d.createdAt).toLocaleString()}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}