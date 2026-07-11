import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";
import type { Database } from "@/server/db/database.types";

/**
 * Supabase-Client für Client Components (läuft im Browser).
 * Nutzt ausschließlich den öffentlichen Anon-Key; jede Berechtigung
 * wird serverseitig und über Row Level Security durchgesetzt.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(getSupabaseUrl(), getSupabaseAnonKey());
}
