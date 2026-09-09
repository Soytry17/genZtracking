/** Tiny helper — keep this off the GSAP/anime barrels so landing/UI can import it alone. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
