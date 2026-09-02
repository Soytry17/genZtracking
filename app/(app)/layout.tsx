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
          <header data-shell className="sticky top-0 z-40 px-app pt-header">
            <div className="glass-strong mx-auto flex h-14 w-full min-w-0 max-w-6xl items-center gap-2 rounded-2xl px-3 sm:gap-4 sm:rounded-full sm:px-5">
              <Link
                href={ROUTES.today}
                className="shrink-0 text-sm font-semibold tracking-tight text-ink"
              >
                genZ<span className="text-brand">tracking</span>
              </Link>

              <NavLinks />

              <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
                <div
                  data-slot="xp-bar"
                  className="hidden min-w-0 max-w-28 sm:block md:max-w-32 lg:max-w-52"
                >
                  <XpBar xp={profile?.xp ?? 0} level={profile?.level ?? 1} />
                </div>

                <div data-slot="freeze-tokens" className="shrink-0">
                  <FreezeTokens count={profile?.freeze_tokens ?? 0} />
                </div>

                <RippleCta
                  href={ROUTES.newHabit}
                  size="sm"
                  className="hidden shrink-0 lg:inline-flex"
                >
                  New habit
                </RippleCta>

                <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                  <span className="hidden max-w-32 truncate text-sm text-ink-muted lg:inline">
                    {name}
                  </span>
                  <form action="/auth/signout" method="post">
                    <button
                      type="submit"
                      className="min-h-11 rounded-full px-2.5 py-2 text-sm text-ink-subtle transition-colors hover:bg-glass hover:text-ink sm:min-h-0"
                    >
                      Sign out
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </header>
        </ShellPresence>

        <main className="mx-auto w-full max-w-6xl flex-1 px-app pb-tabbar pt-5 md:pt-6">
          <PageEnter>{children}</PageEnter>
        </main>

        <MobileTabBar />
      </div>
    </GamifyProvider>
  );
}
