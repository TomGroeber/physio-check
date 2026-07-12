"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/server/db/server-client";
import { getSessionContext } from "@/server/services/session";
import {
  auditAppointment,
  getAppointmentOptions,
  getPracticeAppointment,
  notifyProfile,
} from "@/server/services/appointments";
import {
  cancelAppointmentSchema,
  completeAppointmentSchema,
  createAppointmentSchema,
  updateAppointmentSchema,
  requestCancellationSchema,
} from "@/lib/validation/appointments";
import { zonedTimeToUtc } from "@/lib/datetime";
import { getAuthorizationRemaining } from "@/server/services/authorizations";
import { UNITS_WARNING_THRESHOLD } from "@/lib/authorization-warnings";

export type AppointmentActionState = { error?: string; success?: string; warning?: string };

async function practiceContext() {
  const session = await getSessionContext();
  const membership = session?.memberships[0];
  if (!session || !membership) return null;
  return { session, membership };
}

function appointmentInput(formData: FormData) {
  return {
    appointmentId: formData.get("appointmentId"),
    patientProfileId: formData.get("patientProfileId"),
    therapistMemberId: formData.get("therapistMemberId"),
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    durationMinutes: formData.get("durationMinutes"),
    locationName: formData.get("locationName"),
    note: formData.get("note"),
  };
}

function databaseError(error: { code?: string; message: string } | null): string {
  if (error?.code === "23P01") {
    return "Die behandelnde Person hat in diesem Zeitraum bereits einen Termin.";
  }
  return "Der Termin konnte nicht gespeichert werden. Bitte prüfen Sie die Angaben.";
}

async function validatedParties(
  practiceId: string,
  patientId: string,
  therapistId: string
) {
  const options = await getAppointmentOptions(practiceId);
  return {
    options,
    patientValid: options.patients.some((patient) => patient.id === patientId),
    therapistValid: options.therapists.some((therapist) => therapist.id === therapistId),
  };
}

export async function createAppointmentAction(
  _state: AppointmentActionState,
  formData: FormData
): Promise<AppointmentActionState> {
  const parsed = createAppointmentSchema.safeParse(appointmentInput(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const context = await practiceContext();
  if (!context) return { error: "Sie sind nicht für eine Praxis angemeldet." };

  const { practiceId } = context.membership;
  const parties = await validatedParties(
    practiceId,
    parsed.data.patientProfileId,
    parsed.data.therapistMemberId
  );
  if (!parties.options.practice || !parties.patientValid || !parties.therapistValid) {
    return { error: "Patient oder behandelnde Person gehört nicht zu dieser Praxis." };
  }

  const startsAt = zonedTimeToUtc(
    parsed.data.date,
    parsed.data.startTime,
    parties.options.practice.timezone
  );
  const endsAt = new Date(startsAt.getTime() + parsed.data.durationMinutes * 60_000);
  const address = [
    parties.options.practice.address_street,
    `${parties.options.practice.address_postal_code} ${parties.options.practice.address_city}`.trim(),
  ].filter(Boolean).join(", ");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("appointments")
    .insert({
      practice_id: practiceId,
      patient_profile_id: parsed.data.patientProfileId,
      therapist_member_id: parsed.data.therapistMemberId,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      timezone: parties.options.practice.timezone,
      location_name: parsed.data.locationName || parties.options.practice.name,
      address,
      note: parsed.data.note,
      status: "scheduled",
    })
    .select("id")
    .single();
  if (error || !data) return { error: databaseError(error) };

  await auditAppointment(context.session.userId, practiceId, data.id, "appointment_created");
  revalidatePath("/practice/calendar");
  redirect(`/practice/calendar/${data.id}`);
}

export async function updateAppointmentAction(
  _state: AppointmentActionState,
  formData: FormData
): Promise<AppointmentActionState> {
  const parsed = updateAppointmentSchema.safeParse(appointmentInput(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const context = await practiceContext();
  if (!context) return { error: "Sie sind nicht für eine Praxis angemeldet." };
  const { practiceId } = context.membership;
  const current = await getPracticeAppointment(practiceId, parsed.data.appointmentId);
  if (!current || current.status === "cancelled" || current.status === "completed") {
    return { error: "Dieser Termin kann nicht mehr bearbeitet werden." };
  }

  const parties = await validatedParties(
    practiceId,
    parsed.data.patientProfileId,
    parsed.data.therapistMemberId
  );
  if (!parties.options.practice || !parties.patientValid || !parties.therapistValid) {
    return { error: "Patient oder behandelnde Person gehört nicht zu dieser Praxis." };
  }
  const startsAt = zonedTimeToUtc(parsed.data.date, parsed.data.startTime, parties.options.practice.timezone);
  const endsAt = new Date(startsAt.getTime() + parsed.data.durationMinutes * 60_000);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("appointments")
    .update({
      patient_profile_id: parsed.data.patientProfileId,
      therapist_member_id: parsed.data.therapistMemberId,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      location_name: parsed.data.locationName,
      note: parsed.data.note,
    })
    .eq("id", parsed.data.appointmentId)
    .eq("practice_id", practiceId);
  if (error) return { error: databaseError(error) };

  await auditAppointment(context.session.userId, practiceId, parsed.data.appointmentId, "appointment_updated");
  revalidatePath("/practice/calendar");
  revalidatePath(`/practice/calendar/${parsed.data.appointmentId}`);
  return { success: "Änderungen gespeichert." };
}

export async function cancelAppointmentAction(
  _state: AppointmentActionState,
  formData: FormData
): Promise<AppointmentActionState> {
  const parsed = cancelAppointmentSchema.safeParse({
    appointmentId: formData.get("appointmentId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const context = await practiceContext();
  if (!context) return { error: "Sie sind nicht für eine Praxis angemeldet." };
  const { practiceId } = context.membership;
  const current = await getPracticeAppointment(practiceId, parsed.data.appointmentId);
  if (!current || current.status === "cancelled") return { error: "Der Termin wurde nicht gefunden oder ist bereits abgesagt." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("appointments")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancelled_by_profile_id: context.session.userId,
      cancellation_reason: parsed.data.reason,
    })
    .eq("id", parsed.data.appointmentId)
    .eq("practice_id", practiceId);
  if (error) return { error: "Der Termin konnte nicht storniert werden." };

  await Promise.all([
    notifyProfile(
      current.patient_profile_id,
      "appointment_cancelled",
      "Termin abgesagt",
      "Ihre Praxis hat einen Termin abgesagt. Öffnen Sie Ihre Termine für Details.",
      { appointmentId: current.id }
    ),
    auditAppointment(context.session.userId, practiceId, current.id, "appointment_cancelled"),
  ]);
  revalidatePath("/practice/calendar");
  revalidatePath("/appointments");
  redirect("/practice/calendar");
}

export async function completeAppointmentAction(
  _state: AppointmentActionState,
  formData: FormData
): Promise<AppointmentActionState> {
  const parsed = completeAppointmentSchema.safeParse({ appointmentId: formData.get("appointmentId") });
  if (!parsed.success) return { error: "Ungültiger Termin." };
  const context = await practiceContext();
  if (!context) return { error: "Sie sind nicht für eine Praxis angemeldet." };
  const current = await getPracticeAppointment(context.membership.practiceId, parsed.data.appointmentId);
  if (!current || current.status !== "scheduled") return { error: "Nur geplante Termine können abgeschlossen werden." };

  const supabase = await createSupabaseServerClient();
  const { data: authorizationId, error } = await supabase.rpc(
    "complete_appointment_with_authorization",
    { p_appointment_id: current.id }
  );
  if (error) return { error: "Der Termin konnte nicht abgeschlossen werden." };
  await auditAppointment(context.session.userId, context.membership.practiceId, current.id, "appointment_completed");
  if (authorizationId) {
    await notifyPracticeOnLowUnits(
      context.membership.practiceId,
      current.patient_profile_id,
      current.patient?.full_name ?? "",
      authorizationId
    );
  }
  revalidatePath("/practice/calendar");
  revalidatePath(`/practice/calendar/${current.id}`);
  revalidatePath(`/practice/patients/${current.patient_profile_id}`);
  revalidatePath("/today");
  if (!authorizationId) {
    return {
      warning:
        "Der Termin wurde abgeschlossen, aber es war keine Behandlungseinheit verfügbar. Es wurde nichts angerechnet; der Stand bleibt bei 0 und wird nicht negativ. Bitte klären Sie Verordnung und Kostenübernahme mit Patient und Versicherung.",
    };
  }
  return {
    success: "Der Termin wurde abgeschlossen und genau eine Behandlungseinheit angerechnet.",
  };
}

/**
 * Datensparsame Benachrichtigung an alle aktiven Praxismitglieder, wenn
 * eine Anrechnung den Stand genau auf die Warnschwelle oder auf 0 bringt
 * (nur beim Überschreiten, nicht bei jedem weiteren Abschluss). Inhalt:
 * nur Name und Einheitenstand – keine Gesundheitsdaten.
 */
async function notifyPracticeOnLowUnits(
  practiceId: string,
  patientProfileId: string,
  patientName: string,
  authorizationId: string
) {
  const remaining = await getAuthorizationRemaining(authorizationId);
  if (remaining !== UNITS_WARNING_THRESHOLD && remaining !== 0) return;
  const supabase = await createSupabaseServerClient();
  const { data: members } = await supabase
    .from("practice_members")
    .select("profile_id")
    .eq("practice_id", practiceId)
    .eq("is_active", true);
  const body =
    remaining === 0
      ? `${patientName}: Es ist keine Behandlungseinheit mehr verfügbar.`
      : `${patientName}: Es sind nur noch ${remaining} Behandlungseinheiten verfügbar.`;
  await Promise.all(
    (members ?? []).map((member) =>
      notifyProfile(member.profile_id, "authorization_warning", "Verordnungswarnung", body, {
        patientId: patientProfileId,
      })
    )
  );
}

export async function reverseAppointmentCompletionAction(
  _state: AppointmentActionState,
  formData: FormData
): Promise<AppointmentActionState> {
  const parsed = completeAppointmentSchema.safeParse({ appointmentId: formData.get("appointmentId") });
  if (!parsed.success) return { error: "Ungültiger Termin." };
  const context = await practiceContext();
  if (!context) return { error: "Sie sind nicht für eine Praxis angemeldet." };
  const current = await getPracticeAppointment(context.membership.practiceId, parsed.data.appointmentId);
  if (!current || current.status !== "completed") {
    return { error: "Nur abgeschlossene Termine können zurückgenommen werden." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: unitRebooked, error } = await supabase.rpc("reverse_appointment_completion", {
    p_appointment_id: current.id,
  });
  if (error) {
    // 23P01 = Exclusion-Constraint: der Zeitraum ist inzwischen belegt.
    if (error.code === "23P01") {
      return {
        error:
          "Die Rücknahme ist nicht möglich, weil der Zeitraum inzwischen mit einem anderen Termin belegt ist.",
      };
    }
    return { error: "Der Abschluss konnte nicht zurückgenommen werden." };
  }
  await auditAppointment(
    context.session.userId,
    context.membership.practiceId,
    current.id,
    "appointment_completion_reversed"
  );
  revalidatePath("/practice/calendar");
  revalidatePath(`/practice/calendar/${current.id}`);
  revalidatePath(`/practice/patients/${current.patient_profile_id}`);
  revalidatePath("/today");
  return {
    success: unitRebooked
      ? "Der Abschluss wurde zurückgenommen und genau eine Behandlungseinheit zurückgebucht."
      : "Der Abschluss wurde zurückgenommen. Es war keine Einheit angerechnet, daher wurde nichts zurückgebucht.",
  };
}

export async function requestAppointmentCancellationAction(
  _state: AppointmentActionState,
  formData: FormData
): Promise<AppointmentActionState> {
  const parsed = requestCancellationSchema.safeParse({
    appointmentId: formData.get("appointmentId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const session = await getSessionContext();
  if (!session?.patientLink) return { error: "Bitte melden Sie sich erneut an." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("request_appointment_cancellation", {
    p_appointment_id: parsed.data.appointmentId,
    p_reason: parsed.data.reason,
  });
  if (error) return { error: "Die Absageanfrage konnte nicht gesendet werden." };
  revalidatePath("/appointments");
  revalidatePath("/practice/calendar");
  return { success: "Ihre Absageanfrage wurde an die Praxis gesendet." };
}
