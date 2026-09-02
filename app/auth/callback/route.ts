import { NextResponse, type NextRequest } from "next/server";

import { DEFAULT_SIGNED_IN_ROUTE } from "@/lib/habits/constants";
import { createClient } from "@/lib/supabase/server";

/**
 * Landing point for email confirmation / recovery links.
 *
 * Password sign-in does not use this route. Keep it so a confirmation email
 * still works if "Confirm email" is left on in the Supabase dashboard.
 *
 * Handles both shapes:
 *   - `?code=...`                  PKCE (confirmation / recovery)
 *   - `?token_hash=...&type=...`   email templates that use `{{ .TokenHash }}`
 *
 * On success the session cookie is written and the user is sent to `?next=`
 * (must be a relative path) or the default signed-in route.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = safeRedirectPath(searchParams.get("next"));

  const providerError =
    searchParams.get("error_description") ?? searchParams.get("error");
  if (providerError) {
    return NextResponse.redirect(loginUrl(origin, providerError, next));
  }

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(loginUrl(origin, error.message, next));
    }
    return NextResponse.redirect(new URL(next, origin));
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as "email" | "magiclink" | "recovery" | "invite" | "signup",
      token_hash: tokenHash,
    });
    if (error) {
      return NextResponse.redirect(loginUrl(origin, error.message, next));
    }
    return NextResponse.redirect(new URL(next, origin));
  }

  return NextResponse.redirect(
    loginUrl(origin, "That sign-in link is missing or has expired.", next),
  );
}

/** Only allow same-origin relative paths, so `?next=` cannot be used as an open redirect. */
function safeRedirectPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_SIGNED_IN_ROUTE;
  }
  return value;
}

function loginUrl(origin: string, message: string, next: string) {
  const url = new URL("/login", origin);
  url.searchParams.set("error", message);
  if (next !== DEFAULT_SIGNED_IN_ROUTE) {
    url.searchParams.set("next", next);
  }
  return url;
}
