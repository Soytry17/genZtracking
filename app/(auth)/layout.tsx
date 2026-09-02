import Link from "next/link";

import { AuthMount } from "@/components/auth/AuthMount";
import { ROUTES } from "@/lib/habits/constants";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-magenta-orb-grid flex min-h-dvh flex-col items-center justify-start px-app pt-[max(2.5rem,var(--safe-top))] pb-[max(2.5rem,var(--safe-bottom))] md:justify-center">
      <Link
        href={ROUTES.home}
        className="mb-8 text-sm font-semibold tracking-tight text-ink-muted transition-colors hover:text-ink"
      >
        genZ<span className="text-brand">tracking</span>
      </Link>
      <div className="w-full max-w-md">
        <AuthMount>{children}</AuthMount>
      </div>
    </div>
  );
}
