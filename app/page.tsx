import { redirect } from "next/navigation";

import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { Hero } from "@/components/landing/Hero";
import { LandingStarsMount } from "@/components/landing/LandingStarsMount";
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
  if (user) redirect(DEFAULT_SIGNED_IN_ROUTE);

  return (
    <div className="relative min-h-dvh">
      <LandingStarsMount />

      <div className="relative z-10">
        <header className="sticky top-0 z-30 px-app pt-header">
          <div className="glass-strong mx-auto flex h-14 w-full max-w-6xl items-center justify-between rounded-2xl px-3 sm:rounded-full sm:px-4">
            <span className="text-sm font-semibold tracking-tight">
              genZ<span className="text-brand">tracking</span>
            </span>
            <RippleCta href={ROUTES.login} tone="secondary" size="sm">
              Sign in
            </RippleCta>
          </div>
        </header>

        <Hero signedIn={false} />

        <FeatureGrid features={FEATURES} />
      </div>
    </div>
  );
}
