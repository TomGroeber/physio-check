import "server-only";

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { createSupabaseServerClient } from "@/server/db/server-client";
import { createSupabaseServiceClient } from "@/server/db/service-client";
import {
  hashInviteCode,
  isInviteCodeShapeValid,
  normalizeInviteCode,
} from "@/lib/invite-code";

export const INVITE_SESSION_COOKIE = "physiocheck_invite";
const INVITE_SESSION_SECONDS = 30 * 60;
const RATE_LIMIT_WINDOW_MINUTES = 15;
const RATE_LIMIT_MAX_ATTEMPTS = 8;

type InviteSessionPayload = {
  inviteId: string;
  codeHash: string;
  expiresAt: string;
};

export type PendingInvite = {
  id: string;
  patientDisplayName: string;
  practiceId: string;
  practiceName: string;
  expiresAt: string;
  codeHash: string;
};

export type InviteInspection =
  | { status: "valid"; token: string; invite: PendingInvite }
  | { status: "invalid" }
  | { status: "rate_limited" };

function signingSecret(): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("SUPABASE_SERVICE_ROLE_KEY fehlt.");
  return secret;
}

function signatureFor(encodedPayload: string): string {
  return createHmac("sha256", signingSecret())
    .update(encodedPayload)
    .digest("base64url");
}

function createInviteSessionToken(payload: InviteSessionPayload): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${signatureFor(encoded)}`;
}

function readInviteSessionToken(token: string): InviteSessionPayload | null {
  const [encoded, providedSignature] = token.split(".");
  if (!encoded || !providedSignature) return null;

  const expectedSignature = signatureFor(encoded);
  const expected = Buffer.from(expectedSignature);
  const provided = Buffer.from(providedSignature);
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    ) as InviteSessionPayload;
    if (
      !payload.inviteId ||
      !payload.codeHash ||
      !payload.expiresAt ||
      new Date(payload.expiresAt).getTime() <= Date.now()
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

async function actorHash(): Promise<string> {
  const headerStore = await headers();
  const cookieStore = await cookies();
  const forwarded = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = forwarded ?? headerStore.get("x-real-ip") ?? "unknown";
  const userAgent = headerStore.get("user-agent") ?? "unknown";
  const clientId = cookieStore.get("physiocheck_invite_client")?.value ?? "none";

  return createHmac("sha256", signingSecret())
    .update(`${address}|${userAgent}|${clientId}`)
    .digest("hex");
}

async function recordAttempt(hash: string, successful: boolean): Promise<void> {
  const service = createSupabaseServiceClient();
  await service.from("invite_redemption_attempts").insert({
    actor_hash: hash,
    successful,
  });
}

async function isRateLimited(hash: string): Promise<boolean> {
  const service = createSupabaseServiceClient();
  const since = new Date(
    Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000
  ).toISOString();
  const { count, error } = await service
    .from("invite_redemption_attempts")
    .select("id", { count: "exact", head: true })
    .eq("actor_hash", hash)
    .gte("attempted_at", since);

  if (error) throw new Error(`Invite rate limit failed: ${error.message}`);
  return (count ?? 0) >= RATE_LIMIT_MAX_ATTEMPTS;
}

/** Prüft einen öffentlichen Code und erzeugt eine kurzlebige, signierte Sitzung. */
export async function inspectInviteCode(rawCode: string): Promise<InviteInspection> {
  const fingerprint = await actorHash();
  if (await isRateLimited(fingerprint)) return { status: "rate_limited" };

  const normalizedCode = normalizeInviteCode(rawCode);
  if (!isInviteCodeShapeValid(normalizedCode)) {
    await recordAttempt(fingerprint, false);
    return { status: "invalid" };
  }

  const codeHash = hashInviteCode(normalizedCode);
  const service = createSupabaseServiceClient();
  const { data, error } = await service
    .from("patient_invites")
    .select(
      "id, practice_id, patient_display_name, expires_at, revoked_at, used_at, practices ( name )"
    )
    .eq("code_hash", codeHash)
    .is("revoked_at", null)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  const successful = !error && Boolean(data);
  await recordAttempt(fingerprint, successful);
  if (!successful || !data) return { status: "invalid" };

  const sessionExpiresAt = new Date(
    Math.min(
      new Date(data.expires_at).getTime(),
      Date.now() + INVITE_SESSION_SECONDS * 1000
    )
  ).toISOString();

  const invite: PendingInvite = {
    id: data.id,
    patientDisplayName: data.patient_display_name,
    practiceId: data.practice_id,
    practiceName: data.practices.name,
    expiresAt: data.expires_at,
    codeHash,
  };

  return {
    status: "valid",
    invite,
    token: createInviteSessionToken({
      inviteId: data.id,
      codeHash,
      expiresAt: sessionExpiresAt,
    }),
  };
}

/** Liest die signierte Einladung erneut aus der DB; abgelaufene Tokens gelten nicht. */
export async function getPendingInvite(): Promise<PendingInvite | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(INVITE_SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = readInviteSessionToken(token);
  if (!payload) return null;

  const service = createSupabaseServiceClient();
  const { data } = await service
    .from("patient_invites")
    .select(
      "id, practice_id, patient_display_name, expires_at, practices ( name )"
    )
    .eq("id", payload.inviteId)
    .eq("code_hash", payload.codeHash)
    .is("revoked_at", null)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (!data) return null;
  return {
    id: data.id,
    patientDisplayName: data.patient_display_name,
    practiceId: data.practice_id,
    practiceName: data.practices.name,
    expiresAt: data.expires_at,
    codeHash: payload.codeHash,
  };
}

/** Löst die aktuelle Einladung mit der Sitzung des angemeldeten Benutzers ein. */
export async function redeemPendingInvite(): Promise<boolean> {
  const invite = await getPendingInvite();
  if (!invite) return false;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("redeem_patient_invite", {
    p_invite_id: invite.id,
    p_code_hash: invite.codeHash,
  });
  return !error;
}

export async function ensureInviteClientCookie(): Promise<void> {
  const cookieStore = await cookies();
  if (!cookieStore.has("physiocheck_invite_client")) {
    cookieStore.set("physiocheck_invite_client", randomUUID(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 24 * 60 * 60,
    });
  }
}

export async function storeInviteSession(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(INVITE_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: INVITE_SESSION_SECONDS,
  });
}

export async function clearInviteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(INVITE_SESSION_COOKIE);
}

