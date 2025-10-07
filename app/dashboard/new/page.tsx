// app/dashboard/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewDashboardPage() {
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) return alert("Please enter a name.");

    try {
      setCreating(true);
      const res = await fetch("/api/dashboards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.error || "Failed to create dashboard.");
        return;
      }

      // ✅ API returns { dashboard: { id, ... } }
      const id = data?.dashboard?.id;
      if (!id) {
        alert("Created, but response missing id.");
        return;
      }
      router.push(`/dashboard/${id}`);
    } catch (e) {
      console.error(e);
      alert("Network error creating dashboard.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <main className="p-6 max-w-md mx-auto">
      <h1 className="text-xl font-semibold mb-4">Create New Dashboard</h1>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border rounded w-full p-2 mb-4"
        placeholder="Dashboard name"
      />
      <button
        onClick={handleCreate}
        disabled={creating}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
      >
        {creating ? "Creating..." : "Create"}
      </button>
    </main>
  );
}