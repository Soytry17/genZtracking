/**
 * Single place where public environment variables are read.
 *
 * `NEXT_PUBLIC_*` values are inlined at build time, so they must be referenced
 * as static property accesses rather than looked up dynamically.
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Copy .env.local.example to .env.local and fill it in.`,
    );
  }
  return value;
}

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

/**
 * Absolute origin for this deployment.
 *
 * Prefer `NEXT_PUBLIC_SITE_URL` (set on Vercel to the production host).
 * Otherwise use `window.location.origin` on the client, or the request origin
 * on the server. Never falls back to a hardcoded localhost URL.
 */
export function getSiteOrigin(requestOrigin?: string): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return trimTrailingSlash(fromEnv);
  if (typeof window !== "undefined") return window.location.origin;
  if (requestOrigin) return trimTrailingSlash(requestOrigin);
  throw new Error(
    "Missing NEXT_PUBLIC_SITE_URL and no request/window origin to fall back to.",
  );
}

/** Confirmation / recovery emails must land on `/auth/callback`. */
export function getAuthCallbackUrl(requestOrigin?: string): string {
  return `${getSiteOrigin(requestOrigin)}/auth/callback`;
}

export const env = {
  supabaseUrl: required(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  ),
  supabaseAnonKey: required(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ),
  /** Absolute origin from env, if set. Prefer `getSiteOrigin()` for redirects. */
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
} as const;
