// app/charts/page.tsx
// Server Component
export const dynamic = "force-dynamic";

import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function ChartsPage() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      // If not signed in, go to NextAuth sign-in (not a blank page)
      redirect("/api/auth/signin?callbackUrl=/charts");
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!user) {
      return (
        <main className="p-6">
          <h1 className="text-xl font-semibold mb-2">Charts</h1>
          <p className="text-red-600">User not found.</p >
        </main>
      );
    }

    // Fetch charts the user owns (via dataset ownership)
    const charts = await prisma.chart.findMany({
      where: { dataset: { ownerId: user.id } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        type: true,
        createdAt: true,
        dataset: { select: { id: true, name: true } },
      },
    });

    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold mb-4">Charts</h1>

        <ul className="space-y-2">
          {charts.map((c) => (
            <li key={c.id}>
              <Link
                href={`/charts/${c.id}`}
                className="block border rounded p-3 bg-white hover:bg-gray-50 transition cursor-pointer"
              >
                <div className="font-medium text-blue-600 hover:underline">{c.name}</div>
                <div className="text-sm text-gray-600">
                  {c.type} · dataset: {c.dataset.name} ·{" "}
                  {new Date(c.createdAt).toLocaleString()}
                </div>
              </Link>
            </li>
          ))}

          {charts.length === 0 && (
            <li className="text-sm text-gray-600">No charts yet.</li>
          )}
        </ul>
      </main>
    );
  } catch (err) {
    // Surface any server-side error to the UI instead of a blank page
    console.error("ChartsPage error:", err);
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold mb-2">Charts</h1>
        <p className="text-red-600">
          Something went wrong loading your charts. Check the terminal for details.
        </p >
      </main>
    );
  }
}