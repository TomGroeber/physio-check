import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/server/db/server-client";
import { createSupabaseServiceClient } from "@/server/db/service-client";

/**
 * Mitarbeitereinladungen (Praxisadmin oder Therapeut). Gleiches
 * Sicherheitsmuster wie src/server/services/invites.ts (nur ein Hash
 * wird gespeichert), aber ein Link-Token statt eines abzutippenden
 * Codes – deshalb 32 Byte Zufall statt eines kurzen Alphabets, und
 * eine Sitzung, die den Klartext-Token bis zur Annahme aufbewahrt
 * (httpOnly-Cookie, wie STAFF_INVITE_SESSION_COOKIE unten).
 *
 * Zwei Erzeugungswege teilen sich dieselbe Kernlogik:
 *  - Praxisadmin lädt Mitarbeitende der EIGENEN Praxis ein (normaler,
 *    RLS-geprüfter Client).
 *  - Plattformadmin legt die ERSTE Admin-Einladung beim Onboarding
 *    einer neuen Praxis an (Service-Role-Client, da noch keine
 *    Mitgliedschaft existiert, die die client-seitige RLS-Policy
 *    erfüllen könnte – die Betreiberprüfung passiert VORHER in der
 *    Server Action, s. assertPlatformAdmin()).
 */

export const STAFF_INVITE_SESSION_COOKIE = "physiocheck_staff_invite";
const STAFF_INVITE_SESSION_SECONDS = 30 * 60;
const INVITE_VALIDITY_DAYS = 7;

export type PendingStaffInvite = {
  id: string;
  token: string;
  tokenHash: string;
  email: string;
  role: "admin" | "therapist";
  practiceId: string;
  practiceName: string;
};

export type StaffInviteCreationResult = {
  id: string;
  token: string;
  link: string;
  email: string;
  role: "admin" | "therapist";
};

function generateInviteToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function inviteLink(token: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${appUrl}/staff-invite/${token}`;
}

type StaffInviteInput = { name: string; email: string; role: "admin" | "therapist" };

/** Praxisadmin lädt Mitarbeitende der eigenen Praxis ein (RLS-geprüft). */
export async function createStaffInviteAsPracticeAdmin(
  practiceId: string,
  memberId: string,
  input: StaffInviteInput
): Promise<StaffInviteCreationResult | { error: string }> {
  const supabase = await createSupabaseServerClient();
  const token = generateInviteToken();
  const tokenHash = hashInviteToken(token);
  const expiresAt = new Date(Date.now() + INVITE_VALIDITY_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("staff_invites")
    .insert({
      practice_id: practiceId,
      email: input.email.trim().toLowerCase(),
      role: input.role,
      token_hash: tokenHash,
      created_by_member_id: memberId,
      expires_at: expiresAt,
    })
    .select("id, email, role")
    .single();

  if (error || !data) {
    if (error?.code === "23505") return { error: "duplicate_pending" };
    return { error: "failed" };
  }

  const service = createSupabaseServiceClient();
  await service.from("audit_events").insert({
    practice_id: practiceId,
    event_type: "staff_invite_created",
    entity_type: "staff_invite",
    entity_id: data.id,
    metadata: { role: input.role },
  });

  return { id: data.id, token, link: inviteLink(token), email: data.email, role: data.role };
}

/**
 * Plattformadmin laedt fuer eine BESTEHENDE Praxis eine weitere
 * Mitarbeiter-Einladung ein (Ausnahmefall, z.B. Praxis ohne aktiven
 * Admin) - laeuft ueber die SECURITY-DEFINER-RPC, kein Service-Role
 * noetig, da auth.uid() ueber die eigene Sitzung korrekt aufloest.
 */
export async function createStaffInviteAsPlatformAdmin(
  practiceId: string,
  input: StaffInviteInput
): Promise<StaffInviteCreationResult | { error: string }> {
  const supabase = await createSupabaseServerClient();
  const token = generateInviteToken();
  const tokenHash = hashInviteToken(token);
  const expiresAt = new Date(Date.now() + INVITE_VALIDITY_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase.rpc("create_staff_invite_as_platform_admin", {
    p_practice_id: practiceId,
    p_email: input.email,
    p_role: input.role,
    p_token_hash: tokenHash,
    p_expires_at: expiresAt,
  });

  if (error || !data) return { error: "failed" };

  return { id: data, token, link: inviteLink(token), email: input.email.trim().toLowerCase(), role: input.role };
}

export async function listStaffInvites(practiceId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("staff_invites")
    .select("id, email, role, expires_at, created_at")
    .eq("practice_id", practiceId)
    .is("revoked_at", null)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function revokeStaffInvite(practiceId: string, inviteId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase
    .from("staff_invites")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", inviteId)
    .eq("practice_id", practiceId)
    .is("accepted_at", null);
}

/** Liest eine Einladung anhand des Klartext-Tokens aus dem Link. */
export async function inspectStaffInviteToken(token: string): Promise<PendingStaffInvite | null> {
  const tokenHash = hashInviteToken(token);
  const service = createSupabaseServiceClient();
  const { data } = await service
    .from("staff_invites")
    .select("id, email, role, practice_id, practices ( name )")
    .eq("token_hash", tokenHash)
    .is("revoked_at", null)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (!data) return null;
  return {
    id: data.id,
    token,
    tokenHash,
    email: data.email,
    role: data.role,
    practiceId: data.practice_id,
    practiceName: data.practices.name,
  };
}

export async function storeStaffInviteSession(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(STAFF_INVITE_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: STAFF_INVITE_SESSION_SECONDS,
  });
}

export async function getPendingStaffInviteFromSession(): Promise<PendingStaffInvite | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(STAFF_INVITE_SESSION_COOKIE)?.value;
  if (!token) return null;
  return inspectStaffInviteToken(token);
}

export async function clearStaffInviteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(STAFF_INVITE_SESSION_COOKIE);
}

/** Löst die aktuelle Einladung mit der Sitzung des angemeldeten Benutzers ein. */
export async function acceptPendingStaffInvite(): Promise<
  { ok: true; practiceId: string } | { ok: false; reason: string }
> {
  const pending = await getPendingStaffInviteFromSession();
  if (!pending) return { ok: false, reason: "not_found" };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("accept_staff_invite", {
    p_invite_id: pending.id,
    p_token_hash: pending.tokenHash,
  });

  if (error || !data?.[0]) {
    const reason = error?.message.includes("invite_email_mismatch")
      ? "email_mismatch"
      : "invalid";
    return { ok: false, reason };
  }

  return { ok: true, practiceId: data[0].out_practice_id };
}

/** Erneuerung: alten offenen Token widerrufen, neuen atomar anlegen. */
export async function renewStaffInvite(
  practiceId: string,
  inviteId: string
): Promise<StaffInviteCreationResult | { error: string }> {
  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase
    .from("staff_invites")
    .select("email, role")
    .eq("id", inviteId)
    .eq("practice_id", practiceId)
    .maybeSingle();
  if (!existing) return { error: "not_found" };

  const token = generateInviteToken();
  const tokenHash = hashInviteToken(token);
  const expiresAt = new Date(Date.now() + INVITE_VALIDITY_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: newId, error } = await supabase.rpc("renew_staff_invite", {
    p_invite_id: inviteId,
    p_token_hash: tokenHash,
    p_expires_at: expiresAt,
  });
  if (error || !newId) return { error: "failed" };

  return { id: newId, token, link: inviteLink(token), email: existing.email, role: existing.role };
}

/** Einfaches Rate Limit gegen Einladungs-Spam (Phase G). */
export async function isInviteCreationRateLimited(
  practiceId: string,
  windowMinutes: number,
  maxInvites: number
): Promise<boolean> {
  const service = createSupabaseServiceClient();
  const since = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
  const { count } = await service
    .from("audit_events")
    .select("id", { count: "exact", head: true })
    .eq("practice_id", practiceId)
    .in("event_type", ["staff_invite_created"])
    .gte("created_at", since);
  return (count ?? 0) >= maxInvites;
}
