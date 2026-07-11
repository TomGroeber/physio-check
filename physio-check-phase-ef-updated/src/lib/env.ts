/**
 * Zugriff auf Umgebungsvariablen mit klaren Fehlermeldungen.
 * Öffentliche Variablen (NEXT_PUBLIC_*) dürfen im Browser landen,
 * alles andere bleibt strikt serverseitig.
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Umgebungsvariable ${name} fehlt. Bitte .env.local anhand von .env.example anlegen (siehe README).`
    );
  }
  return value;
}

export function getSupabaseUrl(): string {
  return required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function getSupabaseAnonKey(): string {
  return required(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
