import Link from "next/link";

import { Hero } from "@/components/landing/Hero";
import { Card, CardBody, buttonClassName } from "@/components/ui";
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
    <div className="bg-aurora min-h-dvh">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <span className="text-sm font-semibold tracking-tight">
          genZ<span className="text-brand">tracking</span>
        </span>
        <Link
          href={user ? DEFAULT_SIGNED_IN_ROUTE : ROUTES.login}
          className={buttonClassName({ variant: "secondary", size: "sm" })}
        >
          {user ? "Open app" : "Sign in"}
        </Link>
      </header>

      <Hero signedIn={Boolean(user)} />

      <section className="mx-auto grid w-full max-w-5xl gap-4 px-4 pb-24 sm:grid-cols-2 sm:px-6">
        {FEATURES.map((feature) => (
          <Card key={feature.title} data-hero="feature">
            <CardBody className="space-y-2">
              <h2 className="text-sm font-semibold text-ink">{feature.title}</h2>
              <p className="text-sm leading-relaxed text-ink-muted">
                {feature.body}
              </p>
            </CardBody>
          </Card>
        ))}
      </section>
    </div>
  );
}
