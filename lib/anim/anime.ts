"use client";

import { animate, type AnimationParams } from "animejs";

import { prefersReducedMotion } from "@/lib/anim/gsap";

type Target = Parameters<typeof animate>[0];

function run(target: Target, params: AnimationParams) {
  if (typeof window === "undefined" || prefersReducedMotion()) return null;
  return animate(target, params);
}

/** Checkbox tick: draw an SVG path from nothing to complete. */
export function animateTick(path: SVGGeometryElement | null) {
  if (!path) return null;
  const length = path.getTotalLength();
  path.style.strokeDasharray = `${length}`;
  path.style.strokeDashoffset = `${length}`;
  return run(path, {
    strokeDashoffset: 0,
    duration: 420,
    ease: "outQuad",
  });
}

/** Progress fill: width from previous percent to next. */
export function animateProgress(
  el: HTMLElement | null,
  toPercent: number,
  fromPercent = 0,
) {
  if (!el) return null;
  if (prefersReducedMotion()) {
    el.style.width = `${toPercent}%`;
    return null;
  }
  el.style.width = `${fromPercent}%`;
  return run(el, {
    width: `${toPercent}%`,
    duration: 700,
    ease: "inOutQuad",
  });
}

/** XP number floating up and fading out. */
export function animateXpFloat(el: HTMLElement | null) {
  if (!el) return null;
  return run(el, {
    translateY: { from: 8, to: -36 },
    opacity: [1, 0],
    duration: 900,
    ease: "outQuad",
  });
}

/** Full-screen level-up burst on descendant particles. */
export function animateLevelUpBurst(root: HTMLElement | null) {
  if (!root) return null;
  const particles = root.querySelectorAll<HTMLElement>("[data-burst]");
  const panel = root.querySelector<HTMLElement>("[data-level-panel]");

  if (panel) {
    run(panel, {
      scale: [0.86, 1],
      opacity: [0, 1],
      duration: 520,
      ease: "outBack",
    });
  }

  if (particles.length === 0) return null;
  return run(particles, {
    translateX: () => (Math.random() - 0.5) * 220,
    translateY: () => -40 - Math.random() * 180,
    scale: () => 0.4 + Math.random() * 0.8,
    opacity: [1, 0],
    delay: (_el: unknown, i = 0) => i * 18,
    duration: 900,
    ease: "outQuad",
  });
}

/** Snowflake pop when a freeze is spent or earned. */
export function animateFreeze(el: HTMLElement | null) {
  if (!el) return null;
  return run(el, {
    scale: [0.4, 1.15, 1],
    rotate: [0, 20],
    opacity: [0, 1],
    duration: 560,
    ease: "outBack",
  });
}

export { animate };
