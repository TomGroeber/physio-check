import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";
import type { Database } from "@/server/db/database.types";

/**
 * Supabase-Client für Server Components, Server Actions und Route
 * Handler. Die Sitzung liegt in Cookies (verwaltet von @supabase/ssr);
 * Abfragen laufen mit den Rechten des angemeldeten Benutzers und
 * unterliegen damit Row Level Security.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // In Server Components dürfen Cookies nicht gesetzt werden;
          // der Proxy (src/proxy.ts) übernimmt das Sitzungs-Refresh.
        }
      },
    },
  });
}
