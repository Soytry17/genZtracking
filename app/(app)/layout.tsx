import Link from "next/link";

import { PageEnter } from "@/components/app/PageEnter";
import { ShellPresence } from "@/components/app/ShellPresence";
import { FreezeTokens } from "@/components/gamify/FreezeTokens";
import { GamifyProvider } from "@/components/gamify/GamifyProvider";
import { XpBar } from "@/components/gamify/XpBar";
import { MobileTabBar } from "@/components/nav/MobileTabBar";
import { NavLinks } from "@/components/nav/NavLinks";
import { RippleCta } from "@/components/ui/ripple-cta";
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
      <div className="bg-magenta-orb-grid flex min-h-dvh flex-col">
        <ShellPresence>
          <header data-shell className="sticky top-0 z-40 px-3 pt-3">
            <div className="glass-strong mx-auto flex h-14 w-full max-w-6xl items-center gap-4 rounded-full px-4 sm:px-5">
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

                <RippleCta
                  href={ROUTES.newHabit}
                  size="sm"
                  className="hidden sm:inline-flex"
                >
                  New habit
                </RippleCta>

                <div className="flex items-center gap-2">
                  <span className="hidden text-sm text-ink-muted lg:inline">
                    {name}
                  </span>
                  <form action="/auth/signout" method="post">
                    <button
                      type="submit"
                      className="rounded-full px-2.5 py-2 text-sm text-ink-subtle transition-colors hover:bg-glass hover:text-ink"
                    >
                      Sign out
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </header>
        </ShellPresence>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 sm:px-6 md:pb-12">
          <PageEnter>{children}</PageEnter>
        </main>

        <MobileTabBar />
      </div>
    </GamifyProvider>
  );
}
