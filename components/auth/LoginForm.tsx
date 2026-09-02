"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, Field, inputClassName } from "@/components/ui";
import { looksLikeEmail } from "@/lib/auth-credentials";
import { DEFAULT_SIGNED_IN_ROUTE, ROUTES } from "@/lib/habits/constants";
import { createClient } from "@/lib/supabase/client";

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "error"; message: string };

const INVALID = "Invalid username or password.";

export function LoginForm({
  next,
  initialError,
}: {
  next: string;
  initialError?: string;
}) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>(
    initialError ? { kind: "error", message: initialError } : { kind: "idle" },
  );

  const busy = status.kind === "sending";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const trimmed = identifier.trim();
    if (!trimmed || !password) {
      setStatus({
        kind: "error",
        message: "Enter your username or email, and your password.",
      });
      return;
    }

    setStatus({ kind: "sending" });

    const supabase = createClient();
    let email = trimmed;

    if (!looksLikeEmail(trimmed)) {
      const { data, error } = await supabase.rpc("email_for_username", {
        p_username: trimmed,
      });
      if (error || !data) {
        setStatus({ kind: "error", message: INVALID });
        return;
      }
      email = data;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setStatus({ kind: "error", message: INVALID });
      return;
    }

    router.replace(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Username or email" htmlFor="identifier">
        <input
          id="identifier"
          name="identifier"
          type="text"
          autoComplete="username"
          required
          placeholder="username or you@example.com"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          disabled={busy}
          className={inputClassName}
        />
      </Field>

      <Field label="Password" htmlFor="password">
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={busy}
          className={inputClassName}
        />
      </Field>

      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </Button>

      {status.kind === "error" ? (
        <p
          role="alert"
          className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger"
        >
          {status.message}
        </p>
      ) : null}

      <p className="text-center text-xs text-ink-subtle">
        No account yet?{" "}
        <Link
          href={
            next === DEFAULT_SIGNED_IN_ROUTE
              ? ROUTES.signup
              : `${ROUTES.signup}?next=${encodeURIComponent(next)}`
          }
          className="font-medium text-ink-muted hover:text-ink"
        >
          Create one
        </Link>
      </p>
    </form>
  );
}
