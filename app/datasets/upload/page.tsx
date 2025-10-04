"use client";

import { useState } from "react";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("");

  // When user picks a file
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    setFile(selectedFile || null);
    setStatus(selectedFile ? `Selected: ${selectedFile.name}` : "");
  }

  // When user clicks upload
  async function handleUpload() {
    if (!file) {
      setStatus("Please select a file first.");
      return;
    }

    setStatus("Uploading...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setStatus(`✅ Upload successful! Found ${data.columns?.length ?? 0} columns.`);
      } else {
        setStatus(`❌ Upload failed: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error(err);
      setStatus("❌ Upload failed (network error)");
    }
  }

  return (
    <main className="p-6 max-w-lg mx-auto">
      <h1 className="text-xl font-semibold mb-4">Upload a CSV Dataset</h1>

      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="block w-full border rounded p-2 mb-4"
      />

      <button
        onClick={handleUpload}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Upload CSV
      </button>

      {status && <p className="mt-4 text-sm text-gray-700">{status}</p>}
    </main>
  );
}
