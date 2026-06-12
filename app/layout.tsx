import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Agent Army — WeLoveFounders",
  description: "Ship features while you sleep. A live demo of autonomous AI agents wired to Linear, GitHub, and Vercel.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
