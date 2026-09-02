"use client";

import { animate, type AnimationParams, type JSAnimation } from "animejs";

import { prefersReducedMotion } from "@/lib/anim/gsap";

type Target = Parameters<typeof animate>[0];

function asElements(target: Target | null): HTMLElement[] {
  if (!target) return [];
  if (target instanceof HTMLElement) return [target];
  if (target instanceof SVGElement) return [];
  if (typeof target === "string") {
    return [...document.querySelectorAll<HTMLElement>(target)];
  }
  if (typeof NodeList !== "undefined" && target instanceof NodeList) {
    return [...target].filter((n): n is HTMLElement => n instanceof HTMLElement);
  }
  if (Array.isArray(target)) {
    return target.filter((n): n is HTMLElement => n instanceof HTMLElement);
  }
  return [];
}

export function killAnime(anim: JSAnimation | null | undefined) {
  anim?.pause();
}

function withWillChange(target: Target, params: AnimationParams): AnimationParams {
  const els = asElements(target);
  const prevStart = params.onBegin;
  const prevComplete = params.onComplete;
  return {
    ...params,
    onBegin(anim) {
      for (const el of els) el.style.willChange = "transform, opacity";
      prevStart?.(anim);
    },
    onComplete(anim) {
      for (const el of els) el.style.willChange = "auto";
      prevComplete?.(anim);
    },
  };
}

function run(target: Target, params: AnimationParams) {
  if (typeof window === "undefined" || prefersReducedMotion()) return null;
  return animate(target, withWillChange(target, params));
}

/** Checkbox tick: draw an SVG path from nothing to complete. */
export function animateTick(path: SVGGeometryElement | null) {
  if (!path) return null;
  const length = path.getTotalLength();
  path.style.strokeDasharray = `${length}`;
  path.style.strokeDashoffset = `${length}`;
  if (prefersReducedMotion()) {
    path.style.strokeDashoffset = "0";
    return null;
  }
  path.style.willChange = "stroke-dashoffset";
  return animate(path, {
    strokeDashoffset: 0,
    duration: 420,
    ease: "outQuad",
    onComplete() {
      path.style.willChange = "auto";
    },
  });
}

/**
 * Progress fill via scaleX (compositor-only). Element should be width 100%
 * with transform-origin left. Never tweens width/height.
 */
export function animateProgress(
  el: HTMLElement | null,
  toPercent: number,
  fromPercent = 0,
) {
  if (!el) return null;
  const to = Math.max(0, Math.min(100, toPercent)) / 100;
  const from = Math.max(0, Math.min(100, fromPercent)) / 100;
  el.style.transformOrigin = "left center";
  if (prefersReducedMotion()) {
    el.style.transform = `scaleX(${to})`;
    return null;
  }
  el.style.transform = `scaleX(${from})`;
  return run(el, {
    scaleX: to,
    duration: 700,
    ease: "inOutQuad",
  });
}

/** Count a numeric label (e.g. progress %) from → to. */
export function animateCount(
  el: HTMLElement | null,
  to: number,
  from = 0,
  suffix = "%",
) {
  if (!el) return null;
  if (prefersReducedMotion()) {
    el.textContent = `${Math.round(to)}${suffix}`;
    return null;
  }
  const state = { n: from };
  el.textContent = `${Math.round(from)}${suffix}`;
  return animate(state, {
    n: to,
    duration: 700,
    ease: "inOutQuad",
    onUpdate() {
      el.textContent = `${Math.round(state.n)}${suffix}`;
    },
  });
}

/** XP number floating up and fading out. */
export function animateXpFloat(el: HTMLElement | null) {
  if (!el) return null;
  if (prefersReducedMotion()) {
    el.style.opacity = "0";
    return null;
  }
  return run(el, {
    translateY: { from: 4, to: -40 },
    scale: { from: 0.94, to: 1 },
    opacity: [0.92, 0],
    duration: 920,
    ease: "outQuad",
  });
}

/** Level-up panel + a few compositor particles. No filter / glow tweens. */
export function animateLevelUpBurst(root: HTMLElement | null) {
  if (!root) return null;
  if (prefersReducedMotion()) {
    const panel = root.querySelector<HTMLElement>("[data-level-panel]");
    if (panel) {
      panel.style.opacity = "1";
      panel.style.transform = "none";
    }
    return null;
  }

  const particles = root.querySelectorAll<HTMLElement>("[data-burst]");
  const panel = root.querySelector<HTMLElement>("[data-level-panel]");

  if (panel) {
    run(panel, {
      scale: [0.94, 1],
      opacity: [0.82, 1],
      duration: 420,
      ease: "outBack",
    });
  }

  if (particles.length === 0) return null;
  return run(particles, {
    translateX: () => (Math.random() - 0.5) * 160,
    translateY: () => -24 - Math.random() * 120,
    scale: () => 0.4 + Math.random() * 0.5,
    opacity: [0.9, 0],
    delay: (_el: unknown, i = 0) => i * 20,
    duration: 720,
    ease: "outQuad",
  });
}

/** Snowflake pop when a freeze is earned. */
export function animateFreeze(el: HTMLElement | null) {
  if (!el) return null;
  if (prefersReducedMotion()) {
    el.style.opacity = "1";
    el.style.transform = "none";
    return null;
  }
  return run(el, {
    scale: [0.55, 1.18, 1],
    rotate: [0, 18, 0],
    opacity: [0.7, 1],
    duration: 520,
    ease: "outBack",
  });
}

/** Pulse when a freeze is spent. */
export function animateFreezeSpend(el: HTMLElement | null) {
  if (!el) return null;
  if (prefersReducedMotion()) return null;
  return run(el, {
    scale: [1, 1.28, 1],
    rotate: [0, -16, 0],
    opacity: [1, 0.55, 1],
    duration: 460,
    ease: "outQuad",
  });
}

/** Small scale press on a single control (day cell, checkbox). */
export function animatePress(el: HTMLElement | null, toScale = 0.92) {
  if (!el) return null;
  if (prefersReducedMotion()) return null;
  return run(el, {
    scale: [1, toScale, 1],
    duration: 220,
    ease: "outQuad",
  });
}

export { animate };
