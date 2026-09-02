"use client";

import { useEffect, useRef } from "react";

import { animateXpFloat } from "@/lib/anim/anime";

export function XpFloat({
  amount,
  onDone,
}: {
  amount: number;
  onDone: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const anim = animateXpFloat(ref.current);
    const timeout = window.setTimeout(onDone, 1000);
    return () => {
      window.clearTimeout(timeout);
      anim?.pause();
    };
  }, [amount, onDone]);

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed right-6 top-20 z-50 rounded-full bg-xp-soft px-3 py-1 text-sm font-semibold text-xp"
    >
      +{amount} XP
    </div>
  );
}
