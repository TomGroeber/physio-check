import "server-only";

import { createSupabaseServerClient } from "@/server/db/server-client";

/**
 * Streng getrennte Betreiberrolle (siehe supabase/migrations/
 * 20260725100000_platform_admin_role.sql): NIEMALS über
 * practice_members oder eine Praxis-Mitgliedschaft ableitbar. Jede
 * `/admin`-Route und jede zugehörige Server Action ruft diese Funktion
 * ZUERST mit dem Client der angemeldeten Sitzung auf – die Prüfung
 * läuft über die SECURITY-DEFINER-Funktion `is_platform_admin()`
 * (liest `platform_admins` mit den Rechten der Datenbankfunktion, der
 * Client selbst hat auf diese Tabelle keinerlei RLS-Zugriff).
 *
 * Ein Service-Role-Client darf für Betreiberaktionen erst NACH einem
 * erfolgreichen Aufruf dieser Funktion erzeugt werden (Auftragsregel:
 * kein pauschaler Service-Role-Zugriff ohne unmittelbar vorherige
 * Plattformadminprüfung).
 */
export type PlatformAdminSession = {
  userId: string;
  email: string | null;
};

export async function getPlatformAdminSession(): Promise<PlatformAdminSession | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.rpc("is_platform_admin");
  if (error || !data) return null;

  return { userId: user.id, email: user.email ?? null };
}

export class PlatformAdminAuthorizationError extends Error {
  constructor() {
    super("not_platform_admin");
    this.name = "PlatformAdminAuthorizationError";
  }
}

/** Wirft, wenn die aktuelle Sitzung kein Plattformadmin ist. */
export async function assertPlatformAdmin(): Promise<PlatformAdminSession> {
  const session = await getPlatformAdminSession();
  if (!session) throw new PlatformAdminAuthorizationError();
  return session;
}
