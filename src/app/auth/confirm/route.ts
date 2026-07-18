import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/server/db/server-client";

/**
 * Ziel der Bestätigungs-/Wiederherstellungslinks aus E-Mails.
 * Unterstützt beide Supabase-Varianten:
 *  - token_hash + type  (verifyOtp)
 *  - code               (exchangeCodeForSession, PKCE)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const message = searchParams.get("message");
  const requestedNext = searchParams.get("next");
  // Nur interne relative Pfade erlauben; verhindert offene Redirects
  // über manipulierte Bestätigungslinks wie ?next=//fremde-domain.test.
  const next =
    requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : "/";

  const supabase = await createSupabaseServerClient();

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      const target = type === "recovery" ? "/reset-password" : next;
      return NextResponse.redirect(new URL(target, request.url));
    }
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  } else if (message) {
    // E-Mail-Änderung mit doppelter Bestätigung: Nach dem ersten der beiden
    // Links leitet Supabase ohne Code, nur mit einem Hinweis („bitte auch den
    // zweiten Link bestätigen“) hierher. Das ist kein Fehler – zurück zum
    // Ziel; das Profil zeigt den ausstehenden Stand an.
    return NextResponse.redirect(new URL(next, request.url));
  }

  return NextResponse.redirect(new URL("/auth/error", request.url));
}
