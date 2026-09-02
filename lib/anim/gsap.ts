"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  useLayoutEffect,
  type DependencyList,
  type RefObject,
} from "react";

let pluginsRegistered = false;

export function registerGsapPlugins() {
  if (pluginsRegistered || typeof window === "undefined") return;
  gsap.registerPlugin(ScrollTrigger);
  pluginsRegistered = true;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function revealHidden(scope: ParentNode) {
  scope.querySelectorAll<HTMLElement>(".js-anim-hidden").forEach((el) => {
    el.style.opacity = "1";
    el.style.transform = "none";
    el.style.visibility = "visible";
  });
}

/**
 * Runs a GSAP context against `scopeRef` and reverts it on unmount / dep change.
 * No-ops (and unhides `.js-anim-hidden`) when the user prefers reduced motion.
 * If GSAP throws, content is forced visible instead of staying mid-tween.
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
          ctx.revert();
        } catch {
          revealHidden(scope);
        }
      };
    } catch {
      revealHidden(scope);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller supplies deps
  }, deps);
}

export { gsap, ScrollTrigger };
