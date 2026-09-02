"use client";

import { useRef } from "react";
import Link from "next/link";

import { buttonClassName } from "@/components/ui";
import { useGsap } from "@/lib/anim/gsap";
import { DEFAULT_SIGNED_IN_ROUTE, ROUTES } from "@/lib/habits/constants";

export function Hero({ signedIn }: { signedIn: boolean }) {
  const rootRef = useRef<HTMLElement>(null);

  useGsap(rootRef, (gsap) => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    // fromTo (not from): destination is always fully visible. FROM is near-visible
    // so a timeline that never plays still leaves readable copy. Fresh objects per
    // tween — GSAP mutates vars.
    tl.fromTo(
      '[data-hero="eyebrow"]',
      { y: 10, opacity: 0.55 },
      { y: 0, opacity: 1, duration: 0.45 },
    )
      .fromTo(
        '[data-hero="headline"]',
        { y: 16, opacity: 0.55 },
        { y: 0, opacity: 1, duration: 0.7 },
        "-=0.2",
      )
      .fromTo(
        '[data-hero="subcopy"]',
        { y: 10, opacity: 0.55 },
        { y: 0, opacity: 1, duration: 0.5 },
        "-=0.35",
      )
      .fromTo(
        '[data-hero="cta"]',
        { y: 10, opacity: 0.55 },
        { y: 0, opacity: 1, duration: 0.45 },
        "-=0.25",
      );
  }, []);

  return (
    <section
      ref={rootRef}
      data-hero
      className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-4xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6"
    >
      <p
        data-hero="eyebrow"
        className="js-anim-hidden text-xs font-medium uppercase tracking-[0.2em] text-ink-subtle"
      >
        Habit tracking · discipline
      </p>
      <h1
        data-hero="headline"
        className="js-anim-hidden text-gradient-brand mt-5 text-4xl font-semibold leading-[1.05] sm:text-6xl"
      >
        Pick the habit.
        <br />
        Keep the streak.
      </h1>
      <p
        data-hero="subcopy"
        className="js-anim-hidden mx-auto mt-6 max-w-xl text-base text-ink-muted sm:text-lg"
      >
        Track a habit day by day until it becomes discipline. One panel, a box
        for every day you committed to, and a streak that only breaks if you
        let it.
      </p>
      <div
        data-hero="cta"
        className="js-anim-hidden mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
      >
        {signedIn ? (
          <Link
            href={DEFAULT_SIGNED_IN_ROUTE}
            className={buttonClassName({ size: "lg" })}
          >
            Go to today
          </Link>
        ) : (
          <>
            <Link
              href={ROUTES.signup}
              className={buttonClassName({ size: "lg" })}
            >
              Create account
            </Link>
            <Link
              href={ROUTES.login}
              className={buttonClassName({ variant: "secondary", size: "lg" })}
            >
              Sign in
            </Link>
          </>
        )}
      </div>
    </section>
  );
}
