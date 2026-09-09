import { cache } from "react";
import { cookies } from "next/headers";

import { createServerClient } from "@supabase/ssr";

import { env } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 *
 * Request-memoized via React `cache` so layout + page + queries share one
 * instance. Never hoist to a module-level constant — that would share sessions
 * across users.
 */
export const createClient = cache(async () => {
  const cookieStore = await cookies();

  return createServerClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Cookies cannot be written while rendering a Server Component.
          // The middleware refreshes the session cookie instead, so this is safe to swallow.
        }
      },
    },
  });
});

export type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;
