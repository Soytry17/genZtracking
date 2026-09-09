"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { createPortal } from "react-dom";

import { CheckIcon } from "@/components/habit/CheckIcon";
import { animatePress } from "@/lib/anim/anime";
import { enterFromNear, prefersReducedMotion } from "@/lib/anim/gsap";
import { formatAppTime } from "@/lib/habits/dates";
import {
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_TONE,
} from "@/lib/tasks/constants";
import { cn } from "@/lib/utils";
import type { DailyTask, TaskPriority } from "@/types/database";

export function TaskCard({
  task,
  onToggle,
  onOpen,
  onPriorityChange,
  onImportanceToggle,
  fresh = false,
}: {
  task: DailyTask;
  onToggle: () => void;
  onOpen: () => void;
  onPriorityChange: (priority: TaskPriority) => void;
  onImportanceToggle: () => void;
  fresh?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const checkRef = useRef<HTMLButtonElement>(null);
  const [pending, start] = useTransition();
  const done = Boolean(task.completed_at);
  const important = task.importance === "important";
  const completedLabel = task.completed_at
    ? formatAppTime(task.completed_at)
    : "";

  useEffect(() => {
    if (!fresh) return;
    const el = rootRef.current;
    if (!el || prefersReducedMotion()) return;
    const tween = enterFromNear(el, {
      y: 8,
      scale: 0.97,
      opacityFrom: 0.86,
      duration: 0.28,
    });
    tween.eventCallback("onComplete", () => {
      el.style.transform = "none";
    });
    return () => {
      tween.kill();
      el.style.transform = "none";
    };
  }, [fresh, task.id]);

  return (
    <div
      ref={rootRef}
      className={cn(
        "rounded-[1.35rem] glass px-3 py-2.5 sm:px-3.5 sm:py-3",
        done && "opacity-80",
      )}
    >
      <div className="flex items-start gap-2.5">
        <button
          ref={checkRef}
          type="button"
          disabled={pending}
          onPointerDown={(event) => {
            if (!pending && event.button === 0) {
              animatePress(checkRef.current);
            }
          }}
          onClick={() => start(onToggle)}
          className={cn(
            "relative mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-full transition-colors sm:size-10",
            done
              ? "bg-brand text-brand-ink"
              : "glass-tile text-ink-muted hover:bg-glass",
          )}
          aria-label={done ? `Uncheck ${task.title}` : `Complete ${task.title}`}
        >
          <span
            className={cn(
              "absolute inset-[3px] rounded-full border",
              done ? "border-transparent" : "border-white/20",
            )}
            aria-hidden
          />
          <CheckIcon active={done} className="size-4" />
        </button>

        <button
          type="button"
          onClick={onOpen}
          className="min-w-0 flex-1 rounded-lg py-0.5 text-left"
        >
          <span
            className={cn(
              "block text-sm font-medium leading-snug text-ink",
              done && "text-ink-muted line-through decoration-ink-subtle/70",
            )}
          >
            {task.title}
          </span>
          <span className="mt-1.5 flex min-w-0 flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "inline-flex h-6 items-center gap-1 rounded-full px-2 text-[10px] font-medium",
                important
                  ? "bg-brand-soft text-brand"
                  : "bg-glass text-ink-subtle",
              )}
            >
              {important ? "Important" : TASK_PRIORITY_LABELS[task.priority]}
            </span>
            {completedLabel ? (
              <time
                className="text-[11px] tabular-nums text-ink-subtle"
                dateTime={task.completed_at ?? undefined}
              >
                {completedLabel}
              </time>
            ) : null}
          </span>
        </button>

        <TaskRowMenu
          task={task}
          disabled={pending}
          onPriorityChange={(priority) => start(() => onPriorityChange(priority))}
          onImportanceToggle={() => start(onImportanceToggle)}
          onEdit={onOpen}
        />
      </div>
    </div>
  );
}

function TaskRowMenu({
  task,
  disabled,
  onPriorityChange,
  onImportanceToggle,
  onEdit,
}: {
  task: DailyTask;
  disabled: boolean;
  onPriorityChange: (priority: TaskPriority) => void;
  onImportanceToggle: () => void;
  onEdit: () => void;
}) {
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null,
  );
  const important = task.importance === "important";

  useEffect(() => {
    setHost(document.body);
  }, []);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const width = 176;
    const left = Math.min(
      Math.max(8, rect.right - width),
      window.innerWidth - width - 8,
    );
    setCoords({ top: rect.bottom + 4, left });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);

  return (
    <div className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`More actions for ${task.title}`}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex size-11 items-center justify-center rounded-full text-ink-subtle hover:bg-glass hover:text-ink sm:size-9"
      >
        <DotsIcon />
      </button>
      {open && host && coords
        ? createPortal(
            <div
              ref={menuRef}
              id={menuId}
              role="menu"
              style={{ top: coords.top, left: coords.left }}
              className="menu-popover fixed z-50 w-44 overflow-hidden rounded-2xl py-1"
            >
              <p className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-ink-subtle">
                Priority
              </p>
              {TASK_PRIORITIES.map((priority) => {
                const tone = TASK_PRIORITY_TONE[priority];
                const selected = task.priority === priority;
                return (
                  <button
                    key={priority}
                    type="button"
                    role="menuitemradio"
                    aria-checked={selected}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-glass",
                      selected ? tone.text : "text-ink",
                    )}
                    onClick={() => {
                      onPriorityChange(priority);
                      setOpen(false);
                    }}
                  >
                    <span className={cn("size-2 rounded-full", tone.dot)} />
                    {TASK_PRIORITY_LABELS[priority]}
                  </button>
                );
              })}
              <div className="my-1 h-px bg-hairline" />
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center px-3 py-2 text-left text-sm text-ink hover:bg-glass"
                onClick={() => {
                  onImportanceToggle();
                  setOpen(false);
                }}
              >
                {important ? "Mark not important" : "Mark important"}
              </button>
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center px-3 py-2 text-left text-sm text-ink hover:bg-glass"
                onClick={() => {
                  onEdit();
                  setOpen(false);
                }}
              >
                Edit
              </button>
            </div>,
            host,
          )
        : null}
    </div>
  );
}

function DotsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <circle cx="12" cy="5" r="1.4" fill="currentColor" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" />
      <circle cx="12" cy="19" r="1.4" fill="currentColor" />
    </svg>
  );
}
