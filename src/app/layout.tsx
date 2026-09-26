import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SecureEval | AI Code Security & Vulnerability Benchmark",
  description: "The open evaluation benchmark for LLM AppSec, vulnerability detection, and secure patch generation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased selection:bg-slate-200 selection:text-slate-900">
        {children}
      </body>
    </html>
  );
}
