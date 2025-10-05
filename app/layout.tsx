"use client";

import "./globals.css";
import Link from "next/link";
import Providers from "@/components/Providers";
import { signIn, signOut, useSession } from "next-auth/react";
import Button from "@/components/Button";

// Inline Navbar component
function Navbar() {
  const { data: session, status } = useSession();

  return (
    <nav className="border-b bg-white">
      <div className="mx-auto max-w-5xl px-4 py-3 flex justify-between items-center">
        {/* Left side: Navigation Links */}
        <div className="flex gap-6">
          <Link href="/" prefetch className="font-semibold">
            InsightCanvas
          </Link>
          <Link
            href="/datasets"
            prefetch
            className="text-slate-600 hover:text-slate-900"
          >
            Datasets
          </Link>
          <Link
            href="/charts"
            prefetch
            className="text-slate-600 hover:text-slate-900"
          >
            Charts
          </Link>
          <Link
            href="/dashboard"
            prefetch
            className="text-slate-600 hover:text-slate-900"
          >
            Dashboard
          </Link>
        </div>

        {/* Right side: Auth Buttons */}
        {status === "loading" ? (
          <span className="text-sm text-gray-500">Loading...</span>
        ) : session ? (
          <div className="flex items-center gap-3">
            <span className="text-sm">Hi, {session.user?.name ?? "User"}</span>
            <Button variant="ghost" onClick={() => signOut()}>
              Sign out
            </Button>
          </div>
        ) : (
          <Button onClick={() => signIn("github")}>Sign in with GitHub</Button>
        )}
      </div>
    </nav>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-slate-900">
        <Providers>
          <Navbar />
          <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
