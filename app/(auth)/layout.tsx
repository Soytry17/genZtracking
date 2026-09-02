import Link from "next/link";

import { ROUTES } from "@/lib/habits/constants";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-aurora flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <Link
        href={ROUTES.home}
        className="mb-8 text-sm font-semibold tracking-tight text-ink-muted transition-colors hover:text-ink"
      >
        genZ<span className="text-brand">tracking</span>
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
