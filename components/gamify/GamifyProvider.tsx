"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { LevelUpOverlay } from "@/components/gamify/LevelUpOverlay";
import { XpFloat } from "@/components/gamify/XpFloat";
import type { GamifyDelta } from "@/lib/habits/actions";
import type { Badge } from "@/types/database";

type Overlay =
  | { kind: "level"; level: number }
  | { kind: "badge"; badge: Badge }
  | null;

type GamifyContextValue = {
  report: (delta: GamifyDelta) => void;
};

const GamifyContext = createContext<GamifyContextValue | null>(null);

export function useGamify() {
  const ctx = useContext(GamifyContext);
  if (!ctx) {
    return {
        report: () => {
          /* provider missing during isolated render */
        },
    };
  }
  return ctx;
}

export function GamifyProvider({ children }: { children: React.ReactNode }) {
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [xpAmount, setXpAmount] = useState<number | null>(null);

  const report = useCallback((delta: GamifyDelta) => {
    if (delta.xpDelta > 0) setXpAmount(delta.xpDelta);
    if (delta.leveledUp) {
      setOverlay({ kind: "level", level: delta.newLevel });
    } else if (delta.newBadges[0]) {
      setOverlay({ kind: "badge", badge: delta.newBadges[0] });
    }
  }, []);

  const value = useMemo(() => ({ report }), [report]);

  return (
    <GamifyContext.Provider value={value}>
      {children}
      {xpAmount != null ? (
        <XpFloat amount={xpAmount} onDone={() => setXpAmount(null)} />
      ) : null}
      <LevelUpOverlay overlay={overlay} onClose={() => setOverlay(null)} />
    </GamifyContext.Provider>
  );
}
