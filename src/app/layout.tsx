import type { Metadata } from "next";
import { Sidebar } from "@/components/Sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Blunder Therapist",
  description:
    "Chess that analyzes how you make decisions, not just which moves you play.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex h-screen bg-ink-900 text-white overflow-hidden antialiased">
        <Sidebar />
        <main className="flex-1 overflow-y-auto w-full">
          {children}
        </main>
      </body>
    </html>
  );
}
