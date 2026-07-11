import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl } from "@/lib/env";
import type { Database } from "@/server/db/database.types";

/**
 * Service-Role-Client: umgeht Row Level Security und darf deshalb
 * NUR für eng begrenzte, serverseitige Operationen verwendet werden
 * (z. B. Einladungscode-Einlösung, Benachrichtigungen anlegen).
 * Der Schlüssel existiert ausschließlich in Server-Umgebungsvariablen.
 * Jede neue Verwendung braucht eine Begründung im Code-Kommentar.
 */
export function createSupabaseServiceClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      "Umgebungsvariable SUPABASE_SERVICE_ROLE_KEY fehlt (nur serverseitig setzen, niemals mit NEXT_PUBLIC_-Präfix)."
    );
  }

  return createClient<Database>(getSupabaseUrl(), serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
