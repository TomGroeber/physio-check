import "server-only";

import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";
import type { Database } from "@/server/db/database.types";

export type MobileAuth = {
  user: User;
  /** RLS-Client, der als dieser Benutzer agiert (kein Service-Key). */
  supabase: SupabaseClient<Database>;
};

/**
 * Authentifizierung der /api/mobile-Endpunkte (D-059): Die App sendet
 * das Supabase-Access-Token als Bearer-Header. Der Server verifiziert
 * es gegen Supabase Auth und erhält einen Client, der denselben
 * RLS-Regeln unterliegt wie der Benutzer selbst – Autorisierung bleibt
 * damit in der Datenbank, nie nur im Client.
 */
export async function authenticateMobileRequest(
  request: Request
): Promise<MobileAuth | null> {
  const header = request.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;

  const supabase = createClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return { user: data.user, supabase };
}

export function jsonError(code: string, message: string, status: number): Response {
  return Response.json({ error: { code, message } }, { status });
}
