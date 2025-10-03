import "./globals.css";
import Link from "next/link";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-slate-900">
        <nav className="border-b bg-white">
          <div className="mx-auto max-w-5xl px-4 py-3 flex gap-6">
            <Link href="/" className="font-semibold">InsightCanvas</Link>
            <Link href="/datasets" className="text-slate-600 hover:text-slate-900">Datasets</Link>
            <Link href="/charts" className="text-slate-600 hover:text-slate-900">Charts</Link>
            <Link href="/dashboard" className="text-slate-600 hover:text-slate-900">Dashboard</Link>
          </div>
        </nav>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
