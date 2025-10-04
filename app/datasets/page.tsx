import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function DatasetsPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/api/auth/signin?callbackUrl=/datasets");
  }

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold">Datasets</h1>
      <p className="text-sm text-gray-600">Welcome, {session.user?.name}</p>
      {/* TODO: list user’s datasets here */}
    </main>
  );
}
