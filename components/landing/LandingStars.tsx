"use client";

import { useEffect, useState } from "react";

import { prefersReducedMotion } from "@/lib/anim";

import styles from "./LandingStars.module.css";

const DESKTOP_COUNT = 50;
const MOBILE_COUNT = 24;
const MOBILE_QUERY = "(max-width: 750px)";
const TOP_MIN_VH = 0;
const TOP_MAX_VH = 140;

type StarVars = {
  topOffset: string;
  fallDuration: string;
  fallDelay: string;
  starTailLength: string;
};

interface StarStyle extends React.CSSProperties {
  "--top-offset": string;
  "--fall-duration": string;
  "--fall-delay": string;
  "--star-tail-length": string;
}

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = next[i];
    const b = next[j];
    if (a === undefined || b === undefined) continue;
    next[i] = b;
    next[j] = a;
  }
  return next;
}

function slotValue(
  slot: number,
  count: number,
  min: number,
  max: number,
): number {
  if (count <= 1) return (min + max) / 2;
  const span = max - min;
  const step = span / count;
  const jitter = (Math.random() - 0.5) * step;
  return Math.min(max, Math.max(min, min + (slot + 0.5) * step + jitter));
}

function makeStars(count: number): StarVars[] {
  const topSlots = shuffle(Array.from({ length: count }, (_, i) => i));
  const delaySlots = shuffle(Array.from({ length: count }, (_, i) => i));

  return Array.from({ length: count }, (_, i) => {
    const duration = 5 + Math.random() * 10;
    const top = slotValue(topSlots[i] ?? i, count, TOP_MIN_VH, TOP_MAX_VH);
    // Negative delay: already mid-flight so nothing piles up at translate3d(104em, 0)
    // (the top-right spawn edge after rotate(-45deg)).
    const delay = -slotValue(delaySlots[i] ?? i, count, 0, duration);
    const tail = 4.5 + Math.random() * 4;

    return {
      topOffset: `${top.toFixed(2)}vh`,
      fallDuration: `${duration.toFixed(2)}s`,
      fallDelay: `${delay.toFixed(2)}s`,
      starTailLength: `${tail.toFixed(2)}em`,
    };
  });
}

/**
 * Backseasy shooting-star field, landing-only.
 * Stars are seeded after mount so SSR/client random values never mismatch.
 */
export function LandingStars() {
  const [stars, setStars] = useState<StarVars[]>([]);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const mobile = window.matchMedia(MOBILE_QUERY);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    const seed = () => {
      if (reduced.matches || prefersReducedMotion()) {
        setStars([]);
        return;
      }
      setStars(makeStars(mobile.matches ? MOBILE_COUNT : DESKTOP_COUNT));
    };

    const onVisibility = () => setPaused(document.hidden);

    seed();
    onVisibility();
    mobile.addEventListener("change", seed);
    reduced.addEventListener("change", seed);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      mobile.removeEventListener("change", seed);
      reduced.removeEventListener("change", seed);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div
      className={styles.container}
      data-paused={paused ? "true" : undefined}
      aria-hidden
    >
      {stars.length > 0 ? (
        <div className={styles.stars}>
          {stars.map((star, index) => (
            <div
              key={index}
              className={styles.star}
              style={
                {
                  "--top-offset": star.topOffset,
                  "--fall-duration": star.fallDuration,
                  "--fall-delay": star.fallDelay,
                  "--star-tail-length": star.starTailLength,
                } as StarStyle
              }
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
