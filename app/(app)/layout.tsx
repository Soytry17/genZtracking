import Link from "next/link";

import { FreezeTokens } from "@/components/gamify/FreezeTokens";
import { GamifyProvider } from "@/components/gamify/GamifyProvider";
import { XpBar } from "@/components/gamify/XpBar";
import { MobileTabBar } from "@/components/nav/MobileTabBar";
import { NavLinks } from "@/components/nav/NavLinks";
import { buttonClassName } from "@/components/ui";
import { displayNameFor, requireSession } from "@/lib/auth";
import { ROUTES } from "@/lib/habits/constants";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await requireSession();
  const name = displayNameFor(user, profile);

  return (
    <GamifyProvider>
      <div className="flex min-h-dvh flex-col">
        <header className="sticky top-0 z-40 border-b border-line bg-canvas/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
            <Link
              href={ROUTES.today}
              className="text-sm font-semibold tracking-tight text-ink"
            >
              genZ<span className="text-brand">tracking</span>
            </Link>

            <NavLinks />

            <div className="ml-auto flex items-center gap-3">
              <div data-slot="xp-bar" className="hidden min-w-40 sm:block">
                <XpBar xp={profile?.xp ?? 0} level={profile?.level ?? 1} />
              </div>

              <div data-slot="freeze-tokens">
                <FreezeTokens count={profile?.freeze_tokens ?? 0} />
              </div>

              <Link
                href={ROUTES.newHabit}
                className={buttonClassName({
                  size: "sm",
                  className: "hidden sm:inline-flex",
                })}
              >
                New habit
              </Link>

              <div className="flex items-center gap-2">
                <span className="hidden text-sm text-ink-muted lg:inline">
                  {name}
                </span>
                <form action="/auth/signout" method="post">
                  <button
                    type="submit"
                    className="rounded-lg px-2.5 py-2 text-sm text-ink-subtle transition-colors hover:bg-surface-2 hover:text-ink"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-6 sm:px-6 md:pb-12">
          {children}
        </main>

        <MobileTabBar />
      </div>
    </GamifyProvider>
  );
}
