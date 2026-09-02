import { createBrowserClient } from "@supabase/ssr";

import { env } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Supabase client for Client Components. Safe to call on every render:
 * `createBrowserClient` memoizes the underlying instance per browser tab.
 */
export function createClient() {
  return createBrowserClient<Database>(env.supabaseUrl, env.supabaseAnonKey);
}

export type SupabaseBrowserClient = ReturnType<typeof createClient>;
