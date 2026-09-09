import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "genZtracking — build the habit, keep the streak",
    template: "%s · genZtracking",
  },
  description:
    "Create a habit, get a panel with a day-by-day grid, per-day notes, a live progress bar, and streaks protected by earned freezes.",
};

export const viewport: Viewport = {
  themeColor: "#0B1020",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${geistMono.variable}`}>
      <body className="min-h-dvh bg-canvas font-sans text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
