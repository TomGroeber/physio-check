/**
 * Idempotentes Bootstrap-/Administrationsskript für die Betreiberrolle
 * (platform_admins). Läuft AUSSCHLIESSLICH mit dem Service-Role-Key
 * und ist bewusst NICHT auf localhost beschränkt (anders als
 * scripts/seed.ts) – Tom braucht dieses Skript auch gegen eine echte,
 * gehostete Supabase-Instanz, um sich selbst als ersten
 * Plattformadministrator einzurichten.
 *
 * Es gibt KEINEN Weg, sich über das Frontend selbst zum
 * Plattformadmin zu machen (siehe DECISIONS.md) – dieses Skript ist
 * der einzige, dokumentierte Weg.
 *
 * Aufruf:
 *   pnpm platform-admin grant <email> --yes ["Notiz"]
 *   pnpm platform-admin revoke <email> --yes
 *   pnpm platform-admin list
 *
 * Loggt niemals den Service-Role-Key, Passwörter oder Tokens - nur
 * E-Mail-Adresse, Profil-ID und Zeitstempel.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/server/db/database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY fehlen (.env.local oder Umgebung).");
  process.exit(1);
}

const db = createClient<Database>(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function usageAndExit(): never {
  console.error(
    [
      "Verwendung:",
      "  pnpm platform-admin grant <email> --yes [\"Notiz\"]",
      "  pnpm platform-admin revoke <email> --yes",
      "  pnpm platform-admin list",
      "",
      "--yes ist zwingend fuer grant/revoke (verhindert versehentliche Ausfuehrung).",
    ].join("\n")
  );
  process.exit(1);
}

async function findProfileByEmail(email: string): Promise<{ id: string; email: string } | null> {
  // auth.admin.listUsers paginiert; fuer Bootstrap-Zwecke reicht ein
  // groszuegiges perPage, echte Installationen haben anfangs wenige Konten.
  const { data, error } = await db.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw new Error(`listUsers: ${error.message}`);
  const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email.toLowerCase());
  if (!user) return null;
  return { id: user.id, email: user.email ?? email };
}

async function grant(email: string, note: string): Promise<void> {
  const profile = await findProfileByEmail(email);
  if (!profile) {
    console.error(
      `Kein Konto mit dieser E-Mail-Adresse gefunden. Die Person muss sich zuerst normal registrieren (Konto anlegen, E-Mail bestaetigen), bevor sie zum Plattformadmin ernannt werden kann.`
    );
    process.exit(1);
  }

  const { data: existing } = await db
    .from("platform_admins")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (existing) {
    console.log(`Bereits Plattformadmin: ${profile.email} (profile_id=${profile.id}). Keine Aenderung (idempotent).`);
    return;
  }

  const { error } = await db.from("platform_admins").insert({
    profile_id: profile.id,
    granted_by: "platform-admin-script",
    note,
  });
  if (error) throw new Error(`insert platform_admins: ${error.message}`);

  console.log(`Plattformadmin-Rechte erteilt: ${profile.email} (profile_id=${profile.id}) um ${new Date().toISOString()}.`);
}

async function revoke(email: string): Promise<void> {
  const profile = await findProfileByEmail(email);
  if (!profile) {
    console.error("Kein Konto mit dieser E-Mail-Adresse gefunden.");
    process.exit(1);
  }

  const { data: existing } = await db
    .from("platform_admins")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (!existing) {
    console.log(`War kein Plattformadmin: ${profile.email} (profile_id=${profile.id}). Keine Aenderung (idempotent).`);
    return;
  }

  const { error } = await db.from("platform_admins").delete().eq("profile_id", profile.id);
  if (error) throw new Error(`delete platform_admins: ${error.message}`);

  console.log(`Plattformadmin-Rechte entzogen: ${profile.email} (profile_id=${profile.id}) um ${new Date().toISOString()}.`);
}

async function list(): Promise<void> {
  const { data, error } = await db
    .from("platform_admins")
    .select("profile_id, created_at, note")
    .order("created_at");
  if (error) throw new Error(`select platform_admins: ${error.message}`);
  if (!data.length) {
    console.log("Keine Plattformadmins vorhanden.");
    return;
  }

  const { data: users } = await db.auth.admin.listUsers({ perPage: 1000 });
  for (const row of data) {
    const email = users?.users.find((u) => u.id === row.profile_id)?.email ?? "(unbekannt)";
    console.log(`${email}  seit ${row.created_at}  ${row.note ? `(${row.note})` : ""}`);
  }
}

async function main() {
  const [, , action, emailArg, ...rest] = process.argv;
  if (!action) usageAndExit();

  if (action === "list") {
    await list();
    return;
  }

  if (action !== "grant" && action !== "revoke") usageAndExit();
  if (!emailArg) usageAndExit();
  if (!rest.includes("--yes")) {
    console.error("Fehlende Bestaetigung: bitte --yes anhaengen, um fortzufahren.");
    process.exit(1);
  }

  const note = rest.filter((arg) => arg !== "--yes").join(" ").trim();

  if (action === "grant") {
    await grant(emailArg, note);
  } else {
    await revoke(emailArg);
  }
}

main().catch((error) => {
  console.error("Fehlgeschlagen:", error instanceof Error ? error.message : error);
  process.exit(1);
});
