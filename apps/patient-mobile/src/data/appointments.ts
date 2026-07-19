import { supabase } from "@/lib/supabase";
import type { NextAppointment } from "./today";

export type AppointmentView = NextAppointment;

export async function getAppointments(userId: string): Promise<{
  upcoming: AppointmentView[];
  past: AppointmentView[];
}> {
  const nowIso = new Date().toISOString();
  const base = () =>
    supabase
      .from("appointments")
      .select(
        `id, starts_at, ends_at, timezone, location_name, address, status,
         practice_members ( profiles ( full_name ) )`
      )
      .eq("patient_profile_id", userId);

  const [upcoming, past] = await Promise.all([
    base().gte("starts_at", nowIso).order("starts_at").limit(20),
    base().lt("starts_at", nowIso).order("starts_at", { ascending: false }).limit(20),
  ]);
  if (upcoming.error) throw new Error(upcoming.error.message);
  if (past.error) throw new Error(past.error.message);

  const toView = (rows: NonNullable<typeof upcoming.data>): AppointmentView[] =>
    rows.map((appointment) => {
      const member = appointment.practice_members as unknown as {
        profiles: { full_name: string } | null;
      } | null;
      return {
        id: appointment.id,
        startsAt: appointment.starts_at,
        endsAt: appointment.ends_at,
        timezone: appointment.timezone,
        locationName: appointment.location_name,
        address: appointment.address,
        status: appointment.status,
        therapistName: member?.profiles?.full_name ?? null,
      };
    });

  return { upcoming: toView(upcoming.data ?? []), past: toView(past.data ?? []) };
}

/** Absageanfrage über die bestehende atomare RPC (nie direkte Updates). */
export async function requestCancellation(
  appointmentId: string,
  reason: string
): Promise<void> {
  const { error } = await supabase.rpc("request_appointment_cancellation", {
    p_appointment_id: appointmentId,
    p_reason: reason,
  });
  if (error) throw new Error(error.message);
}

export type OfferView = {
  id: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
  locationName: string;
  practiceName: string;
};

export async function getOpenOffers(userId: string): Promise<OfferView[]> {
  const { data, error } = await supabase
    .from("appointment_offers")
    .select(
      `id, starts_at, ends_at, timezone, location_name, status,
       practices ( name )`
    )
    .eq("patient_profile_id", userId)
    .eq("status", "offered")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at");
  if (error) throw new Error(error.message);
  return (data ?? []).map((offer) => {
    const practice = offer.practices as unknown as { name: string } | null;
    return {
      id: offer.id,
      startsAt: offer.starts_at,
      endsAt: offer.ends_at,
      timezone: offer.timezone,
      locationName: offer.location_name,
      practiceName: practice?.name ?? "Ihre Praxis",
    };
  });
}

/** true = gebucht; false = Zeitraum inzwischen belegt (23P01). */
export async function acceptOffer(offerId: string): Promise<boolean> {
  const { error } = await supabase.rpc("accept_appointment_offer", {
    p_offer_id: offerId,
  });
  if (!error) return true;
  if (error.code === "23P01" || /overlap|belegt/i.test(error.message)) return false;
  throw new Error(error.message);
}

export async function declineOffer(offerId: string): Promise<void> {
  const { error } = await supabase.rpc("decline_appointment_offer", {
    p_offer_id: offerId,
  });
  if (error) throw new Error(error.message);
}

export type UnitSummary = {
  title: string;
  prescribedSessions: number;
  adjustedTotal: number;
  remaining: number;
  validUntil: string | null;
  status: string;
};

/**
 * Verordnungsstand über dieselbe DB-Auswahlregel wie Website und
 * Anrechnung (primary_authorization_for_patient) – Anzeige und
 * Abrechnung können sich nicht widersprechen.
 */
export async function getUnitSummary(userId: string): Promise<UnitSummary | null> {
  const { data: primaryId, error } = await supabase.rpc(
    "primary_authorization_for_patient",
    { p_patient_id: userId }
  );
  if (error) throw new Error(error.message);
  if (!primaryId) return null;

  const [authorization, remaining, adjustedTotal] = await Promise.all([
    supabase
      .from("treatment_authorizations")
      .select("title, prescribed_sessions, valid_until, status")
      .eq("id", primaryId)
      .maybeSingle(),
    supabase.rpc("authorization_remaining", { p_authorization_id: primaryId }),
    supabase.rpc("authorization_adjusted_total", { p_authorization_id: primaryId }),
  ]);
  if (!authorization.data) return null;
  return {
    title: authorization.data.title,
    prescribedSessions: authorization.data.prescribed_sessions,
    adjustedTotal: (adjustedTotal.data as number | null) ?? authorization.data.prescribed_sessions,
    remaining: (remaining.data as number | null) ?? 0,
    validUntil: authorization.data.valid_until,
    status: authorization.data.status,
  };
}
