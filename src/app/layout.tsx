import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SecureEval | AI Code Security & Vulnerability Benchmark",
  description: "The definitive domain-specific evaluation benchmark for LLM AppSec, vulnerability detection, and secure patch generation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#090d16] text-slate-100 antialiased selection:bg-emerald-500/30 selection:text-emerald-300">
        {children}
      </body>
    </html>
  );
}
