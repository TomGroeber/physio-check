import "server-only";

import { cache } from "react";
import { createSupabaseServerClient } from "@/server/db/server-client";

export type PracticeRole = "therapist" | "admin";

export type SessionContext = {
  userId: string;
  email: string | null;
  fullName: string;
  /** Aktive Praxis-Mitgliedschaften (Therapeut/Admin) */
  memberships: {
    memberId: string;
    practiceId: string;
    practiceName: string;
    role: PracticeRole;
  }[];
  /** Aktive Praxisverknüpfung als Patient */
  patientLink: {
    practiceId: string;
    practiceName: string;
  } | null;
  /** Betreiber-Rolle (s. platform-admin-auth.ts) – strikt getrennt von Praxisrollen (D-094). */
  isPlatformAdmin: boolean;
};

/**
 * Liest den angemeldeten Benutzer samt Rollenkontext.
 * Pro Request gecacht (React cache), damit Layout und Seite nicht
 * doppelt abfragen. Gibt null zurück, wenn niemand angemeldet ist.
 *
 * Wichtig: Rollen kommen ausschließlich aus der Datenbank
 * (practice_members / patient_practice_links), nie aus dem Client.
 */
export const getSessionContext = cache(async (): Promise<SessionContext | null> => {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [profileResult, membershipResult, linkResult, platformAdminResult] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
    supabase
      .from("practice_members")
      .select("id, role, is_active, practices ( id, name )")
      .eq("profile_id", user.id)
      .eq("is_active", true),
    supabase
      .from("patient_practice_links")
      .select("practice_id, status, practices ( id, name )")
      .eq("patient_profile_id", user.id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle(),
    supabase.rpc("is_platform_admin"),
  ]);

  const memberships = (membershipResult.data ?? []).map((m) => ({
    memberId: m.id,
    practiceId: m.practices.id,
    practiceName: m.practices.name,
    role: m.role,
  }));

  const patientLink = linkResult.data
    ? {
        practiceId: linkResult.data.practices.id,
        practiceName: linkResult.data.practices.name,
      }
    : null;

  return {
    userId: user.id,
    email: user.email ?? null,
    fullName: profileResult.data?.full_name ?? "",
    memberships,
    patientLink,
    isPlatformAdmin: Boolean(platformAdminResult.data),
  };
});

/** Zielroute nach Login – reine Logik, s. src/lib/session-routing.ts. */
export { homeRouteFor } from "@/lib/session-routing";
