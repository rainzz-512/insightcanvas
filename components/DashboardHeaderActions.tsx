"use client";

import { useState } from "react";
import Button from "@/components/Button";

export default function DashboardHeaderActions({
  id,
  initialName,
  initialIsPublic,
}: {
  id: string;
  initialName: string;
  initialIsPublic: boolean;
}) {
  const [name, setName] = useState(initialName);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [saving, setSaving] = useState(false);
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/dashboard/${id}` : "";

  const save = async (patch: { name?: string; isPublic?: boolean }) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/dashboards/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to update");
      if (typeof patch.name === "string") setName(json.dashboard.name);
      if (typeof patch.isPublic === "boolean") setIsPublic(json.dashboard.isPublic);
    } catch (e: any) {
      alert(e?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {/* Inline rename */}
      <input
        className="border rounded px-2 py-1 text-sm"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => name.trim() && save({ name: name.trim() })}
        placeholder="Dashboard name"
      />

      {/* Public toggle */}
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(e) => save({ isPublic: e.target.checked })}
        />
        Public
      </label>

      {isPublic && (
        <span className="text-xs text-gray-600">
          Share: <a className="text-blue-600 underline" href={shareUrl}>{shareUrl}</a>
        </span>
      )}

      <Button variant="ghost" disabled className="opacity-60">
        {saving ? "Saving…" : "Saved"}
      </Button>
    </div>
  );
}