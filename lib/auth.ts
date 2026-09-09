import { cache } from "react";
import { redirect } from "next/navigation";

import type { User } from "@supabase/supabase-js";

import { ROUTES } from "@/lib/habits/constants";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

/**
 * Server-side session helpers. Use these in Server Components, Server Actions
 * and Route Handlers instead of calling `supabase.auth` directly, so the
 * redirect behaviour stays consistent.
 *
 * `getUser` / `getProfile` are request-memoized so the app layout and a page
 * like Today share one auth round trip and one profile row.
 */

const PROFILE_COLUMNS =
  "id, display_name, username, avatar_url, xp, level, freeze_tokens, created_at, updated_at" as const;

export const getUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/** Redirects to /login (preserving `next`) when there is no session. */
export async function requireUser(next?: string): Promise<User> {
  const user = await getUser();
  if (!user) {
    const target = next
      ? `${ROUTES.login}?next=${encodeURIComponent(next)}`
      : ROUTES.login;
    redirect(target);
  }
  return user;
}

export const getProfile = cache(async (userId: string): Promise<Profile | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();
  return (data as Profile | null) ?? null;
});

/**
 * The pair almost every authenticated page needs.
 * `profile` is null only in the window before the handle_new_user trigger row
 * is visible, so treat it as "not loaded yet" rather than an error.
 */
export async function requireSession(next?: string): Promise<{
  user: User;
  profile: Profile | null;
}> {
  const user = await requireUser(next);
  return { user, profile: await getProfile(user.id) };
}

/** Best display name available for a user, falling back to username then email. */
export function displayNameFor(
  user: Pick<User, "email">,
  profile: Profile | null,
): string {
  const fromProfile = profile?.display_name?.trim();
  if (fromProfile) return fromProfile;
  const fromUsername = profile?.username?.trim();
  if (fromUsername) return fromUsername;
  return user.email?.split("@")[0] ?? "You";
}

/** First token of the display name, for greetings. */
export function firstNameFor(
  user: Pick<User, "email">,
  profile: Profile | null,
): string {
  const name = displayNameFor(user, profile);
  return name.split(/\s+/)[0] || name;
}
