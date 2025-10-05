import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import Link from "next/link";

const prisma = new PrismaClient();

export default async function DatasetsPage() {
  // 1️⃣ Verify user is signed in
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/api/auth/signin?callbackUrl=/datasets");
  }

  // 2️⃣ Find user in DB
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    redirect("/datasets");
  }

  // 3️⃣ Fetch user’s datasets
  const datasets = await prisma.dataset.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, rowCount: true, createdAt: true },
  });

  // 4️⃣ Render page
  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold mb-2">Datasets</h1>
      <p className="text-sm text-gray-600 mb-4">
        Welcome, {session.user?.name ?? "User"}
      </p>

      {/* Upload new dataset button */}
      <Link
        href="/datasets/upload"
        className="inline-block bg-blue-600 text-white px-3 py-2 rounded mb-4 hover:bg-blue-700"
      >
        + Upload new CSV
      </Link>

      {/* Datasets list */}
      <ul className="space-y-2">
        {datasets.map((d) => (
          <li key={d.id}>
            <Link
              href={`/datasets/${d.id}`}
              className="block border rounded p-3 bg-white hover:bg-gray-50 transition"
            >
              <div className="font-medium text-blue-600 hover:underline">
                {d.name}
              </div>
              <div className="text-sm text-gray-600">
                {d.rowCount} rows · {new Date(d.createdAt).toLocaleString()}
              </div>
            </Link>
          </li>
        ))}

        {/* Empty state */}
        {datasets.length === 0 && (
          <li className="text-sm text-gray-600">
            No datasets yet. Try uploading one.
          </li>
        )}
      </ul>
    </main>
  );
}
