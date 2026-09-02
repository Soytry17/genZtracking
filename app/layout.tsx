import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
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
  themeColor: "#08080c",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-dvh bg-canvas text-ink antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
