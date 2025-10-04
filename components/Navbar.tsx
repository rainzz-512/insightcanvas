"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import Button from "@/components/Button";

export default function Navbar() {
  const { data: session, status } = useSession();

  return (
    <nav className="border-b bg-white">
      <div className="mx-auto max-w-5xl px-4 py-3 flex justify-between items-center">
        <div className="flex gap-6">
          <Link href="/" className="font-semibold">InsightCanvas</Link>
          <Link href="/datasets" className="text-slate-600 hover:text-slate-900">Datasets</Link>
          <Link href="/charts" className="text-slate-600 hover:text-slate-900">Charts</Link>
          <Link href="/dashboard" className="text-slate-600 hover:text-slate-900">Dashboard</Link>
        </div>

        {status === "loading" ? (
          <span className="text-sm text-gray-500">Loading…</span>
        ) : session ? (
          <div className="flex items-center gap-3">
            <span className="text-sm">Hi, {session.user?.name ?? "User"}</span>
            <Button variant="ghost" onClick={() => signOut()}>Sign out</Button>
          </div>
        ) : (
          <Button onClick={() => signIn("github")}>Sign in with GitHub</Button>
        )}
      </div>
    </nav>
  );
}
