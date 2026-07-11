import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";

/**
 * Next.js 16 "proxy" (früher middleware): hält die Supabase-Sitzung
 * aktuell, indem ablaufende Tokens erneuert und die Cookies an
 * Browser und Server weitergereicht werden.
 * Zugriffsschutz passiert NICHT nur hier, sondern verbindlich in den
 * Layouts/Services und per Row Level Security.
 */
export default async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
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

  return response;
}

export const config = {
  matcher: [
    // Alles außer statischen Dateien und Bildern
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
