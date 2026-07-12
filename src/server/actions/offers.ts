"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/server/db/server-client";
import { getSessionContext } from "@/server/services/session";
import { getPatientDetail, getPractice } from "@/server/services/practice";
import { notifyProfile } from "@/server/services/appointments";
import { zonedTimeToUtc } from "@/lib/datetime";
import { branding } from "@/config/branding";

export type OfferActionState = { error?: string; success?: string };

const createOfferSchema = z.object({
  patientId: z.uuid("Bitte wählen Sie einen Patienten aus."),
  therapistMemberId: z.uuid("Bitte wählen Sie eine behandelnde Person aus."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Bitte wählen Sie ein gültiges Datum."),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Bitte wählen Sie eine gültige Uhrzeit."),
  durationMinutes: z.coerce.number().int().min(5).max(480),
});
const respondSchema = z.object({ offerId: z.uuid() });
const withdrawSchema = z.object({ offerId: z.uuid() });

async function practiceContext() {
  const session = await getSessionContext();
  const membership = session?.memberships[0];
  if (!session || !membership) return null;
  return { session, membership };
}

export async function createOfferAction(
  _state: OfferActionState,
  formData: FormData
): Promise<OfferActionState> {
  const parsed = createOfferSchema.safeParse({
    patientId: formData.get("patientId"),
    therapistMemberId: formData.get("therapistMemberId"),
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    durationMinutes: formData.get("durationMinutes"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const context = await practiceContext();
  if (!context) return { error: "Sie sind nicht für eine Praxis angemeldet." };
  const patient = await getPatientDetail(context.membership.practiceId, parsed.data.patientId);
  if (!patient) return { error: "Kein Zugriff auf diesen Patienten." };

  const practice = await getPractice(context.membership.practiceId);
  const timezone = practice?.timezone ?? branding.defaultTimeZone;
  const startsAt = zonedTimeToUtc(parsed.data.date, parsed.data.startTime, timezone);
  if (startsAt.getTime() <= Date.now()) {
    return { error: "Das Zeitfenster liegt in der Vergangenheit." };
  }
  const endsAt = new Date(startsAt.getTime() + parsed.data.durationMinutes * 60_000);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("appointment_offers").insert({
    practice_id: context.membership.practiceId,
    patient_profile_id: parsed.data.patientId,
    therapist_member_id: parsed.data.therapistMemberId,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    timezone,
    location_name: practice?.name ?? "",
    created_by: context.membership.memberId,
  });
  if (error) return { error: "Das Angebot konnte nicht erstellt werden." };

  await notifyProfile(
    parsed.data.patientId,
    "appointment_offer_created",
    "Neues Terminangebot",
    "Ihre Praxis hat Ihnen einen Termin angeboten. Öffnen Sie Ihre Termine, um zu antworten.",
    {}
  );
  revalidatePath("/practice/waitlist");
  revalidatePath("/appointments");
  return { success: "Das Angebot wurde erstellt. Der Patient wurde benachrichtigt." };
}

export async function withdrawOfferAction(
  _state: OfferActionState,
  formData: FormData
): Promise<OfferActionState> {
  const parsed = withdrawSchema.safeParse({ offerId: formData.get("offerId") });
  if (!parsed.success) return { error: "Ungültige Anfrage." };
  const context = await practiceContext();
  if (!context) return { error: "Sie sind nicht für eine Praxis angemeldet." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("appointment_offers")
    .update({ status: "withdrawn", responded_at: new Date().toISOString() })
    .eq("id", parsed.data.offerId)
    .eq("practice_id", context.membership.practiceId)
    .eq("status", "offered")
    .select("id");
  if (error || !data?.length) return { error: "Das Angebot konnte nicht zurückgezogen werden." };
  revalidatePath("/practice/waitlist");
  revalidatePath("/appointments");
  return { success: "Das Angebot wurde zurückgezogen." };
}

export async function acceptOfferAction(
  _state: OfferActionState,
  formData: FormData
): Promise<OfferActionState> {
  const parsed = respondSchema.safeParse({ offerId: formData.get("offerId") });
  if (!parsed.success) return { error: "Ungültige Anfrage." };
  const session = await getSessionContext();
  if (!session) return { error: "Bitte melden Sie sich an." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("accept_appointment_offer", {
    p_offer_id: parsed.data.offerId,
  });
  if (error) {
    // 23P01 = Exclusion-Constraint: das Zeitfenster ist inzwischen belegt.
    if (error.code === "23P01") {
      return {
        error:
          "Dieses Zeitfenster ist leider inzwischen vergeben. Bitte lehnen Sie das Angebot ab oder wenden Sie sich an Ihre Praxis.",
      };
    }
    return { error: "Das Angebot konnte nicht angenommen werden." };
  }
  revalidatePath("/appointments");
  revalidatePath("/today");
  return { success: "Der Termin ist gebucht. Sie finden ihn unter Ihren Terminen." };
}

export async function declineOfferAction(
  _state: OfferActionState,
  formData: FormData
): Promise<OfferActionState> {
  const parsed = respondSchema.safeParse({ offerId: formData.get("offerId") });
  if (!parsed.success) return { error: "Ungültige Anfrage." };
  const session = await getSessionContext();
  if (!session) return { error: "Bitte melden Sie sich an." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("decline_appointment_offer", {
    p_offer_id: parsed.data.offerId,
  });
  if (error) return { error: "Das Angebot konnte nicht abgelehnt werden." };
  revalidatePath("/appointments");
  return { success: "Das Angebot wurde abgelehnt." };
}
