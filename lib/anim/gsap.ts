"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  useLayoutEffect,
  type DependencyList,
  type RefObject,
} from "react";

let pluginsRegistered = false;

/** Start opacity for enter tweens. Never 0 — content stays readable if GSAP never plays. */
export const NEAR_VISIBLE = 0.78;

export function registerGsapPlugins() {
  if (pluginsRegistered || typeof window === "undefined") return;
  gsap.registerPlugin(ScrollTrigger);
  pluginsRegistered = true;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function toElements(targets: unknown): HTMLElement[] {
  if (!targets) return [];
  if (targets instanceof HTMLElement) return [targets];
  if (targets instanceof NodeList || Array.isArray(targets)) {
    return [...targets].filter((n): n is HTMLElement => n instanceof HTMLElement);
  }
  if (typeof targets === "object" && targets && "length" in targets) {
    return Array.from(targets as ArrayLike<unknown>).filter(
      (n): n is HTMLElement => n instanceof HTMLElement,
    );
  }
  return [];
}

export function applyWillChange(
  targets: unknown,
  props = "transform, opacity",
) {
  for (const el of toElements(targets)) {
    el.style.willChange = props;
  }
}

export function clearWillChange(targets: unknown) {
  for (const el of toElements(targets)) {
    el.style.willChange = "auto";
  }
}

function revealHidden(scope: ParentNode) {
  scope.querySelectorAll<HTMLElement>(".js-anim-hidden").forEach((el) => {
    el.style.opacity = "1";
    el.style.transform = "none";
    el.style.visibility = "visible";
  });
}

function killScrollTriggersIn(scope: HTMLElement) {
  ScrollTrigger.getAll().forEach((st) => {
    const trigger = st.trigger;
    if (trigger instanceof Node && scope.contains(trigger)) {
      st.kill();
    }
  });
}

export type EnterVars = {
  y?: number;
  x?: number;
  scale?: number;
  duration?: number;
  delay?: number;
  stagger?: number | { each?: number; from?: "start" | "end" | "center" | "edges" };
  ease?: string;
  opacityFrom?: number;
};

function willChangeHooks(): Pick<gsap.TweenVars, "onStart" | "onComplete" | "onInterrupt"> {
  return {
    onStart(this: gsap.core.Tween) {
      applyWillChange(this.targets());
    },
    onComplete(this: gsap.core.Tween) {
      clearWillChange(this.targets());
    },
    onInterrupt(this: gsap.core.Tween) {
      clearWillChange(this.targets());
    },
  };
}

/**
 * Visible-first enter: fromTo near-visible → 1. Destination is always fully visible.
 * Fresh vars per call — GSAP mutates tween objects.
 */
export function enterFromNear(
  targets: gsap.TweenTarget,
  vars: EnterVars = {},
) {
  const opacityFrom = vars.opacityFrom ?? NEAR_VISIBLE;
  return gsap.fromTo(
    targets,
    {
      y: vars.y ?? 12,
      x: vars.x ?? 0,
      scale: vars.scale ?? 1,
      opacity: opacityFrom,
    },
    {
      y: 0,
      x: 0,
      scale: 1,
      opacity: 1,
      duration: vars.duration ?? 0.42,
      delay: vars.delay ?? 0,
      stagger: vars.stagger,
      ease: vars.ease ?? "power3.out",
      force3D: true,
      ...willChangeHooks(),
    },
  );
}

/**
 * Stagger nodes in batches so a 365-day grid is a handful of tweens, not 365.
 */
export function staggerInChunks(
  targets: ArrayLike<HTMLElement> | HTMLElement[],
  vars: EnterVars & { chunkSize?: number; chunkDelay?: number; maxItems?: number } = {},
) {
  const maxItems = vars.maxItems ?? 42;
  const list = Array.from(targets).slice(0, maxItems);
  if (list.length === 0) return;
  const chunkSize = vars.chunkSize ?? 21;
  const chunkDelay = vars.chunkDelay ?? 0.05;
  for (let i = 0; i < list.length; i += chunkSize) {
    const chunk = list.slice(i, i + chunkSize);
    enterFromNear(chunk, {
      y: vars.y ?? 8,
      opacityFrom: vars.opacityFrom ?? 0.72,
      duration: vars.duration ?? 0.32,
      delay: (vars.delay ?? 0) + (i / chunkSize) * chunkDelay,
      ease: vars.ease,
    });
  }
}

/** Slow transform-only drift. No-ops under reduced motion. Prefer CSS aurora. */
export function driftAurora(targets: gsap.TweenTarget, duration = 10) {
  if (prefersReducedMotion()) return null;
  return gsap.to(targets, {
    x: "+=28",
    y: "+=18",
    duration,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
    force3D: true,
  });
}

/**
 * Runs a GSAP context against `scopeRef` and reverts it on unmount / dep change.
 * No-ops (and unhides `.js-anim-hidden`) when the user prefers reduced motion.
 * If GSAP throws, content is forced visible instead of staying mid-tween.
 * ScrollTriggers created in the context are killed on revert.
 */
export function useGsap(
  scopeRef: RefObject<HTMLElement | null>,
  setup: (api: typeof gsap) => void,
  deps: DependencyList = [],
) {
  useLayoutEffect(() => {
    const scope = scopeRef.current;
    if (!scope) return;

    if (prefersReducedMotion()) {
      revealHidden(scope);
      return;
    }

    try {
      registerGsapPlugins();
      const ctx = gsap.context(() => setup(gsap), scope);
      return () => {
        try {
          killScrollTriggersIn(scope);
          ctx.revert();
        } catch {
          revealHidden(scope);
        }
        clearWillChange(scope.querySelectorAll("[style*='will-change']"));
      };
    } catch {
      revealHidden(scope);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller supplies deps
  }, deps);
}

export { gsap, ScrollTrigger };
