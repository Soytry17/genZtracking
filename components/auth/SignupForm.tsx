"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, Field, inputClassName } from "@/components/ui";
import { RippleCta } from "@/components/ui/ripple-cta";
import {
  PASSWORD_MIN_LENGTH,
  USERNAME_HINT,
  parseUsername,
} from "@/lib/auth-credentials";
import { getAuthCallbackUrl } from "@/lib/env";
import { DEFAULT_SIGNED_IN_ROUTE, ROUTES } from "@/lib/habits/constants";
import { createClient } from "@/lib/supabase/client";

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "confirm"; email: string }
  | { kind: "error"; message: string };

export function SignupForm({ next }: { next: string }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const busy = status.kind === "sending";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const parsedUsername = parseUsername(username);
    const trimmedEmail = email.trim();

    if (!parsedUsername) {
      setStatus({ kind: "error", message: USERNAME_HINT });
      return;
    }
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setStatus({ kind: "error", message: "Enter a valid email address." });
      return;
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
      setStatus({
        kind: "error",
        message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
      });
      return;
    }

    setStatus({ kind: "sending" });
    const supabase = createClient();

    const { data: available, error: availableError } = await supabase.rpc(
      "username_available",
      { p_username: parsedUsername },
    );
    if (availableError) {
      if (!isMissingRpcError(availableError)) {
        setStatus({ kind: "error", message: availableError.message });
        return;
      }
      // RPC not in PostgREST cache yet — continue; unique index / insert
      // will still reject a taken username.
    } else if (available === false) {
      setStatus({ kind: "error", message: "That username is taken." });
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        emailRedirectTo: getAuthCallbackUrl(),
        data: {
          username: parsedUsername,
          display_name: parsedUsername,
        },
      },
    });

    if (error) {
      setStatus({
        kind: "error",
        message: signupErrorMessage(error.message, error.code),
      });
      return;
    }

    if (data.user && data.session) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          username: parsedUsername,
          display_name: parsedUsername,
        })
        .eq("id", data.user.id);

      if (profileError && isUsernameConflict(profileError)) {
        setStatus({ kind: "error", message: "That username is taken." });
        return;
      }

      router.replace(next);
      router.refresh();
      return;
    }

    setStatus({ kind: "confirm", email: trimmedEmail });
  }

  if (status.kind === "confirm") {
    return (
      <div className="space-y-4 text-center">
        <p className="font-medium text-ink">Confirm your email</p>
        <p className="text-sm text-ink-muted">
          We sent a confirmation link to{" "}
          <span className="font-medium text-ink">{status.email}</span>. After
          you click it, come back here to sign in.
        </p>
        <p className="text-xs text-ink-subtle">
          Prefer instant access? In the Supabase dashboard turn off{" "}
          <span className="font-medium text-ink-muted">Confirm email</span>{" "}
          under Authentication → Providers → Email.
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setStatus({ kind: "idle" })}
        >
          Use a different email
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field data-auth-field label="Username" htmlFor="username" hint={USERNAME_HINT}>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          minLength={3}
          maxLength={20}
          placeholder="yourname"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          disabled={busy}
          className={inputClassName}
        />
      </Field>

      <Field data-auth-field label="Email" htmlFor="email">
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={busy}
          className={inputClassName}
        />
      </Field>

      <Field data-auth-field label="Password" htmlFor="password">
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={PASSWORD_MIN_LENGTH}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={busy}
          className={inputClassName}
        />
      </Field>

      <RippleCta
        data-auth-field
        type="submit"
        size="lg"
        className="w-full"
        disabled={busy}
      >
        {busy ? "Creating account…" : "Create account"}
      </RippleCta>

      {status.kind === "error" ? (
        <p
          role="alert"
          className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger"
        >
          {status.message}
        </p>
      ) : null}

      <p className="text-center text-xs text-ink-subtle">
        Already have an account?{" "}
        <Link
          href={
            next === DEFAULT_SIGNED_IN_ROUTE
              ? ROUTES.login
              : `${ROUTES.login}?next=${encodeURIComponent(next)}`
          }
          className="font-medium text-ink-muted hover:text-ink"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}

function isMissingRpcError(error: { message: string; code?: string }): boolean {
  const code = error.code?.toUpperCase() ?? "";
  if (code === "PGRST202" || code === "42883") return true;
  const message = error.message.toLowerCase();
  return (
    message.includes("schema cache") ||
    message.includes("could not find the function")
  );
}

function isUsernameConflict(error: { message: string; code?: string }): boolean {
  if (error.code === "23505") return true;
  const lower = error.message.toLowerCase();
  return (
    lower.includes("duplicate key") ||
    lower.includes("profiles_username")
  );
}

function signupErrorMessage(message: string, code?: string): string {
  if (code === "23505") return "That username is taken.";
  const lower = message.toLowerCase();
  if (lower.includes("already registered") || lower.includes("already exists")) {
    return "That email is already registered. Try signing in.";
  }
  if (
    lower.includes("duplicate key") ||
    lower.includes("profiles_username") ||
    lower.includes("database error saving new user") ||
    (lower.includes("username") &&
      (lower.includes("unique") ||
        lower.includes("taken") ||
        lower.includes("violat")))
  ) {
    return "That username is taken.";
  }
  return message;
}
