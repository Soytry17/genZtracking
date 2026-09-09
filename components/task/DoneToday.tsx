"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
} from "react";
import { createPortal } from "react-dom";

import { CheckIcon } from "@/components/habit/CheckIcon";
import { animatePress } from "@/lib/anim/anime";
import { enterFromNear, useGsap } from "@/lib/anim/gsap";
import { formatAppTime } from "@/lib/habits/dates";
import { cn } from "@/lib/utils";
import type { DailyTask } from "@/types/database";

export function DoneToday({
  tasks,
  onUndo,
}: {
  tasks: DailyTask[];
  onUndo: (task: DailyTask) => void;
}) {
  const [open, setOpen] = useState(false);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    setHost(document.body);
  }, []);

  useEffect(() => {
    if (tasks.length === 0) setOpen(false);
  }, [tasks.length]);

  if (tasks.length === 0) return null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Done today, ${tasks.length} completed`}
        onPointerDown={(event) => {
          if (event.button === 0) animatePress(triggerRef.current, 0.96);
        }}
        onClick={() => setOpen(true)}
        className={cn(
          "glass inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-3 text-sm font-medium text-ink",
          "hover:bg-glass-strong",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/70",
          "sm:h-9 sm:px-3.5",
        )}
      >
        <span
          className="relative flex size-5 shrink-0 items-center justify-center rounded-md bg-success-soft text-success"
          aria-hidden
        >
          <CheckIcon active className="size-3" />
        </span>
        Done today
        <span className="min-w-5 rounded-full bg-success-soft px-1.5 py-0.5 text-center text-[11px] font-semibold tabular-nums leading-none text-success">
          {tasks.length}
        </span>
      </button>

      {open && host
        ? createPortal(
            <DoneTodayModal
              tasks={tasks}
              onUndo={onUndo}
              onClose={close}
            />,
            host,
          )
        : null}
    </>
  );
}

function DoneTodayModal({
  tasks,
  onUndo,
  onClose,
}: {
  tasks: DailyTask[];
  onUndo: (task: DailyTask) => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const seenRef = useRef<Set<string> | null>(null);
  if (seenRef.current === null) {
    seenRef.current = new Set(tasks.map((task) => task.id));
  }

  const freshIds = new Set<string>();
  for (const task of tasks) {
    if (!seenRef.current.has(task.id)) freshIds.add(task.id);
  }

  useEffect(() => {
    const seen = seenRef.current;
    if (!seen) return;
    for (const task of tasks) seen.add(task.id);
    for (const id of [...seen]) {
      if (!tasks.some((task) => task.id === id)) seen.delete(id);
    }
  }, [tasks]);

  useGsap(
    rootRef,
    (gsap) => {
      if (backdropRef.current) {
        gsap.fromTo(
          backdropRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.22, ease: "power2.out" },
        );
      }
      enterFromNear(panelRef.current, {
        y: 0,
        scale: 0.94,
        opacityFrom: 0.88,
        duration: 0.32,
        ease: "power3.out",
      });
    },
    [],
  );

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseRef.current();
    }
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[55] flex items-end justify-center md:items-center md:p-4"
    >
      <button
        ref={backdropRef}
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="glass-strong relative z-10 flex w-full max-h-[min(85dvh,36rem)] origin-bottom flex-col rounded-t-panel shadow-glass md:max-w-md md:origin-center md:rounded-panel"
      >
        <header className="flex items-start gap-3 px-4 pt-4 sm:px-5 sm:pt-5">
          <div className="min-w-0 flex-1">
            <h2
              id={titleId}
              className="flex items-center gap-2 text-lg font-semibold"
            >
              Done today
              <span className="rounded-full bg-success-soft px-1.5 py-0.5 text-[11px] font-semibold tabular-nums leading-none text-success">
                {tasks.length}
              </span>
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onPointerDown={(event) => {
              if (event.button === 0) animatePress(closeRef.current, 0.92);
            }}
            onClick={onClose}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-glass hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/70 sm:size-9"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </header>

        <ul className="min-h-0 flex-1 overflow-y-auto px-3 pb-[max(1.25rem,var(--safe-bottom))] pt-3 sm:px-4 sm:pb-5">
          {tasks.map((task) => (
            <li key={task.id}>
              <DoneTaskRow
                task={task}
                fresh={freshIds.has(task.id)}
                onUndo={() => onUndo(task)}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function DoneTaskRow({
  task,
  fresh,
  onUndo,
}: {
  task: DailyTask;
  fresh: boolean;
  onUndo: () => void;
}) {
  const undoRef = useRef<HTMLButtonElement>(null);
  const [pending, start] = useTransition();
  const [checkOn, setCheckOn] = useState(!fresh);
  const completedLabel = task.completed_at
    ? formatAppTime(task.completed_at)
    : "";

  useEffect(() => {
    if (fresh) setCheckOn(true);
  }, [fresh]);

  return (
    <div className="flex items-center gap-2.5 rounded-2xl px-2 py-2 hover:bg-glass">
      <span
        className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-success-soft text-success"
        aria-hidden
      >
        <CheckIcon active={checkOn} className="size-3.5" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink-muted line-through decoration-ink-subtle/70">
          {task.title}
        </p>
        {completedLabel ? (
          <time
            className="mt-0.5 block truncate text-[11px] leading-none text-ink-subtle tabular-nums"
            dateTime={task.completed_at ?? undefined}
          >
            {completedLabel}
          </time>
        ) : null}
      </div>

      <button
        ref={undoRef}
        type="button"
        disabled={pending}
        onPointerDown={(event) => {
          if (!pending && event.button === 0) {
            animatePress(undoRef.current, 0.94);
          }
        }}
        onClick={() => start(onUndo)}
        className="shrink-0 rounded-full px-2.5 py-1.5 text-[12px] font-medium text-ink-subtle hover:bg-glass hover:text-ink disabled:opacity-50"
        aria-label={`Undo complete ${task.title}`}
      >
        Undo
      </button>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        d="M6 6l12 12M18 6 6 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
