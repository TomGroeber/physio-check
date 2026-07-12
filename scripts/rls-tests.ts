/**
 * Dedizierte RLS- und Autorisierungs-Testsuite (Etappe 10).
 * Aufruf: `pnpm test:rls` (nutzt .env.local; Supabase muss laufen,
 * `pnpm seed` muss vorher gelaufen sein).
 *
 * Prüft mit echten Clients (anon key + Login), dass Mandantentrennung
 * und Patientenschutz auf Datenbankebene greifen:
 *  A) Patientin sieht/ändert ausschließlich eigene Daten
 *  B) Mitglied einer FREMDEN Praxis sieht/ändert nichts der Demo-Praxis
 *  C) Praxismitglied kann die eigene Rolle nicht eskalieren
 *  D) Unverbundenes Konto sieht nichts
 *  E) Storage: privater Bucket `patient-records` ist ohne Server nicht lesbar
 *
 * Die Fremdpraxis wird über den Service-Role-Key angelegt und am Ende
 * entfernt. NIEMALS gegen eine echte Umgebung ausführen.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/server/db/database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !anonKey || !serviceKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL / ANON_KEY / SERVICE_ROLE_KEY fehlen (.env.local).");
  process.exit(1);
}
if (!url.includes("127.0.0.1") && !url.includes("localhost")) {
  console.error("Sicherheitsstopp: RLS-Tests laufen nur gegen eine lokale Supabase-Instanz.");
  process.exit(1);
}

const PASSWORD = "PhysioDemo2026!";
const FOREIGN_PRACTICE_NAME = "RLS-Testpraxis Fremd";
const FOREIGN_THERAPIST_EMAIL = "rls-fremd-therapeut@demo.physiocheck.test";

const service = createClient<Database>(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function anonClient() {
  return createClient<Database>(url!, anonKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

let passed = 0;
let failed = 0;
function check(name: string, condition: boolean, detail = "") {
  if (condition) {
    passed += 1;
    console.log(`  ✓ ${name}`);
  } else {
    failed += 1;
    console.error(`  ✗ ${name}${detail ? ` – ${detail}` : ""}`);
  }
}

async function loginClient(email: string) {
  const client = anonClient();
  const { error } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw new Error(`Login ${email}: ${error.message}`);
  return client;
}

async function setupForeignPractice() {
  await teardownForeignPractice();
  const { data: user, error: userError } = await service.auth.admin.createUser({
    email: FOREIGN_THERAPIST_EMAIL,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: "Fritz Fremdpraxis", locale: "de" },
  });
  if (userError || !user.user) throw new Error(`foreign user: ${userError?.message}`);
  const { data: practice, error: practiceError } = await service
    .from("practices")
    .insert({ name: FOREIGN_PRACTICE_NAME, timezone: "Europe/Luxembourg" })
    .select("id")
    .single();
  if (practiceError || !practice) throw new Error(`foreign practice: ${practiceError?.message}`);
  const { error: memberError } = await service
    .from("practice_members")
    .insert({ practice_id: practice.id, profile_id: user.user.id, role: "therapist" });
  if (memberError) throw new Error(`foreign member: ${memberError.message}`);
  return practice.id;
}

async function teardownForeignPractice() {
  const { data } = await service.auth.admin.listUsers({ perPage: 1000 });
  for (const user of data?.users ?? []) {
    if (user.email === FOREIGN_THERAPIST_EMAIL) await service.auth.admin.deleteUser(user.id);
  }
  await service.from("practices").delete().eq("name", FOREIGN_PRACTICE_NAME);
}

async function main() {
  console.log("Vorbereitung: Fremdpraxis anlegen, Demo-IDs laden …");
  await setupForeignPractice();

  const { data: petraProfile } = await service
    .from("profiles")
    .select("id")
    .eq("full_name", "Petra Beispielfrau")
    .single();
  const { data: demoPractice } = await service
    .from("practices")
    .select("id")
    .eq("name", "Demo-Praxis Sonnenbrücke")
    .single();
  if (!petraProfile || !demoPractice) {
    throw new Error("Demo-Seed fehlt. Bitte zuerst `pnpm db:reset && pnpm seed` ausführen.");
  }
  const petraId = petraProfile.id;
  const practiceAId = demoPractice.id;

  // Ein Dokument mit Storage-Objekt für die Storage-/Fremdzugriffs-Proben.
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64"
  );
  const storagePath = `${practiceAId}/${petraId}/rls-test-object.png`;
  await service.storage.from("patient-records").upload(storagePath, png, {
    contentType: "image/png",
    upsert: true,
  });
  const { data: memberA } = await service
    .from("practice_members")
    .select("id")
    .eq("practice_id", practiceAId)
    .eq("role", "therapist")
    .limit(1)
    .single();
  const { data: testDocument } = await service
    .from("patient_documents")
    .insert({
      practice_id: practiceAId,
      patient_profile_id: petraId,
      title: "RLS-Testdokument",
      category: "other",
      storage_path: storagePath,
      original_name: "rls-test-object.png",
      mime_type: "image/png",
      size_bytes: png.length,
      uploaded_by: memberA!.id,
    })
    .select("id")
    .single();

  // ---------- A) Patientin ----------
  console.log("\nA) Patientin (Petra): nur eigene Daten");
  const patient = await loginClient("patientin@demo.physiocheck.test");

  for (const table of [
    "patient_documents",
    "patient_internal_profiles",
    "pinned_patients",
    "practice_waitlist_entries",
    "audit_events",
    "patient_invites",
  ] as const) {
    const { data } = await patient.from(table).select("id");
    check(`liest 0 Zeilen aus ${table}`, (data ?? []).length === 0, `bekam ${data?.length}`);
  }
  {
    const { data } = await patient.from("appointments").select("patient_profile_id");
    check(
      "appointments: ausschließlich eigene Termine",
      (data ?? []).length > 0 && (data ?? []).every((row) => row.patient_profile_id === petraId)
    );
  }
  {
    const { data } = await patient.from("treatment_authorizations").select("patient_profile_id");
    check(
      "treatment_authorizations: ausschließlich eigene Verordnungen",
      (data ?? []).length > 0 && (data ?? []).every((row) => row.patient_profile_id === petraId)
    );
  }
  {
    const { data } = await patient.from("completion_logs").select("patient_profile_id");
    check(
      "completion_logs: ausschließlich eigene Selbstauskünfte",
      (data ?? []).every((row) => row.patient_profile_id === petraId)
    );
  }
  {
    const { error, data } = await patient
      .from("profiles")
      .update({ full_name: "Gehackt" })
      .neq("id", petraId)
      .select("id");
    check("kann fremde Profile nicht ändern", Boolean(error) || (data ?? []).length === 0);
  }
  {
    const { error } = await patient
      .from("treatment_authorization_adjustments")
      .insert({ authorization_id: "00000000-0000-0000-0000-000000000001", session_delta: 99, reason: "x", created_by: "00000000-0000-0000-0000-000000000001" });
    check("kann keine Kontingent-Anpassung anlegen", Boolean(error));
  }
  {
    const { data, error } = await patient.storage.from("patient-records").download(storagePath);
    check("Storage: kann Praxisdokument nicht herunterladen", Boolean(error) && !data);
  }
  {
    const { error } = await patient.storage
      .from("patient-records")
      .createSignedUrl(storagePath, 60);
    check("Storage: kann keine signierte URL erzeugen", Boolean(error));
  }

  // ---------- B) Fremdpraxis ----------
  console.log("\nB) Mitglied einer fremden Praxis: kein Zugriff auf die Demo-Praxis");
  const foreign = await loginClient(FOREIGN_THERAPIST_EMAIL);

  for (const table of [
    "patient_practice_links",
    "patient_documents",
    "patient_internal_profiles",
    "pinned_patients",
    "practice_waitlist_entries",
    "appointment_offers",
    "appointments",
    "treatment_authorizations",
    "completion_logs",
  ] as const) {
    const { data } = await foreign.from(table).select("id");
    check(`liest 0 Zeilen aus ${table}`, (data ?? []).length === 0, `bekam ${data?.length}`);
  }
  {
    const { data } = await foreign.from("profiles").select("id").eq("id", petraId);
    check("sieht Petras Profil nicht", (data ?? []).length === 0);
  }
  {
    const { error } = await foreign.from("patient_documents").insert({
      practice_id: practiceAId,
      patient_profile_id: petraId,
      title: "Einbruch",
      category: "other",
      storage_path: "x/y/z.png",
      original_name: "z.png",
      mime_type: "image/png",
      size_bytes: 1,
      uploaded_by: memberA!.id,
    });
    check("kann kein Dokument für fremde Praxis anlegen", Boolean(error));
  }
  {
    const { error } = await foreign.from("patient_internal_profiles").insert({
      practice_id: practiceAId,
      patient_profile_id: petraId,
      content: "Einbruch",
    });
    check("kann kein Kurzprofil für fremden Patienten anlegen", Boolean(error));
  }
  {
    const { error } = await foreign.rpc("primary_authorization_for_patient", { p_patient_id: petraId });
    check("RPC primary_authorization_for_patient: abgelehnt", Boolean(error) && /not_authorized/.test(error!.message));
  }
  {
    const { error } = await foreign.rpc("list_authorization_warnings", {
      p_practice_id: practiceAId,
      p_units_threshold: 99,
      p_expiry_days: 999,
    });
    check("RPC list_authorization_warnings: abgelehnt", Boolean(error) && /not_authorized/.test(error!.message));
  }
  {
    const { error } = await foreign.rpc("set_patient_phone", {
      target_patient_id: petraId,
      new_phone: "+352 999",
    });
    check("RPC set_patient_phone: abgelehnt", Boolean(error));
  }
  {
    const { data, error } = await foreign.storage.from("patient-records").download(storagePath);
    check("Storage: kann fremdes Dokument nicht herunterladen", Boolean(error) && !data);
  }

  // ---------- C) Selbst-Eskalation ----------
  console.log("\nC) Praxismitglied: keine Selbst-Eskalation");
  const therapist = await loginClient("therapeutin@demo.physiocheck.test");
  {
    const { data } = await therapist
      .from("practice_members")
      .update({ role: "admin" })
      .eq("id", memberA!.id)
      .select("id, role");
    const { data: after } = await service
      .from("practice_members")
      .select("role")
      .eq("id", memberA!.id)
      .single();
    check(
      "Therapeutin kann die eigene Rolle nicht auf admin setzen",
      after?.role === "therapist",
      `Rolle ist jetzt ${after?.role}; Update lieferte ${data?.length ?? 0} Zeilen`
    );
  }
  {
    const { data: invites } = await therapist.from("patient_invites").select("code_hash").limit(1);
    check(
      "Einladungs-Hash ist für normale Mitglieder nicht lesbar",
      (invites ?? []).length === 0 || (invites ?? []).every((row) => !row.code_hash)
    );
  }

  // ---------- D) Unverbundenes Konto ----------
  console.log("\nD) Unverbundenes Konto (Erika): sieht nichts");
  const unconnected = await loginClient("eingeladen@demo.physiocheck.test");
  for (const table of [
    "appointments",
    "treatment_authorizations",
    "patient_documents",
    "completion_logs",
    "exercise_plans",
  ] as const) {
    const { data } = await unconnected.from(table).select("id");
    check(`liest 0 Zeilen aus ${table}`, (data ?? []).length === 0, `bekam ${data?.length}`);
  }

  // ---------- Aufräumen ----------
  console.log("\nAufräumen …");
  if (testDocument) await service.from("patient_documents").delete().eq("id", testDocument.id);
  await service.storage.from("patient-records").remove([storagePath]);
  await teardownForeignPractice();

  console.log(`\nErgebnis: ${passed} bestanden, ${failed} fehlgeschlagen`);
  if (failed > 0) process.exit(1);
}

main().catch((error) => {
  console.error("RLS-Tests abgebrochen:", error);
  process.exit(1);
});
