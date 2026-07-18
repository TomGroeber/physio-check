/**
 * Demo-Seed für die lokale Entwicklung.
 * Aufruf: `pnpm seed` (nutzt .env.local; Supabase muss laufen).
 *
 * Legt eindeutig fiktive Demo-Daten an und ist wiederholbar: vorhandene
 * Demo-Konten und die Demo-Praxis werden vorher entfernt.
 * NIEMALS gegen eine echte Umgebung ausführen.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/server/db/database.types";
import { hashInviteCode } from "../src/lib/invite-code";

const DEMO_PRACTICE_NAME = "Demo-Praxis Sonnenbrücke";
const DEMO_PASSWORD = "PhysioDemo2026!";
const DEMO_USERS = [
  { email: "therapeutin@demo.physiocheck.test", fullName: "Tina Beispiel", kind: "therapist" as const },
  { email: "admin@demo.physiocheck.test", fullName: "Paul Muster", kind: "admin" as const },
  { email: "patientin@demo.physiocheck.test", fullName: "Petra Beispielfrau", kind: "patient" as const },
  { email: "eingeladen@demo.physiocheck.test", fullName: "Erika Einladung", kind: "invitee" as const },
];

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY fehlen (.env.local).");
  process.exit(1);
}
if (!url.includes("127.0.0.1") && !url.includes("localhost")) {
  console.error("Sicherheitsstopp: Seed läuft nur gegen eine lokale Supabase-Instanz.");
  process.exit(1);
}

const db = createClient<Database>(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function removeExistingDemoData() {
  // Einladungen blockieren über `patient_invites.created_by` (NO ACTION auf
  // practice_members) sowohl das Löschen der Praxis als auch der
  // Demo-Benutzer – deshalb zuerst ausdrücklich entfernen. Fehler werden
  // nie verschluckt, sonst scheitert der Seed erst später unverständlich.
  const { data: demoPractice } = await db
    .from("practices")
    .select("id")
    .eq("name", DEMO_PRACTICE_NAME)
    .maybeSingle();
  if (demoPractice) {
    // Reihenfolge: Verordnungen kaskadieren auf Anpassungen und
    // Termin-Anrechnungen, deren `created_by`/`recorded_by` sonst die
    // Mitglieds- und damit die Praxislöschung blockieren.
    for (const table of [
      "patient_invites",
      "treatment_authorizations",
      "patient_documents",
    ] as const) {
      const { error } = await db
        .from(table)
        .delete()
        .eq("practice_id", demoPractice.id);
      if (error) throw new Error(`cleanup ${table}: ${error.message}`);
    }
    // Selbstauskünfte hängen per NO ACTION an Plan-Items, Plan-Items an
    // Übungen – beides muss vor der kaskadierenden Praxislöschung weg.
    const { data: planRows } = await db
      .from("exercise_plans")
      .select("id")
      .eq("practice_id", demoPractice.id);
    const planIds = (planRows ?? []).map((row) => row.id);
    if (planIds.length > 0) {
      const { data: versionRows } = await db
        .from("exercise_plan_versions")
        .select("id")
        .in("plan_id", planIds);
      const versionIds = (versionRows ?? []).map((row) => row.id);
      if (versionIds.length > 0) {
        const { data: itemRows } = await db
          .from("exercise_plan_items")
          .select("id")
          .in("plan_version_id", versionIds);
        const itemIds = (itemRows ?? []).map((row) => row.id);
        if (itemIds.length > 0) {
          const { error } = await db
            .from("completion_logs")
            .delete()
            .in("plan_item_id", itemIds);
          if (error) throw new Error(`cleanup completion_logs: ${error.message}`);
        }
      }
      const { error } = await db.from("exercise_plans").delete().in("id", planIds);
      if (error) throw new Error(`cleanup exercise_plans: ${error.message}`);
    }
    const { error: practiceError } = await db
      .from("practices")
      .delete()
      .eq("id", demoPractice.id);
    if (practiceError) throw new Error(`cleanup practice: ${practiceError.message}`);
  }
  const { data } = await db.auth.admin.listUsers({ perPage: 1000 });
  for (const user of data?.users ?? []) {
    if (DEMO_USERS.some((d) => d.email === user.email)) {
      const { error } = await db.auth.admin.deleteUser(user.id);
      if (error) {
        throw new Error(`deleteUser ${user.email}: ${error.message}`);
      }
    }
  }
}

async function createUser(email: string, fullName: string): Promise<string> {
  const { data, error } = await db.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName, locale: "de" },
  });
  if (error || !data.user) throw new Error(`createUser ${email}: ${error?.message}`);
  return data.user.id;
}

/** ISO-Datum mit Tagesversatz (UTC reicht für Demo-Zwecke). */
function isoDate(offsetDays: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

/** Zeitpunkt: heute + offsetDays um hour:minute lokaler Serverzeit. */
function at(offsetDays: number, hour: number, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

async function main() {
  console.log("Entferne alte Demo-Daten …");
  await removeExistingDemoData();

  console.log("Lege Demo-Benutzer an …");
  const [therapistId, adminId, patientId] = [
    await createUser(DEMO_USERS[0].email, DEMO_USERS[0].fullName),
    await createUser(DEMO_USERS[1].email, DEMO_USERS[1].fullName),
    await createUser(DEMO_USERS[2].email, DEMO_USERS[2].fullName),
    await createUser(DEMO_USERS[3].email, DEMO_USERS[3].fullName),
  ];

  console.log("Lege Demo-Praxis an …");
  const { data: practice, error: practiceError } = await db
    .from("practices")
    .insert({
      name: DEMO_PRACTICE_NAME,
      address_street: "Musterstraße 12",
      address_postal_code: "1234",
      address_city: "Beispielstadt",
      phone: "+352 000 000 000",
      timezone: "Europe/Luxembourg",
    })
    .select("id")
    .single();
  if (practiceError || !practice) throw new Error(`practice: ${practiceError?.message}`);

  const { data: therapistMember, error: memberError } = await db
    .from("practice_members")
    .insert([
      { practice_id: practice.id, profile_id: therapistId, role: "therapist", calendar_color: "indigo" },
      { practice_id: practice.id, profile_id: adminId, role: "admin", calendar_color: "amber" },
    ])
    .select("id, profile_id");
  if (memberError || !therapistMember) throw new Error(`members: ${memberError?.message}`);
  const therapistMemberId = therapistMember.find((m) => m.profile_id === therapistId)!.id;

  // Fiktive Kontaktnummer der Demo-Patientin (keine echte Nummer).
  await db.from("profiles").update({ phone: "+352 621 000 001" }).eq("id", patientId);

  await db.from("patient_invites").insert({
    practice_id: practice.id,
    created_by: therapistMemberId,
    patient_display_name: DEMO_USERS[3].fullName,
    code_hash: hashInviteCode("DEMA-PHYS-2326"),
    expires_at: at(7, 12),
  });

  await db.from("patient_practice_links").insert({
    patient_profile_id: patientId,
    practice_id: practice.id,
    primary_therapist_id: therapistMemberId,
    status: "active",
  });

  console.log("Lege Übungsbibliothek an …");
  const { data: exercises, error: exercisesError } = await db
    .from("exercises")
    .insert([
      {
        practice_id: practice.id,
        created_by: therapistMemberId,
        title: "Brücke (Beckenheben)",
        description: "Kräftigt Gesäß und unteren Rücken.",
        starting_position: "Rückenlage, Beine angewinkelt, Füße hüftbreit aufgestellt.",
        steps: ["Becken langsam anheben, bis Oberkörper und Oberschenkel eine Linie bilden.", "Position kurz halten.", "Becken langsam wieder absenken."],
        common_mistakes: "Ins Hohlkreuz überstrecken; Schwung holen.",
        default_dosage_type: "repetitions",
        default_sets: 3,
        default_repetitions: 12,
        default_rest_seconds: 45,
      },
      {
        practice_id: practice.id,
        created_by: therapistMemberId,
        title: "Wandsitz",
        description: "Kräftigt die Oberschenkelmuskulatur.",
        starting_position: "Mit dem Rücken an die Wand lehnen, Füße etwa 40 cm vor der Wand.",
        steps: ["Langsam in die Hocke gleiten, bis die Knie etwa im rechten Winkel stehen.", "Position halten und ruhig weiteratmen.", "Langsam wieder nach oben gleiten."],
        common_mistakes: "Knie über die Fußspitzen schieben; Luft anhalten.",
        default_dosage_type: "duration",
        default_sets: 3,
        default_hold_seconds: 30,
        default_rest_seconds: 60,
      },
      {
        practice_id: practice.id,
        created_by: therapistMemberId,
        title: "Schulterkreisen",
        description: "Lockert Schultern und Nacken.",
        starting_position: "Aufrechter Sitz oder Stand, Arme locker hängen lassen.",
        steps: ["Beide Schultern langsam nach hinten kreisen.", "Bewegung groß und ruhig ausführen."],
        common_mistakes: "",
        default_dosage_type: "repetitions",
        default_sets: 2,
        default_repetitions: 10,
        default_rest_seconds: 30,
      },
    ])
    .select("id, title, default_sets, default_repetitions, default_hold_seconds, default_rest_seconds");
  if (exercisesError || !exercises) throw new Error(`exercises: ${exercisesError.message}`);

  console.log("Lege Übungsplan (Version 1) an …");
  const { data: plan, error: planError } = await db
    .from("exercise_plans")
    .insert({
      practice_id: practice.id,
      patient_profile_id: patientId,
      created_by: therapistMemberId,
      title: "Aufbauprogramm Rücken",
      status: "active",
    })
    .select("id")
    .single();
  if (planError || !plan) throw new Error(`plan: ${planError?.message}`);

  const { data: version, error: versionError } = await db
    .from("exercise_plan_versions")
    .insert({
      plan_id: plan.id,
      version_number: 1,
      created_by: therapistMemberId,
      change_note: "Erste Version",
    })
    .select("id")
    .single();
  if (versionError || !version) throw new Error(`version: ${versionError?.message}`);

  await db.from("exercise_plans").update({ current_version_id: version.id }).eq("id", plan.id);

  const { data: items, error: itemsError } = await db
    .from("exercise_plan_items")
    .insert(
      exercises.map((exercise, index) => ({
        plan_version_id: version.id,
        exercise_id: exercise.id,
        sort_order: index,
        start_date: isoDate(-14),
        schedule: { weekdays: [1, 2, 3, 4, 5, 6, 7] },
        sets: exercise.default_sets,
        repetitions: exercise.default_repetitions,
        hold_seconds: exercise.default_hold_seconds,
        rest_seconds: exercise.default_rest_seconds,
      }))
    )
    .select("id, sets, repetitions, hold_seconds");
  if (itemsError || !items) throw new Error(`items: ${itemsError.message}`);

  console.log("Lege Termine an …");
  const { data: appointments, error: appointmentError } = await db.from("appointments").insert([
    {
      practice_id: practice.id,
      patient_profile_id: patientId,
      therapist_member_id: therapistMemberId,
      starts_at: at(3, 10, 0),
      ends_at: at(3, 10, 45),
      timezone: "Europe/Luxembourg",
      location_name: DEMO_PRACTICE_NAME,
      address: "Musterstraße 12, 1234 Beispielstadt",
      status: "scheduled",
    },
    {
      practice_id: practice.id,
      patient_profile_id: patientId,
      therapist_member_id: therapistMemberId,
      starts_at: at(0, 14, 0),
      ends_at: at(0, 14, 45),
      timezone: "Europe/Luxembourg",
      location_name: DEMO_PRACTICE_NAME,
      address: "Musterstraße 12, 1234 Beispielstadt",
      status: "scheduled",
    },
    {
      practice_id: practice.id,
      patient_profile_id: patientId,
      therapist_member_id: therapistMemberId,
      starts_at: at(-7, 9, 0),
      ends_at: at(-7, 9, 45),
      timezone: "Europe/Luxembourg",
      location_name: DEMO_PRACTICE_NAME,
      address: "Musterstraße 12, 1234 Beispielstadt",
      status: "completed",
      completed_at: at(-7, 9, 45),
    },
  ]).select("id, status");
  if (appointmentError || !appointments) throw new Error(`appointments: ${appointmentError?.message}`);

  console.log("Lege Beispiel-Verordnung an …");
  const { data: authorization, error: authorizationError } = await db
    .from("treatment_authorizations")
    .insert({
      practice_id: practice.id,
      patient_profile_id: patientId,
      title: "Verordnung Rückenbehandlung",
      reference: "DEMO-2026-01",
      prescribed_sessions: 12,
      issued_on: isoDate(-21),
      valid_from: isoDate(-21),
      status: "active",
      prescribing_doctor: "Dr. Demo",
      created_by: therapistMemberId,
    })
    .select("id")
    .single();
  if (authorizationError || !authorization) throw new Error(`authorization: ${authorizationError?.message}`);
  const completedAppointment = appointments.find((appointment) => appointment.status === "completed");
  if (completedAppointment) {
    await db.from("appointment_authorization_usages").insert({
      authorization_id: authorization.id,
      appointment_id: completedAppointment.id,
      sessions_used: 1,
      recorded_by: therapistMemberId,
    });
  }

  console.log("Dokumentiere Beispiel-Durchführungen (Selbstauskunft) …");
  // `note` immer mitschicken: bei Mehrzeilen-Inserts überträgt PostgREST
  // sonst explizit NULL und verletzt die NOT-NULL-Vorgabe der Spalte.
  const { error: logsError } = await db.from("completion_logs").insert([
    {
      patient_profile_id: patientId,
      plan_item_id: items[0].id,
      performed_on: isoDate(-1),
      performed_at: at(-1, 8, 30),
      status: "completed",
      sets_completed: items[0].sets,
      pain_before: 3,
      pain_after: 2,
      note: "",
      prescription_snapshot: {
        sets: items[0].sets,
        repetitions: items[0].repetitions,
      },
    },
    {
      patient_profile_id: patientId,
      plan_item_id: items[1].id,
      performed_on: isoDate(-1),
      performed_at: at(-1, 8, 40),
      status: "too_difficult",
      sets_completed: 1,
      pain_before: 3,
      pain_after: 5,
      note: "Nach dem ersten Durchgang zog es im Knie.",
      prescription_snapshot: {
        sets: items[1].sets,
        hold_seconds: items[1].hold_seconds,
      },
    },
  ]);
  if (logsError) throw new Error(`completion_logs: ${logsError.message}`);

  console.log("");
  console.log("Demo-Daten angelegt. Zugangsdaten (nur lokal):");
  for (const user of DEMO_USERS) {
    console.log(`  ${user.kind.padEnd(9)} ${user.email}  Passwort: ${DEMO_PASSWORD}`);
  }
  console.log("  Einladungscode für Erika Einladung: DEMA-PHYS-2326");
}

main().catch((error) => {
  console.error("Seed fehlgeschlagen:", error);
  process.exit(1);
});
