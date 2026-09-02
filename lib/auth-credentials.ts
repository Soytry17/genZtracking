/**
 * Client-safe username / password rules. Keep in sync with the check
 * constraint on `public.profiles.username` in 0003_username.sql.
 */

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;
export const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,20}$/;

/** Matches the default Supabase Auth minimum; the form asks for 8. */
export const PASSWORD_MIN_LENGTH = 8;

export function looksLikeEmail(value: string): boolean {
  return value.includes("@");
}

export function parseUsername(value: string): string | null {
  const trimmed = value.trim();
  if (!USERNAME_PATTERN.test(trimmed)) return null;
  return trimmed;
}

export const USERNAME_HINT =
  "3–20 characters: letters, numbers, and underscores.";
