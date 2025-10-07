"use client";

import { useState } from "react";

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // no-op
    }
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      className="text-sm px-3 py-1 border rounded hover:bg-gray-50"
      aria-label="Copy link"
    >
      {copied ? "Copied!" : "Copy link"}
    </button>
  );
}