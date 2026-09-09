"use client";

import dynamic from "next/dynamic";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { GamifyDelta } from "@/lib/habits/actions";
import type { Badge, GoalBadge } from "@/types/database";

const LevelUpOverlay = dynamic(
  () =>
    import("@/components/gamify/LevelUpOverlay").then((mod) => ({
      default: mod.LevelUpOverlay,
    })),
  { ssr: false },
);

const XpFloat = dynamic(
  () =>
    import("@/components/gamify/XpFloat").then((mod) => ({
      default: mod.XpFloat,
    })),
  { ssr: false },
);

type Overlay =
  | { kind: "level"; level: number }
  | { kind: "badge"; badge: Badge }
  | { kind: "goal_badge"; badge: GoalBadge }
  | null;

type GamifyContextValue = {
  xp: number;
  level: number;
  freezeTokens: number;
  report: (delta: GamifyDelta) => void;
};

const GamifyContext = createContext<GamifyContextValue | null>(null);

const FALLBACK: GamifyContextValue = {
  xp: 0,
  level: 1,
  freezeTokens: 0,
  report: () => {
    /* provider missing during isolated render */
  },
};

export function useGamify() {
  return useContext(GamifyContext) ?? FALLBACK;
}

export function GamifyProvider({
  children,
  xp,
  level,
  freezeTokens,
}: {
  children: React.ReactNode;
  xp: number;
  level: number;
  freezeTokens: number;
}) {
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [xpAmount, setXpAmount] = useState<number | null>(null);
  const [liveXp, setLiveXp] = useState(xp);
  const [liveLevel, setLiveLevel] = useState(level);
  const [liveFreeze, setLiveFreeze] = useState(freezeTokens);

  useEffect(() => {
    setLiveXp(xp);
  }, [xp]);

  useEffect(() => {
    setLiveLevel(level);
  }, [level]);

  useEffect(() => {
    setLiveFreeze(freezeTokens);
  }, [freezeTokens]);

  const report = useCallback((delta: GamifyDelta) => {
    setLiveXp(delta.newXp);
    setLiveLevel(delta.newLevel);
    setLiveFreeze(delta.freezeTokens);
    if (delta.xpDelta > 0) setXpAmount(delta.xpDelta);
    if (delta.leveledUp) {
      setOverlay({ kind: "level", level: delta.newLevel });
    } else if (delta.newGoalBadges[0]) {
      setOverlay({ kind: "goal_badge", badge: delta.newGoalBadges[0] });
    } else if (delta.newBadges[0]) {
      setOverlay({ kind: "badge", badge: delta.newBadges[0] });
    }
  }, []);

  const value = useMemo(
    () => ({
      xp: liveXp,
      level: liveLevel,
      freezeTokens: liveFreeze,
      report,
    }),
    [liveXp, liveLevel, liveFreeze, report],
  );

  return (
    <GamifyContext.Provider value={value}>
      {children}
      {xpAmount != null ? (
        <XpFloat amount={xpAmount} onDone={() => setXpAmount(null)} />
      ) : null}
      {overlay ? (
        <LevelUpOverlay overlay={overlay} onClose={() => setOverlay(null)} />
      ) : null}
    </GamifyContext.Provider>
  );
}
