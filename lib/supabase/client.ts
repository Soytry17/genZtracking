import { createBrowserClient } from "@supabase/ssr";

import { env } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Browser Supabase client for auth forms only (login / signup).
 * App data is fetched in Server Components and mutated via Server Actions
 * (`lib/supabase/server.ts`) so the user's browser does not waterfall
 * PostgREST calls to `*.supabase.co`.
 *
 * Safe to call on every render: `createBrowserClient` memoizes the instance
 * per tab.
 */
export function createClient() {
  return createBrowserClient<Database>(env.supabaseUrl, env.supabaseAnonKey);
}

export type SupabaseBrowserClient = ReturnType<typeof createClient>;
