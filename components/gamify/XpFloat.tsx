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
      className="pointer-events-none gpu glass-strong fixed right-6 top-24 z-50 rounded-full px-3.5 py-1.5 text-sm font-semibold text-xp"
    >
      +{amount} XP
    </div>
  );
}
