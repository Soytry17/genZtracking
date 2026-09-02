"use client";

import { useEffect, useRef } from "react";

import { Button } from "@/components/ui";
import { HabitIcon } from "@/components/habit/HabitIcon";
import { animateLevelUpBurst } from "@/lib/anim/anime";
import type { Badge } from "@/types/database";

export function LevelUpOverlay({
  overlay,
  onClose,
}: {
  overlay: { kind: "level"; level: number } | { kind: "badge"; badge: Badge } | null;
  onClose: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!overlay) return;
    animateLevelUpBurst(rootRef.current);
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [overlay, onClose]);

  if (!overlay) return null;

  const title =
    overlay.kind === "level" ? `Level ${overlay.level}` : overlay.badge.name;
  const body =
    overlay.kind === "level"
      ? "The grind is compounding. Keep the streak alive."
      : overlay.badge.description;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        aria-label="Dismiss"
        onClick={onClose}
      />
      <div
        ref={rootRef}
        className="relative w-full max-w-sm overflow-hidden rounded-panel border border-line bg-surface p-8 text-center shadow-glow"
      >
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            data-burst
            className="pointer-events-none absolute left-1/2 top-1/2 size-2 rounded-full bg-xp"
            style={{ opacity: 0 }}
          />
        ))}
        <div data-level-panel className="relative space-y-3">
          {overlay.kind === "badge" ? (
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-soft text-brand">
              <HabitIcon name={overlay.badge.icon} className="size-7" />
            </div>
          ) : (
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-xp">
              Level up
            </p>
          )}
          <h2 className="text-3xl font-semibold text-ink">{title}</h2>
          <p className="text-sm text-ink-muted">{body}</p>
          <Button className="mt-4" onClick={onClose}>
            Keep going
          </Button>
        </div>
      </div>
    </div>
  );
}
