"use client";

import dynamic from "next/dynamic";

/** Client-only mount so the shooting-star field stays off the RSC graph. */
export const LandingStarsMount = dynamic(
  () =>
    import("@/components/landing/LandingStars").then((mod) => ({
      default: mod.LandingStars,
    })),
  { ssr: false },
);
