"use client";

import Button from "@/components/Button";



export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-semibold">InsightCanvas</h1>
        <p className="text-slate-600">CSV → Charts → Dashboards.</p>
        <Button onClick={() => alert("You clicked me! Start building your insights.")}>Try me</Button>
      </div>
    </main>
  );
}
