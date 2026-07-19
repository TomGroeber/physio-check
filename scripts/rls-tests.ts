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
 *  E) Storage: private Buckets sind für Patienten/Fremdpraxen nicht direkt lesbar
 *
 * Die Fremdpraxis wird über den Service-Role-Key angelegt und am Ende
 * entfernt. NIEMALS gegen eine echte Umgebung ausführen.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/server/db/database.types";
import { hashInviteCode } from "../src/lib/invite-code";

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
const PHASE_J_PATIENT_EMAIL = "rls-phase-j-patient@demo.physiocheck.test";

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

async function deleteAuthUserByEmail(email: string) {
  const { data } = await service.auth.admin.listUsers({ perPage: 1000 });
  const user = data?.users.find((candidate) => candidate.email === email);
  if (user) await service.auth.admin.deleteUser(user.id);
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
  const foreignPracticeId = await setupForeignPractice();
  await deleteAuthUserByEmail(PHASE_J_PATIENT_EMAIL);

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
  const { data: seededPlan } = await service
    .from("exercise_plans")
    .select("id, title, current_version_id")
    .eq("practice_id", practiceAId)
    .eq("patient_profile_id", petraId)
    .eq("status", "active")
    .single();
  if (!seededPlan?.current_version_id) throw new Error("Aktiver Demo-Übungsplan fehlt.");
  const { data: seededPlanItem } = await service
    .from("exercise_plan_items")
    .select("id, exercise_id")
    .eq("plan_version_id", seededPlan.current_version_id)
    .limit(1)
    .single();
  if (!seededPlanItem) throw new Error("Demo-Übungsplan enthält keine Übung.");
  const { data: seededFeedback } = await service
    .from("completion_logs")
    .select("id, reviewed_at, reviewed_by")
    .eq("patient_profile_id", petraId)
    .limit(1)
    .single();
  if (!seededFeedback) throw new Error("Demo-Rückmeldung fehlt.");
  let publishedTestVersionId: string | null = null;
  let recordedOccurrenceId: string | null = null;
  let phaseJPatientId: string | null = null;
  let phaseJLibraryExerciseId: string | null = null;
  let phaseJLibraryCopyId: string | null = null;
  let phaseJPlanId: string | null = null;
  const phaseJInviteIds: string[] = [];

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
    .select("id, profile_id")
    .eq("practice_id", practiceAId)
    .eq("role", "therapist")
    .limit(1)
    .single();
  const { data: foreignMember } = await service
    .from("practice_members")
    .select("id")
    .eq("practice_id", foreignPracticeId)
    .limit(1)
    .single();
  if (!memberA || !foreignMember) throw new Error("RLS-Testmitglieder fehlen.");

  const { data: phaseJUser, error: phaseJUserError } = await service.auth.admin.createUser({
    email: PHASE_J_PATIENT_EMAIL,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: "Paula Phase J", locale: "de" },
  });
  if (phaseJUserError || !phaseJUser.user) {
    throw new Error(`Phase-J-Patient: ${phaseJUserError?.message}`);
  }
  phaseJPatientId = phaseJUser.user.id;
  const { error: phaseJLinkError } = await service.from("patient_practice_links").insert({
    patient_profile_id: phaseJPatientId,
    practice_id: practiceAId,
    primary_therapist_id: memberA.id,
    status: "active",
  });
  if (phaseJLinkError) throw new Error(`Phase-J-Praxislink: ${phaseJLinkError.message}`);
  const { data: testNotification, error: testNotificationError } = await service
    .from("notifications")
    .insert({
      recipient_profile_id: petraId,
      type: "exercise_plan_published",
      title: "RLS-Testhinweis",
      body: "Datensparsamer lokaler Test",
    })
    .select("id")
    .single();
  if (testNotificationError || !testNotification) {
    throw new Error(`RLS-Testhinweis: ${testNotificationError?.message}`);
  }
  const { data: testExercise, error: testExerciseError } = await service
    .from("exercises")
    .insert({
      practice_id: practiceAId,
      created_by: memberA!.id,
      title: "RLS-Testübung",
      description: "Nur für die lokale RLS-Prüfung.",
    })
    .select("id")
    .single();
  if (testExerciseError || !testExercise) {
    throw new Error(`RLS-Testübung: ${testExerciseError?.message}`);
  }
  const actualExerciseStoragePath = `${practiceAId}/${testExercise.id}/rls-test-image.png`;
  await service.storage.from("exercise-media").upload(actualExerciseStoragePath, png, {
    contentType: "image/png",
    upsert: true,
  });
  const { data: testExerciseMedia, error: testMediaError } = await service
    .from("exercise_media")
    .insert({
      exercise_id: testExercise.id,
      kind: "fallback_image",
      storage_path: actualExerciseStoragePath,
      mime_type: "image/png",
      size_bytes: png.length,
    })
    .select("id")
    .single();
  if (testMediaError || !testExerciseMedia) {
    throw new Error(`RLS-Testmedium: ${testMediaError?.message}`);
  }
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
    "patient_calendar_colors",
    "practice_waitlist_entries",
    "audit_events",
    "patient_invites",
  ] as const) {
    const { data } = await patient.from(table).select("id");
    check(`liest 0 Zeilen aus ${table}`, (data ?? []).length === 0, `bekam ${data?.length}`);
  }
  {
    const { error } = await patient.from("patient_calendar_colors").insert({
      practice_id: practiceAId,
      patient_profile_id: petraId,
      color: "rose",
    });
    check("kann sich selbst keine Kalenderfarbe zuweisen", Boolean(error));
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
  {
    const { data } = await patient
      .from("exercise_media")
      .select("id")
      .eq("id", testExerciseMedia.id);
    check("sieht kein Medium einer nicht zugewiesenen Übung", (data ?? []).length === 0);
  }
  {
    const { data, error } = await patient.storage
      .from("exercise-media")
      .download(actualExerciseStoragePath);
    check("Storage: kann Übungsmedium nicht direkt herunterladen", Boolean(error) && !data);
  }
  {
    const { error } = await patient.rpc("publish_exercise_plan", {
      p_practice_id: practiceAId,
      p_patient_id: petraId,
      p_title: "Unzulässiger Patientenplan",
      p_change_note: "",
      p_items: [],
      p_notification_title: "Test",
      p_notification_body: "Test",
    });
    check("RPC publish_exercise_plan: Patientin wird abgelehnt", Boolean(error));
  }
  {
    const { error } = await patient.from("completion_logs").insert({
      patient_profile_id: petraId,
      plan_item_id: seededPlanItem.id,
      performed_on: new Date().toISOString().slice(0, 10),
      occurrence_index: 99,
      status: "completed",
    });
    check("kann Durchgänge nicht direkt mit erfundener Nummer einfügen", Boolean(error));
  }
  {
    const first = await patient.rpc("record_exercise_occurrence", {
      p_plan_item_id: seededPlanItem.id,
      p_status: "partial",
      p_sets_completed: 1,
      p_pain_before: null,
      p_pain_after: null,
      p_note: "Lokaler RLS-Test",
    });
    recordedOccurrenceId = first.data ?? null;
    check("RPC dokumentiert einen eigenen fälligen Durchgang", !first.error && Boolean(first.data));
    const duplicate = await patient.rpc("record_exercise_occurrence", {
      p_plan_item_id: seededPlanItem.id,
      p_status: "completed",
      p_sets_completed: 1,
      p_pain_before: null,
      p_pain_after: null,
      p_note: "Darf nicht doppelt entstehen",
    });
    check("RPC verhindert unbeabsichtigten zusätzlichen Tagesdurchgang", Boolean(duplicate.error));
  }
  {
    const { error } = await patient.rpc("mark_completion_log_reviewed", {
      p_log_id: seededFeedback.id,
    });
    check("Patientin kann Praxis-Lesestatus nicht setzen", Boolean(error));
  }
  {
    const { error } = await patient.from("patient_reminder_preferences").upsert({
      profile_id: petraId,
      exercise_reminders_enabled: false,
      plan_updates_enabled: true,
      quiet_start: "21:00",
      quiet_end: "07:00",
    });
    const { data } = await patient
      .from("patient_reminder_preferences")
      .select("profile_id, exercise_reminders_enabled")
      .eq("profile_id", petraId)
      .single();
    check(
      "kann ausschließlich eigene Erinnerungseinstellungen pflegen",
      !error && data?.profile_id === petraId && data.exercise_reminders_enabled === false
    );
  }
  {
    const { error } = await patient
      .from("notifications")
      .update({ title: "Manipuliert" })
      .eq("id", testNotification.id);
    check("kann serverseitigen Benachrichtigungsinhalt nicht ändern", Boolean(error));
  }
  {
    const { error } = await patient.rpc("mark_notification_read", {
      p_notification_id: testNotification.id,
    });
    const { data } = await service
      .from("notifications")
      .select("read_at, title")
      .eq("id", testNotification.id)
      .single();
    check(
      "kann eigenen Hinweis ausschließlich als gelesen markieren",
      !error && Boolean(data?.read_at) && data?.title === "RLS-Testhinweis"
    );
  }

  // ---------- B) Fremdpraxis ----------
  console.log("\nB) Mitglied einer fremden Praxis: kein Zugriff auf die Demo-Praxis");
  const foreign = await loginClient(FOREIGN_THERAPIST_EMAIL);

  for (const table of [
    "patient_practice_links",
    "patient_documents",
    "patient_internal_profiles",
    "pinned_patients",
    "patient_calendar_colors",
    "practice_waitlist_entries",
    "appointment_offers",
    "appointments",
    "treatment_authorizations",
    "completion_logs",
    "exercises",
    "exercise_media",
  ] as const) {
    const { data } = await foreign.from(table).select("id");
    check(`liest 0 Zeilen aus ${table}`, (data ?? []).length === 0, `bekam ${data?.length}`);
  }
  {
    // Auch mit der EIGENEN practice_id scheitert die Zuordnung, weil
    // member_can_view_patient eine aktive Verbindung zu Petra verlangt.
    const { error } = await foreign.from("patient_calendar_colors").insert({
      practice_id: foreignPracticeId,
      patient_profile_id: petraId,
      color: "violet",
    });
    check("kann fremdem Patienten keine Kalenderfarbe zuweisen", Boolean(error));
  }
  {
    const { data } = await foreign.from("profiles").select("id").eq("id", petraId);
    check("sieht Petras Profil nicht", (data ?? []).length === 0);
  }
  {
    const { data, error } = await foreign
      .from("exercises")
      .update({ title: "Fremd manipuliert" })
      .eq("id", testExercise.id)
      .select("id");
    const { data: unchanged } = await service
      .from("exercises")
      .select("title")
      .eq("id", testExercise.id)
      .single();
    check(
      "kann Übung der fremden Praxis weder sehen noch ändern",
      (Boolean(error) || (data ?? []).length === 0) && unchanged?.title === "RLS-Testübung"
    );
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
  {
    const { data, error } = await foreign.storage
      .from("exercise-media")
      .download(actualExerciseStoragePath);
    check("Storage: kann fremdes Übungsmedium nicht herunterladen", Boolean(error) && !data);
  }
  {
    const { error } = await foreign.rpc("publish_exercise_plan", {
      p_practice_id: practiceAId,
      p_patient_id: petraId,
      p_title: "Fremder Plan",
      p_change_note: "",
      p_items: [],
      p_notification_title: "Test",
      p_notification_body: "Test",
    });
    check("RPC publish_exercise_plan: Fremdpraxis wird abgelehnt", Boolean(error));
  }
  {
    const { error } = await foreign.rpc("record_exercise_occurrence", {
      p_plan_item_id: seededPlanItem.id,
      p_status: "completed",
      p_sets_completed: null,
      p_pain_before: null,
      p_pain_after: null,
      p_note: "",
    });
    check("RPC record_exercise_occurrence: Fremdpraxis wird abgelehnt", Boolean(error));
  }
  {
    const { error } = await foreign.rpc("mark_completion_log_reviewed", {
      p_log_id: seededFeedback.id,
    });
    check("RPC mark_completion_log_reviewed: Fremdpraxis wird abgelehnt", Boolean(error));
  }
  {
    const { data } = await foreign
      .from("patient_reminder_preferences")
      .select("profile_id")
      .eq("profile_id", petraId);
    check("sieht keine Erinnerungseinstellungen der Patientin", (data ?? []).length === 0);
  }
  {
    const { error } = await foreign.rpc("mark_notification_read", {
      p_notification_id: testNotification.id,
    });
    check("kann Patientenhinweis nicht als gelesen markieren", Boolean(error));
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
  {
    const { error } = await therapist.from("patient_calendar_colors").upsert(
      { practice_id: practiceAId, patient_profile_id: petraId, color: "indigo" },
      { onConflict: "practice_id,patient_profile_id" }
    );
    const { data: after } = await therapist
      .from("patient_calendar_colors")
      .select("color")
      .eq("practice_id", practiceAId)
      .eq("patient_profile_id", petraId)
      .maybeSingle();
    check(
      "Kalenderfarbe: Mitglied setzt Farbe der verbundenen Patientin",
      !error && after?.color === "indigo"
    );
    // Seed-Stand wiederherstellen, damit Folgeläufe deterministisch bleiben.
    await therapist.from("patient_calendar_colors").upsert(
      { practice_id: practiceAId, patient_profile_id: petraId, color: "teal" },
      { onConflict: "practice_id,patient_profile_id" }
    );
  }
  {
    const created = await therapist
      .from("exercises")
      .insert({
        practice_id: practiceAId,
        created_by: memberA.id,
        title: "Phase-J-Bibliothekstest",
        description: "Fiktiver lokaler Integrationstest",
        category: "Test",
      })
      .select("id, title")
      .single();
    phaseJLibraryExerciseId = created.data?.id ?? null;
    check("Übungsbibliothek: legt eine Übung an", !created.error && Boolean(created.data));

    const updated = phaseJLibraryExerciseId
      ? await therapist
          .from("exercises")
          .update({ title: "Phase-J-Bibliothekstest bearbeitet", default_sets: 4 })
          .eq("id", phaseJLibraryExerciseId)
          .select("id, title, default_sets")
          .single()
      : { data: null, error: new Error("create failed") };
    check(
      "Übungsbibliothek: bearbeitet patientenunabhängige Standardwerte",
      !updated.error &&
        updated.data?.title === "Phase-J-Bibliothekstest bearbeitet" &&
        updated.data.default_sets === 4
    );

    const duplicated = phaseJLibraryExerciseId
      ? await therapist
          .from("exercises")
          .insert({
            practice_id: practiceAId,
            created_by: memberA.id,
            title: "Phase-J-Bibliothekstest bearbeitet (Kopie)",
            description: "Fiktiver lokaler Integrationstest",
            category: "Test",
            default_sets: 4,
          })
          .select("id, title, default_sets")
          .single()
      : { data: null, error: new Error("create failed") };
    phaseJLibraryCopyId = duplicated.data?.id ?? null;
    check(
      "Übungsbibliothek: dupliziert Werte in eine neue ID",
      !duplicated.error &&
        Boolean(phaseJLibraryCopyId) &&
        phaseJLibraryCopyId !== phaseJLibraryExerciseId &&
        duplicated.data?.default_sets === 4
    );

    const archived = phaseJLibraryCopyId
      ? await therapist
          .from("exercises")
          .update({ archived_at: new Date().toISOString() })
          .eq("id", phaseJLibraryCopyId)
          .select("id, archived_at")
          .single()
      : { data: null, error: new Error("duplicate failed") };
    check(
      "Übungsbibliothek: archiviert statt zu löschen",
      !archived.error && Boolean(archived.data?.archived_at)
    );

    const destructiveDelete = await therapist
      .from("exercises")
      .delete()
      .eq("id", seededPlanItem.exercise_id)
      .select("id");
    const { data: referencedExercise } = await service
      .from("exercises")
      .select("id")
      .eq("id", seededPlanItem.exercise_id)
      .single();
    check(
      "referenzierte Übung kann nicht destruktiv gelöscht werden",
      (Boolean(destructiveDelete.error) || (destructiveDelete.data ?? []).length === 0) &&
        referencedExercise?.id === seededPlanItem.exercise_id
    );
  }
  {
    const { error } = await therapist.rpc("mark_completion_log_reviewed", {
      p_log_id: seededFeedback.id,
    });
    const { data: reviewed } = await service
      .from("completion_logs")
      .select("reviewed_at, reviewed_by")
      .eq("id", seededFeedback.id)
      .single();
    check(
      "eigene Praxis kann Rückmeldung als gelesen markieren",
      !error && Boolean(reviewed?.reviewed_at) && Boolean(reviewed?.reviewed_by)
    );
  }
  {
    const { error } = await therapist.from("exercise_plan_versions").insert({
      plan_id: seededPlan.id,
      version_number: 999,
      change_note: "Direkter Schreibversuch",
    });
    check("kann Planversionen nicht direkt und halb-fertig anlegen", Boolean(error));
  }
  {
    const { data, error } = await therapist.rpc("publish_exercise_plan", {
      p_practice_id: practiceAId,
      p_patient_id: petraId,
      p_title: "RLS-Testplan",
      p_change_note: "Atomare Testversion",
      p_items: [
        {
          exercise_id: seededPlanItem.exercise_id,
          start_date: new Date().toISOString().slice(0, 10),
          end_date: null,
          schedule: {
            mode: "weekdays",
            weekdays: [1, 3, 5],
            times_per_day: 2,
            preferred_times: ["08:00", "18:00"],
          },
          sets: 3,
          repetitions: 10,
          hold_seconds: null,
          total_duration_seconds: null,
          rest_seconds: 30,
          note: "",
        },
      ],
      p_notification_title: "Testplan aktualisiert",
      p_notification_body: "Lokaler RLS-Test",
    });
    check("RPC veröffentlicht gültige Planversion für eigene Praxis", !error && data === seededPlan.id);
    const { data: afterPublish } = await service
      .from("exercise_plans")
      .select("current_version_id")
      .eq("id", seededPlan.id)
      .single();
    publishedTestVersionId = afterPublish?.current_version_id ?? null;
    check(
      "veröffentlichte Version ersetzt den aktuellen Zeiger atomar",
      Boolean(publishedTestVersionId) && publishedTestVersionId !== seededPlan.current_version_id
    );
    const { data: historicalLog } = await patient
      .from("completion_logs")
      .select("id, plan_item_id, prescription_snapshot")
      .eq("id", seededFeedback.id)
      .single();
    check(
      "alter Completion-Log bleibt nach neuer Planversion lesbar und unverändert zugeordnet",
      historicalLog?.id === seededFeedback.id &&
        Boolean(historicalLog.plan_item_id) &&
        Boolean(historicalLog.prescription_snapshot)
    );
  }
  {
    const firstPublication = await therapist.rpc("publish_exercise_plan", {
      p_practice_id: practiceAId,
      p_patient_id: phaseJPatientId!,
      p_title: "Phase-J-Neuanlage",
      p_change_note: "Erste Version",
      p_items: [
        {
          exercise_id: testExercise.id,
          start_date: "2026-08-01",
          end_date: "2026-09-15",
          schedule: {
            mode: "weekdays",
            weekdays: [1, 3, 5],
            times_per_day: 3,
            preferred_times: ["08:00", "13:00", "18:00"],
          },
          sets: 4,
          repetitions: 12,
          hold_seconds: null,
          total_duration_seconds: null,
          rest_seconds: 45,
          note: "Patientenspezifische Vorgabe",
        },
      ],
      p_notification_title: "Testplan aktualisiert",
      p_notification_body: "Datensparsamer lokaler Test",
    });
    phaseJPlanId = firstPublication.data ?? null;
    const { data: firstPlan } = phaseJPlanId
      ? await service
          .from("exercise_plans")
          .select("id, current_version_id, status")
          .eq("id", phaseJPlanId)
          .single()
      : { data: null };
    const firstVersionId = firstPlan?.current_version_id ?? null;
    const { data: firstItem } = firstVersionId
      ? await service
          .from("exercise_plan_items")
          .select("start_date, end_date, schedule, sets, repetitions, note")
          .eq("plan_version_id", firstVersionId)
          .single()
      : { data: null };
    check(
      "Pläne: legt einen neuen aktiven Plan mit erster Version an",
      !firstPublication.error && Boolean(phaseJPlanId) && firstPlan?.status === "active"
    );
    check(
      "Pläne: speichert patientenspezifische Werte, Zeitraum, Wochentage und 3× täglich",
      firstItem?.start_date === "2026-08-01" &&
        firstItem.end_date === "2026-09-15" &&
        firstItem.sets === 4 &&
        firstItem.repetitions === 12 &&
        firstItem.note === "Patientenspezifische Vorgabe" &&
        JSON.stringify(firstItem.schedule).includes('"times_per_day":3')
    );

    const secondPublication = await therapist.rpc("publish_exercise_plan", {
      p_practice_id: practiceAId,
      p_patient_id: phaseJPatientId!,
      p_title: "Phase-J-Neuanlage",
      p_change_note: "Flexible zweite Version",
      p_items: [
        {
          exercise_id: testExercise.id,
          start_date: "2026-08-02",
          end_date: null,
          schedule: {
            mode: "times_per_week",
            times_per_week: 3,
            times_per_day: 1,
            preferred_times: ["09:00"],
          },
          sets: 2,
          repetitions: 8,
          hold_seconds: null,
          total_duration_seconds: null,
          rest_seconds: 30,
          note: "Flexible Woche",
        },
      ],
      p_notification_title: "Testplan aktualisiert",
      p_notification_body: "Datensparsamer lokaler Test",
    });
    const { data: secondPlan } = await service
      .from("exercise_plans")
      .select("current_version_id")
      .eq("id", phaseJPlanId!)
      .single();
    const { data: versions } = await service
      .from("exercise_plan_versions")
      .select("id, version_number")
      .eq("plan_id", phaseJPlanId!)
      .order("version_number");
    const { data: activePlans, count: activePlanCount } = await service
      .from("exercise_plans")
      .select("id", { count: "exact" })
      .eq("practice_id", practiceAId)
      .eq("patient_profile_id", phaseJPatientId!)
      .eq("status", "active");
    const { data: secondItem } = secondPlan?.current_version_id
      ? await service
          .from("exercise_plan_items")
          .select("schedule, sets")
          .eq("plan_version_id", secondPlan.current_version_id)
          .single()
      : { data: null };
    check(
      "Pläne: neue Veröffentlichung erzeugt genau eine neue aktuelle Version",
      !secondPublication.error &&
        versions?.length === 2 &&
        versions[0]?.id === firstVersionId &&
        secondPlan?.current_version_id === versions[1]?.id &&
        secondPlan.current_version_id !== firstVersionId
    );
    check(
      "Pläne: alte Version bleibt erhalten und nur ein Plan ist aktuell",
      (activePlanCount ?? activePlans?.length) === 1 &&
        versions?.some((version) => version.id === firstVersionId) === true
    );
    check(
      "Pläne: N-mal pro Woche bleibt typisiert in der neuen Version",
      secondItem?.sets === 2 &&
        JSON.stringify(secondItem.schedule).includes('"times_per_week":3')
    );
  }
  {
    const { count: beforeCount } = await service
      .from("exercise_plan_versions")
      .select("id", { count: "exact", head: true })
      .eq("plan_id", seededPlan.id);
    const { error } = await therapist.rpc("publish_exercise_plan", {
      p_practice_id: practiceAId,
      p_patient_id: petraId,
      p_title: "Ungültiger Plan",
      p_change_note: "Muss zurückrollen",
      p_items: [
        {
          exercise_id: seededPlanItem.exercise_id,
          start_date: new Date().toISOString().slice(0, 10),
          end_date: null,
          schedule: { mode: "weekdays", weekdays: [], times_per_day: 2, preferred_times: [] },
          sets: 3,
          repetitions: 10,
          hold_seconds: null,
          total_duration_seconds: null,
          rest_seconds: 30,
          note: "",
        },
      ],
      p_notification_title: "Test",
      p_notification_body: "Test",
    });
    const { count: afterCount } = await service
      .from("exercise_plan_versions")
      .select("id", { count: "exact", head: true })
      .eq("plan_id", seededPlan.id);
    check("ungültige Veröffentlichung wird vollständig zurückgerollt", Boolean(error) && beforeCount === afterCount);
  }

  // ---------- Phase J: Einladungszustände und Praxiswechsel ----------
  console.log("\nC2) Einladungszustände und bestätigter Praxiswechsel");
  const phaseJPatient = await loginClient(PHASE_J_PATIENT_EMAIL);
  const phaseJInviteHashes = [
    "EXPR-TEST-AB23",
    "REVK-TEST-AB23",
    "USED-TEST-AB23",
    "SWCH-TEST-AB23",
    "BACK-TEST-AB23",
  ].map(hashInviteCode);
  await service.from("patient_invites").delete().in("code_hash", phaseJInviteHashes);
  const inviteFixtures = [
    {
      key: "expired",
      practice_id: foreignPracticeId,
      created_by: foreignMember.id,
      patient_display_name: "Abgelaufene Einladung",
      code_hash: hashInviteCode("EXPR-TEST-AB23"),
      expires_at: new Date(Date.now() - 60_000).toISOString(),
      revoked_at: null,
      used_at: null,
      used_by_profile_id: null,
    },
    {
      key: "revoked",
      practice_id: foreignPracticeId,
      created_by: foreignMember.id,
      patient_display_name: "Widerrufene Einladung",
      code_hash: hashInviteCode("REVK-TEST-AB23"),
      expires_at: new Date(Date.now() + 3_600_000).toISOString(),
      revoked_at: new Date().toISOString(),
      used_at: null,
      used_by_profile_id: null,
    },
    {
      key: "used",
      practice_id: foreignPracticeId,
      created_by: foreignMember.id,
      patient_display_name: "Verbrauchte Einladung",
      code_hash: hashInviteCode("USED-TEST-AB23"),
      expires_at: new Date(Date.now() + 3_600_000).toISOString(),
      revoked_at: null,
      used_at: new Date().toISOString(),
      used_by_profile_id: petraId,
    },
    {
      key: "switch",
      practice_id: foreignPracticeId,
      created_by: foreignMember.id,
      patient_display_name: "Praxiswechsel",
      code_hash: hashInviteCode("SWCH-TEST-AB23"),
      expires_at: new Date(Date.now() + 3_600_000).toISOString(),
      revoked_at: null,
      used_at: null,
      used_by_profile_id: null,
    },
    {
      key: "return",
      practice_id: practiceAId,
      created_by: memberA.id,
      patient_display_name: "Rückwechsel",
      code_hash: hashInviteCode("BACK-TEST-AB23"),
      expires_at: new Date(Date.now() + 3_600_000).toISOString(),
      revoked_at: null,
      used_at: null,
      used_by_profile_id: null,
    },
  ] as const;
  const { data: insertedInvites, error: insertedInvitesError } = await service
    .from("patient_invites")
    .insert(
      inviteFixtures.map((fixture) => ({
        practice_id: fixture.practice_id,
        created_by: fixture.created_by,
        patient_display_name: fixture.patient_display_name,
        code_hash: fixture.code_hash,
        expires_at: fixture.expires_at,
        revoked_at: fixture.revoked_at,
        used_at: fixture.used_at,
        used_by_profile_id: fixture.used_by_profile_id,
      }))
    )
    .select("id, patient_display_name, code_hash, used_at");
  if (insertedInvitesError || !insertedInvites) {
    throw new Error(`Phase-J-Einladungen: ${insertedInvitesError?.message}`);
  }
  phaseJInviteIds.push(...insertedInvites.map((invite) => invite.id));
  const inviteByName = (name: string) =>
    insertedInvites.find((invite) => invite.patient_display_name === name)!;

  for (const [label, fixtureName] of [
    ["abgelaufenen", "Abgelaufene Einladung"],
    ["widerrufenen", "Widerrufene Einladung"],
    ["bereits verwendeten", "Verbrauchte Einladung"],
  ] as const) {
    const invite = inviteByName(fixtureName);
    const { error } = await phaseJPatient.rpc("redeem_patient_invite", {
      p_invite_id: invite.id,
      p_code_hash: invite.code_hash,
    });
    check(`Einladung: lehnt ${label} Code ab`, Boolean(error));
  }

  const switchInvite = inviteByName("Praxiswechsel");
  const switchResult = await phaseJPatient.rpc("redeem_patient_invite", {
    p_invite_id: switchInvite.id,
    p_code_hash: switchInvite.code_hash,
  });
  const { data: linksAfterSwitch } = await service
    .from("patient_practice_links")
    .select("practice_id, status, ended_at")
    .eq("patient_profile_id", phaseJPatientId!);
  const { data: consumedSwitchInvite } = await service
    .from("patient_invites")
    .select("used_at, used_by_profile_id")
    .eq("id", switchInvite.id)
    .single();
  check(
    "Einladung: bestätigter Praxiswechsel beendet alten und aktiviert neuen Link",
    !switchResult.error &&
      linksAfterSwitch?.some(
        (link) => link.practice_id === practiceAId && link.status === "ended" && Boolean(link.ended_at)
      ) === true &&
      linksAfterSwitch?.some(
        (link) => link.practice_id === foreignPracticeId && link.status === "active"
      ) === true
  );
  check(
    "Einladung: Code wird erst nach erfolgreicher Verbindung verbraucht",
    Boolean(consumedSwitchInvite?.used_at) &&
      consumedSwitchInvite?.used_by_profile_id === phaseJPatientId
  );

  const returnInvite = inviteByName("Rückwechsel");
  const wrongHash = await phaseJPatient.rpc("redeem_patient_invite", {
    p_invite_id: returnInvite.id,
    p_code_hash: hashInviteCode("WRNG-TEST-AB23"),
  });
  const { data: afterWrongHash } = await service
    .from("patient_invites")
    .select("used_at")
    .eq("id", returnInvite.id)
    .single();
  check(
    "Einladung: fehlgeschlagene Einlösung verbraucht den Code nicht",
    Boolean(wrongHash.error) && !afterWrongHash?.used_at
  );
  const returnResult = await phaseJPatient.rpc("redeem_patient_invite", {
    p_invite_id: returnInvite.id,
    p_code_hash: returnInvite.code_hash,
  });
  check("Einladung: derselbe unverbrauchte Code kann danach korrekt eingelöst werden", !returnResult.error);

  // ---------- D) Unverbundenes Konto ----------
  console.log("\nD) Unverbundenes Konto (Erika): sieht nichts");
  const unconnected = await loginClient("eingeladen@demo.physiocheck.test");
  for (const table of [
    "appointments",
    "treatment_authorizations",
    "patient_documents",
    "completion_logs",
    "exercise_plans",
    "patient_calendar_colors",
  ] as const) {
    const { data } = await unconnected.from(table).select("id");
    check(`liest 0 Zeilen aus ${table}`, (data ?? []).length === 0, `bekam ${data?.length}`);
  }

  // ---------- E) Profilbilder ----------
  console.log("\nE) Profilbilder: nur selbst und aktuell verbundene Praxis");
  const petraAvatarPath = `${petraId}/rls-avatar.png`;
  await service.storage.from("patient-avatars").upload(petraAvatarPath, png, {
    contentType: "image/png",
    upsert: true,
  });
  await service.from("profiles").update({ avatar_path: petraAvatarPath }).eq("id", petraId);
  {
    const { data, error } = await patient.storage
      .from("patient-avatars")
      .download(petraAvatarPath);
    check("Patientin lädt das eigene Profilbild", !error && Boolean(data));
  }
  {
    const { data, error } = await therapist.storage
      .from("patient-avatars")
      .download(petraAvatarPath);
    check("aktuell verbundene Praxis sieht das Profilbild", !error && Boolean(data));
  }
  {
    const { data, error } = await foreign.storage
      .from("patient-avatars")
      .download(petraAvatarPath);
    check("fremde Praxis sieht das Profilbild nicht", Boolean(error) && !data);
  }
  {
    const { data, error } = await unconnected.storage
      .from("patient-avatars")
      .download(petraAvatarPath);
    check("anderes Patientenkonto sieht das Profilbild nicht", Boolean(error) && !data);
  }
  {
    const { data, error } = await anonClient()
      .storage.from("patient-avatars")
      .download(petraAvatarPath);
    check("nicht angemeldete Personen erhalten keinen Zugriff", Boolean(error) && !data);
  }
  {
    const { error } = await patient.storage
      .from("patient-avatars")
      .upload(`${petraId}/direct-upload.png`, png, { contentType: "image/png" });
    check("direkter Client-Upload in den Avatar-Bucket ist gesperrt", Boolean(error));
  }
  {
    await patient.storage.from("patient-avatars").remove([petraAvatarPath]);
    const { data: still } = await service.storage
      .from("patient-avatars")
      .info(petraAvatarPath);
    check("direktes Client-Löschen im Avatar-Bucket ist gesperrt", Boolean(still));
  }
  {
    const { error } = await patient
      .from("profiles")
      .update({ avatar_path: "fremder-ordner/bild.png" })
      .eq("id", petraId);
    const { data: after } = await service
      .from("profiles")
      .select("avatar_path")
      .eq("id", petraId)
      .single();
    check(
      "avatar_path ist für Clients nicht direkt beschreibbar",
      Boolean(error) && after?.avatar_path === petraAvatarPath
    );
  }
  // Nach dem C2-Ablauf ist die Phase-J-Patientin wieder aktiv mit der
  // Demo-Praxis verbunden; die Fremdpraxis ist eine EHEMALIGE Praxis.
  const phaseJAvatarPath = `${phaseJPatientId}/rls-avatar.png`;
  await service.storage.from("patient-avatars").upload(phaseJAvatarPath, png, {
    contentType: "image/png",
    upsert: true,
  });
  {
    const { data, error } = await foreign.storage
      .from("patient-avatars")
      .download(phaseJAvatarPath);
    check(
      "ehemalige Praxis sieht das Profilbild nach dem Praxiswechsel nicht",
      Boolean(error) && !data
    );
  }
  {
    const { data, error } = await therapist.storage
      .from("patient-avatars")
      .download(phaseJAvatarPath);
    check("aktuell verbundene Praxis sieht das Bild nach dem Rückwechsel", !error && Boolean(data));
  }

  // ---------- Aufräumen ----------
  console.log("\nAufräumen …");
  await service.from("profiles").update({ avatar_path: null }).eq("id", petraId);
  await service.storage.from("patient-avatars").remove([petraAvatarPath, phaseJAvatarPath]);
  if (recordedOccurrenceId) {
    await service.from("completion_logs").delete().eq("id", recordedOccurrenceId);
  }
  await service
    .from("completion_logs")
    .update({ reviewed_at: seededFeedback.reviewed_at, reviewed_by: seededFeedback.reviewed_by })
    .eq("id", seededFeedback.id);
  if (publishedTestVersionId) {
    await service
      .from("exercise_plans")
      .update({ current_version_id: seededPlan.current_version_id, title: seededPlan.title })
      .eq("id", seededPlan.id);
    await service.from("exercise_plan_versions").delete().eq("id", publishedTestVersionId);
  }
  if (testDocument) await service.from("patient_documents").delete().eq("id", testDocument.id);
  await service.from("patient_reminder_preferences").delete().eq("profile_id", petraId);
  await service.from("notifications").delete().eq("id", testNotification.id);
  if (phaseJInviteIds.length > 0) {
    await service.from("patient_invites").delete().in("id", phaseJInviteIds);
  }
  if (phaseJPatientId) await deleteAuthUserByEmail(PHASE_J_PATIENT_EMAIL);
  if (phaseJLibraryCopyId) {
    await service.from("exercises").delete().eq("id", phaseJLibraryCopyId);
  }
  if (phaseJLibraryExerciseId) {
    await service.from("exercises").delete().eq("id", phaseJLibraryExerciseId);
  }
  await service.storage.from("patient-records").remove([storagePath]);
  await service.storage.from("exercise-media").remove([actualExerciseStoragePath]);
  await service.from("exercises").delete().eq("id", testExercise.id);
  await teardownForeignPractice();

  console.log(`\nErgebnis: ${passed} bestanden, ${failed} fehlgeschlagen`);
  if (failed > 0) process.exit(1);
}

main().catch((error) => {
  console.error("RLS-Tests abgebrochen:", error);
  process.exit(1);
});
