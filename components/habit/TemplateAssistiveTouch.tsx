"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";

import { HabitIcon } from "@/components/habit/HabitIcon";
import { prefersReducedMotion } from "@/lib/anim/reduced-motion";
import { cn } from "@/lib/utils";
import type { HabitPreset } from "@/types/database";

const BALL = 60;
const DRAG_THRESHOLD = 8;
const MENU = 300;
const INNER_RADIUS = MENU * 0.23;
const OUTER_RADIUS = MENU * 0.385;
const SINGLE_RADIUS = MENU * 0.34;
const MD = 768;

type Corner = "tl" | "tr" | "bl" | "br";

type Point = { x: number; y: number };

function splitRings(count: number): [number, number] {
  if (count <= 8) return [count, 0];
  const inner = Math.min(6, Math.ceil(count / 3));
  return [inner, count - inner];
}

function ringPoint(index: number, count: number, radiusPx: number, startDeg = -90) {
  const angle = ((startDeg + (360 / count) * index) * Math.PI) / 180;
  return {
    x: Math.cos(angle) * radiusPx,
    y: Math.sin(angle) * radiusPx,
  };
}

function mobileView() {
  return window.matchMedia(`(max-width: ${MD - 1}px)`).matches;
}

function readSafeBottom(): number {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--safe-bottom")
    .trim();
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : 0;
}

function readSidebarPx(): number {
  if (mobileView()) return 0;
  const rem = parseFloat(
    getComputedStyle(document.documentElement)
      .getPropertyValue("--app-sidebar")
      .trim(),
  );
  const root = parseFloat(getComputedStyle(document.documentElement).fontSize);
  const remPx = Number.isFinite(rem) ? rem : 15.5;
  const rootPx = Number.isFinite(root) ? root : 16;
  return remPx * rootPx;
}

function safeBox() {
  const mobile = mobileView();
  const gutter = mobile ? 16 : 24;
  return {
    top: mobile ? 72 : 88,
    right: gutter,
    bottom: mobile ? 108 + readSafeBottom() : 24,
    left: readSidebarPx() + gutter,
  };
}

function clampBall(x: number, y: number): Point {
  const box = safeBox();
  const maxX = Math.max(box.left, window.innerWidth - box.right - BALL);
  const maxY = Math.max(box.top, window.innerHeight - box.bottom - BALL);
  return {
    x: Math.min(maxX, Math.max(box.left, x)),
    y: Math.min(maxY, Math.max(box.top, y)),
  };
}

function cornerPos(corner: Corner): Point {
  const box = safeBox();
  const right = window.innerWidth - box.right - BALL;
  const bottom = window.innerHeight - box.bottom - BALL;
  switch (corner) {
    case "tl":
      return { x: box.left, y: box.top };
    case "tr":
      return { x: right, y: box.top };
    case "bl":
      return { x: box.left, y: bottom };
    case "br":
      return { x: right, y: bottom };
  }
}

function nearestCorner(x: number, y: number): Corner {
  const corners: Corner[] = ["tl", "tr", "bl", "br"];
  let best: Corner = "br";
  let bestDist = Infinity;
  for (const corner of corners) {
    const pos = cornerPos(corner);
    const dist = (pos.x - x) ** 2 + (pos.y - y) ** 2;
    if (dist < bestDist) {
      bestDist = dist;
      best = corner;
    }
  }
  return best;
}

function cornerFromPoint(point: Point | null): Corner {
  if (!point) return "tr";
  return nearestCorner(point.x, point.y);
}

function menuAnchor(corner: Corner) {
  switch (corner) {
    case "br":
      return "bottom-full right-0 mb-2.5 origin-bottom-right";
    case "bl":
      return "bottom-full left-0 mb-2.5 origin-bottom-left";
    case "tr":
      return "top-full right-0 mt-2.5 origin-top-right";
    case "tl":
      return "top-full left-0 mt-2.5 origin-top-left";
  }
}

function useReducedMotionFlag() {
  const [reduced, setReduced] = useState(true);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(media.matches || prefersReducedMotion());
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return reduced;
}

export function TemplateAssistiveTouch({
  presets,
  selectedId,
  onPick,
}: {
  presets: HabitPreset[];
  selectedId: string | null;
  onPick: (preset: HabitPreset) => void;
}) {
  const menuId = useId();
  const ballRef = useRef<HTMLButtonElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    moved: boolean;
  } | null>(null);

  const reduced = useReducedMotionFlag();
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const [pos, setPos] = useState<Point | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) {
      setShown(false);
      return;
    }
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setShown(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  useEffect(() => {
    const onResize = () => {
      setPos((current) => {
        if (!current) return current;
        return cornerPos(nearestCorner(current.x, current.y));
      });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const selected = presets.find((preset) => preset.id === selectedId) ?? null;
  const [innerCount, outerCount] = splitRings(presets.length);
  const corner = cornerFromPoint(pos);

  function ballRect(): DOMRect {
    return (
      ballRef.current?.getBoundingClientRect() ??
      new DOMRect(window.innerWidth - 16 - BALL, 88, BALL, BALL)
    );
  }

  function onPointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) return;
    const rect = ballRect();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origX: rect.left,
      origY: rect.top,
      moved: false,
    };
  }

  function onPointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.moved && dx * dx + dy * dy < DRAG_THRESHOLD * DRAG_THRESHOLD) return;
    drag.moved = true;
    setOpen(false);
    setPos(clampBall(drag.origX + dx, drag.origY + dy));
  }

  function onPointerUp(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      /* already released */
    }
    if (drag.moved) {
      const rect = ballRect();
      setPos(cornerPos(nearestCorner(rect.left, rect.top)));
      return;
    }
    setOpen((value) => !value);
  }

  if (!mounted || presets.length === 0) return null;

  return createPortal(
    <>
      {open ? (
        <button
          type="button"
          tabIndex={-1}
          aria-label="Dismiss templates"
          onClick={close}
          className="fixed inset-0 z-50 cursor-default bg-transparent"
        />
      ) : null}

      <div
        className={cn(
          "pointer-events-none fixed z-50",
          pos == null &&
            "right-4 top-[max(4.5rem,calc(4.25rem+var(--safe-top)))] md:right-8 md:top-24",
        )}
        style={pos ? { left: pos.x, top: pos.y } : undefined}
      >
        {open ? (
          <div
            id={menuId}
            role="menu"
            aria-label="Habit templates"
            className={cn(
              "pointer-events-auto absolute gpu rounded-full glass-strong shadow-glass",
              menuAnchor(corner),
              shown
                ? "scale-100 opacity-100"
                : reduced
                  ? "scale-100 opacity-0"
                  : "scale-90 opacity-0",
              "transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
              "motion-reduce:scale-100 motion-reduce:transition-opacity motion-reduce:duration-150",
            )}
            style={{ width: MENU, height: MENU }}
          >
            <span className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/20 to-transparent" />
            <p className="pointer-events-none absolute left-1/2 top-1/2 w-16 -translate-x-1/2 -translate-y-1/2 text-center text-[10px] font-medium leading-tight text-ink-muted">
              Templates
            </p>
            {presets.map((preset, index) => {
              const inInner = index < innerCount;
              const ringIndex = inInner ? index : index - innerCount;
              const ringCount = inInner ? innerCount : outerCount;
              const radiusPx = inInner
                ? outerCount === 0
                  ? SINGLE_RADIUS
                  : INNER_RADIUS
                : OUTER_RADIUS;
              const point = ringPoint(ringIndex, Math.max(ringCount, 1), radiusPx);
              const selectedOrb = preset.id === selectedId;
              const atRest = shown || reduced;
              return (
                <button
                  key={preset.id}
                  type="button"
                  role="menuitem"
                  data-orb=""
                  aria-pressed={selectedOrb}
                  title={
                    preset.description
                      ? `${preset.category} · ${preset.description}`
                      : preset.title
                  }
                  onClick={() => {
                    onPick(preset);
                    close();
                  }}
                  style={{
                    left: "50%",
                    top: "50%",
                    transitionDelay: reduced ? "0ms" : `${index * 16}ms`,
                    transform: atRest
                      ? `translate3d(calc(-50% + ${point.x}px), calc(-50% + ${point.y}px), 0)`
                      : "translate3d(-50%, -50%, 0) scale(0.7)",
                    opacity: atRest ? 1 : 0,
                  }}
                  className={cn(
                    "absolute flex w-11 cursor-pointer flex-col items-center gap-0.5 text-ink",
                    "transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    "motion-reduce:transition-opacity motion-reduce:duration-150",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-9 items-center justify-center rounded-full border",
                      selectedOrb
                        ? "border-brand bg-brand-soft text-brand"
                        : "glass-thin text-ink-muted hover:bg-glass-strong hover:text-ink",
                    )}
                  >
                    <HabitIcon name={preset.icon} className="size-3.5" />
                  </span>
                  <span className="w-full truncate text-center text-[8px] font-medium leading-tight text-ink-muted">
                    {preset.title}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}

        <button
          ref={ballRef}
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
          aria-label={
            selected
              ? `Habit templates, ${selected.title} selected`
              : "Habit templates"
          }
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className={cn(
            "pointer-events-auto relative flex size-[60px] cursor-pointer items-center justify-center",
            "touch-none select-none rounded-full glass-strong shadow-glass gpu",
            selected ? "text-brand ring-2 ring-brand" : "text-ink",
          )}
        >
          <span className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/35 to-transparent" />
          <HabitIcon
            name={selected?.icon ?? "sparkles"}
            className="relative size-6"
          />
        </button>
      </div>
    </>,
    document.body,
  );
}
