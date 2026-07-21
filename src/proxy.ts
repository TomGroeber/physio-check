import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";

/**
 * Content-Security-Policy mit Nonce (offizielles Next.js-Muster,
 * https://nextjs.org/docs/app/guides/content-security-policy):
 * Next generiert seine eigenen Hydrations-/RSC-Skripte inline; eine
 * strikte `script-src 'self'` ohne Nonce blockiert die App vollständig
 * (per Playwright-Konsolenprüfung verifiziert). Die Nonce wird pro
 * Request neu erzeugt und sowohl als Request-Header (`x-nonce`, für
 * eigenen Code) als auch im CSP-Response-Header gesetzt; Next hängt sie
 * automatisch an seine eigenen Inline-Skripte.
 */
function buildCsp(nonce: string, supabaseUrl: string): string {
  const supabaseOrigin = (() => {
    try {
      return new URL(supabaseUrl).origin;
    } catch {
      return "";
    }
  })();
  const connectSrc = ["'self'", supabaseOrigin].filter(Boolean).join(" ");
  // Übungsvideos/-vorschaubilder und Profilbilder sind signierte URLs
  // aus dem Supabase-Storage-Bucket – eine andere Origin als die
  // Website selbst. Ohne diese Freigabe fallen Bilder/Videos auf ihren
  // Leerzustand zurück (per Playwright-Regression verifiziert).
  const imgSrc = ["'self'", "data:", "blob:", supabaseOrigin].filter(Boolean).join(" ");
  const mediaSrc = ["'self'", "blob:", supabaseOrigin].filter(Boolean).join(" ");
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${imgSrc}`,
    "font-src 'self' data:",
    `connect-src ${connectSrc}`,
    `media-src ${mediaSrc}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");
}

/**
 * Next.js 16 "proxy" (früher middleware): hält die Supabase-Sitzung
 * aktuell, indem ablaufende Tokens erneuert und die Cookies an
 * Browser und Server weitergereicht werden. Setzt zusätzlich die
 * Sicherheits-Header inkl. Nonce-CSP.
 * Zugriffsschutz passiert NICHT nur hier, sondern verbindlich in den
 * Layouts/Services und per Row Level Security.
 */
export default async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce, getSupabaseUrl());

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request: { headers: requestHeaders } });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Wichtig: getUser() validiert das Token und stößt bei Bedarf das
  // Refresh an. Das Ergebnis wird hier bewusst nicht für Redirects
  // verwendet (siehe Kommentar oben).
  await supabase.auth.getUser();

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()"
  );
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );

  return response;
}

export const config = {
  matcher: [
    // Alles außer statischen Dateien und Bildern
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
