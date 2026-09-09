"use client";

import { useRef } from "react";

import { RippleCta } from "@/components/ui/ripple-cta";
import { useGsap } from "@/lib/anim/gsap";
import { DEFAULT_SIGNED_IN_ROUTE, ROUTES } from "@/lib/habits/constants";

export function Hero({ signedIn }: { signedIn: boolean }) {
  const rootRef = useRef<HTMLElement>(null);

  useGsap(rootRef, (gsap) => {
    const tl = gsap.timeline({
      defaults: { ease: "power3.out", force3D: true },
    });
    // fromTo (not from): destination is always fully visible. FROM is near-visible
    // so a timeline that never plays still leaves readable copy. Fresh objects per
    // tween — GSAP mutates vars. Transform + opacity only.
    tl.fromTo(
      '[data-hero="eyebrow"]',
      { y: 10, opacity: 0.72 },
      { y: 0, opacity: 1, duration: 0.4 },
    )
      .fromTo(
        '[data-hero="line"]',
        { y: 16, opacity: 0.7 },
        { y: 0, opacity: 1, duration: 0.62, stagger: 0.08 },
        "-=0.18",
      )
      .fromTo(
        '[data-hero="subcopy"]',
        { y: 10, opacity: 0.74 },
        { y: 0, opacity: 1, duration: 0.46 },
        "-=0.32",
      )
      .fromTo(
        '[data-hero="cta-item"]',
        { y: 10, opacity: 0.75 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.08 },
        "-=0.22",
      );
  }, []);

  return (
    <section
      ref={rootRef}
      data-hero
      className="relative mx-auto flex min-h-[calc(100dvh-var(--landing-header))] w-full max-w-4xl flex-col items-center justify-center px-app py-10 text-center sm:py-16"
    >
      <p
        data-hero="eyebrow"
        className="js-anim-hidden relative text-[11px] font-medium uppercase tracking-[0.18em] text-ink-subtle sm:text-xs sm:tracking-[0.2em]"
      >
        Habit tracking · discipline
      </p>
      <h1 className="text-gradient-brand relative mt-5 max-w-full px-1 text-[clamp(1.875rem,8vw,3.75rem)] font-semibold leading-[1.08]">
        <span data-hero="line" className="js-anim-hidden block">
          Pick the habit.
        </span>
        <span data-hero="line" className="js-anim-hidden block">
          Keep the streak.
        </span>
      </h1>
      <p
        data-hero="subcopy"
        className="js-anim-hidden relative mx-auto mt-6 max-w-xl text-pretty text-base text-ink-muted sm:text-lg"
      >
        Track a habit day by day until it becomes discipline. One panel, a box
        for every day you committed to, and a streak that only breaks if you
        let it.
      </p>
      <div
        data-hero="cta"
        className="relative mt-9 flex w-full max-w-sm flex-col items-stretch gap-3 rounded-3xl glass p-3 sm:w-auto sm:max-w-none sm:flex-row sm:items-center sm:justify-center sm:rounded-full sm:px-3.5 sm:py-3"
      >
        {signedIn ? (
          <RippleCta
            href={DEFAULT_SIGNED_IN_ROUTE}
            size="lg"
            data-hero="cta-item"
            className="w-full sm:w-auto"
          >
            Go to today
          </RippleCta>
        ) : (
          <>
            <RippleCta
              href={ROUTES.signup}
              size="lg"
              data-hero="cta-item"
              className="w-full sm:w-auto"
            >
              Create account
            </RippleCta>
            <RippleCta
              href={ROUTES.login}
              tone="secondary"
              size="lg"
              data-hero="cta-item"
              className="w-full sm:w-auto"
            >
              Sign in
            </RippleCta>
          </>
        )}
      </div>
    </section>
  );
}
