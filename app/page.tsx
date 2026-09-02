import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { Hero } from "@/components/landing/Hero";
import { LandingStars } from "@/components/landing/LandingStars";
import { RippleCta } from "@/components/ui/ripple-cta";
import { getUser } from "@/lib/auth";
import { DEFAULT_SIGNED_IN_ROUTE, ROUTES } from "@/lib/habits/constants";

const FEATURES = [
  {
    title: "A panel per habit",
    body: "Every habit generates its own day-by-day grid across the exact range you committed to, with a note on any day you want to remember.",
  },
  {
    title: "Streaks you can defend",
    body: "Earn one freeze token per seven clean days, bank up to three, and spend one on a day you genuinely missed. Retroactive, but only for two days.",
  },
  {
    title: "XP that means something",
    body: "Ten XP a day, a bonus every seventh, levels that take real work, and badges at 7, 21, 66 and 100 days.",
  },
  {
    title: "One place to check in",
    body: "The Today view collapses every active habit into a single list. Tap, note, done.",
  },
];

export default async function LandingPage() {
  const user = await getUser();

  return (
    <div className="relative min-h-dvh">
      <LandingStars />

      <div className="pointer-events-none relative z-10 [&_a]:pointer-events-auto [&_button]:pointer-events-auto">
        <header className="sticky top-0 z-30 px-4 pt-3 sm:px-6">
          <div className="glass-strong pointer-events-auto mx-auto flex h-14 w-full max-w-6xl items-center justify-between rounded-full px-4">
            <span className="text-sm font-semibold tracking-tight">
              genZ<span className="text-brand">tracking</span>
            </span>
            {user ? (
              <RippleCta href={DEFAULT_SIGNED_IN_ROUTE} size="sm">
                Open app
              </RippleCta>
            ) : (
              <RippleCta href={ROUTES.login} tone="secondary" size="sm">
                Sign in
              </RippleCta>
            )}
          </div>
        </header>

        <Hero signedIn={Boolean(user)} />

        <FeatureGrid features={FEATURES} />
      </div>
    </div>
  );
}
