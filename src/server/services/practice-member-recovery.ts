import "server-only";

import { randomBytes } from "node:crypto";
import { createSupabaseServerClient } from "@/server/db/server-client";
import { createSupabaseServiceClient } from "@/server/db/service-client";
import { hashInviteToken } from "@/server/services/staff-invites";

/**
 * Zugangs-Wiederherstellung für Praxismitglieder, die sowohl Passwort
 * als auch die alte E-Mail-Adresse verloren haben (s. DECISIONS.md
 * D-113). Ausschließlich vom Plattformadmin auslösbar (Prüfung läuft
 * bereits in der aufrufenden Server Action über `assertPlatformAdmin`,
 * wie bei allen anderen Betreiberaktionen).
 */

const RECOVERY_VALIDITY_DAYS = 7;

function generateRecoveryToken(): string {
  return randomBytes(32).toString("base64url");
}

function recoveryLink(token: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${appUrl}/practice-recovery/${token}`;
}

export async function createPracticeMemberRecovery(
  practiceMemberId: string,
  newEmail: string
): Promise<{ link: string } | { error: string }> {
  const supabase = await createSupabaseServerClient();
  const token = generateRecoveryToken();
  const tokenHash = hashInviteToken(token);
  const expiresAt = new Date(Date.now() + RECOVERY_VALIDITY_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase.rpc("create_practice_member_recovery", {
    p_practice_member_id: practiceMemberId,
    p_new_email: newEmail,
    p_token_hash: tokenHash,
    p_expires_at: expiresAt,
  });
  if (error) return { error: "failed" };

  return { link: recoveryLink(token) };
}

export type PendingPracticeMemberRecovery = {
  practiceMemberId: string;
  newEmail: string;
  practiceId: string;
  practiceName: string;
  role: "admin" | "therapist";
};

/** Liest eine Wiederherstellungsanfrage anhand des Klartext-Tokens (öffentliche Seite, keine Sitzung nötig). */
export async function inspectPracticeMemberRecoveryToken(
  token: string
): Promise<PendingPracticeMemberRecovery | null> {
  const tokenHash = hashInviteToken(token);
  const service = createSupabaseServiceClient();
  const { data } = await service.rpc("inspect_practice_member_recovery", { p_token_hash: tokenHash });
  const row = data?.[0];
  if (!row) return null;

  return {
    practiceMemberId: row.out_practice_member_id,
    newEmail: row.out_new_email,
    practiceId: row.out_practice_id,
    practiceName: row.out_practice_name,
    role: row.out_role,
  };
}

/**
 * Löst die Wiederherstellung ein: legt ein neues, bereits bestätigtes
 * Konto für die vom Plattformadmin festgelegte E-Mail-Adresse an
 * (Service-Role-Admin-API, da noch keine Sitzung existiert) und hängt
 * die bestehende Mitgliedschaft darauf um. Keine automatische
 * Anmeldung danach - die Person meldet sich bewusst separat mit dem
 * neuen Konto an (kein Session-Handling während der Kontoerstellung).
 */
export async function redeemPracticeMemberRecovery(
  token: string,
  newPassword: string
): Promise<{ ok: true } | { ok: false; reason: "invalid" | "email_in_use" | "failed" }> {
  const tokenHash = hashInviteToken(token);
  const service = createSupabaseServiceClient();

  const { data: inspected } = await service.rpc("inspect_practice_member_recovery", {
    p_token_hash: tokenHash,
  });
  const pending = inspected?.[0];
  if (!pending) return { ok: false, reason: "invalid" };

  const { data: created, error: createError } = await service.auth.admin.createUser({
    email: pending.out_new_email,
    password: newPassword,
    email_confirm: true,
  });
  if (createError || !created.user) {
    if (createError?.code === "email_exists" || createError?.code === "user_already_exists") {
      return { ok: false, reason: "email_in_use" };
    }
    return { ok: false, reason: "failed" };
  }

  const { error: redeemError } = await service.rpc("redeem_practice_member_recovery", {
    p_token_hash: tokenHash,
    p_new_profile_id: created.user.id,
  });
  if (redeemError) {
    // Aufgeräumtes Konto ohne Mitgliedschaft wäre verwirrend - rückgängig machen.
    await service.auth.admin.deleteUser(created.user.id);
    return { ok: false, reason: "failed" };
  }

  return { ok: true };
}
