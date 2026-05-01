import type { Metadata } from "next";
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
      <body className="min-h-screen bg-ink-900 text-white">{children}</body>
    </html>
  );
}
