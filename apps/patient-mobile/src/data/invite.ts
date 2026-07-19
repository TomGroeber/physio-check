import * as Crypto from "expo-crypto";
import { isInviteCodeShapeValid, normalizeInviteCode } from "@physio-check/shared";
import { apiFetch } from "@/lib/api";
import { supabase } from "@/lib/supabase";

export type InviteCheckResult =
  | {
      ok: true;
      inviteId: string;
      practiceName: string;
      expiresAt: string;
    }
  | { ok: false; reason: "invalid" | "expired" };

/**
 * Code-Vorprüfung über den abgesicherten Endpunkt (Patienten können
 * patient_invites per RLS nicht lesen; der Server prüft Hash und
 * Ablauf mit Rate-Limit wie im Web-Einladungsfluss).
 */
export async function checkInviteCode(code: string): Promise<InviteCheckResult> {
  if (!isInviteCodeShapeValid(code)) return { ok: false, reason: "invalid" };
  try {
    const result = await apiFetch<{
      inviteId: string;
      practiceName: string;
      expiresAt: string;
    }>("/api/mobile/invite/check", {
      method: "POST",
      body: { code: normalizeInviteCode(code) },
    });
    return { ok: true, ...result };
  } catch (error) {
    if (error instanceof Error && /expired|abgelaufen/i.test(error.message))
      return { ok: false, reason: "expired" };
    return { ok: false, reason: "invalid" };
  }
}

/**
 * Einladung atomar annehmen: dieselbe RPC wie im Web. Der Hash entsteht
 * lokal (SHA-256 über den normalisierten Code) – der Klartext-Code
 * verlässt das Gerät nur für die Vorprüfung, gespeichert wird er nie.
 */
export async function redeemInvite(
  inviteId: string,
  code: string
): Promise<void> {
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    normalizeInviteCode(code)
  );
  const { error } = await supabase.rpc("redeem_patient_invite", {
    p_invite_id: inviteId,
    p_code_hash: hash,
  });
  if (error) throw new Error(error.message);
}
