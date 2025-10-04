import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "InsightCanvas",
  description: "Upload CSV → Build Charts → Share Dashboards",
};

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
