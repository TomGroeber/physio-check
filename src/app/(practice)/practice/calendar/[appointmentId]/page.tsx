import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionContext } from "@/server/services/session";
import { getAppointmentOptions, getPracticeAppointment } from "@/server/services/appointments";
import { formatTime, isoDateInTimeZone } from "@/lib/datetime";
import { AppointmentForm } from "@/components/practice/appointment-form";
import { AppointmentActions } from "@/components/practice/appointment-actions";
import { Badge } from "@/components/ui/badge";
import { de } from "@/messages/de";

export const metadata: Metadata = { title: de.practice.calendar.editTitle };

export default async function AppointmentDetailPage({ params }: { params: Promise<{ appointmentId: string }> }) {
  const session = await getSessionContext();
  const membership = session?.memberships[0];
  if (!membership) redirect("/login");
  const { appointmentId } = await params;
  const [appointment, options] = await Promise.all([getPracticeAppointment(membership.practiceId, appointmentId), getAppointmentOptions(membership.practiceId)]);
  if (!appointment || !options.practice) notFound();
  const duration = Math.round((new Date(appointment.ends_at).getTime() - new Date(appointment.starts_at).getTime()) / 60_000);
  const final = appointment.status === "cancelled" || appointment.status === "completed";
  return <div className="flex max-w-3xl flex-col gap-6"><Link href="/practice/calendar" className="font-semibold text-primary">← {de.common.back}</Link><div className="flex items-center justify-between gap-3"><h1 className="text-2xl font-bold">{de.practice.calendar.editTitle}</h1><Badge variant="secondary">{de.patient.appointments.status[appointment.status]}</Badge></div>{final ? <div className="rounded-xl border bg-muted p-5"><p className="font-semibold">{appointment.patient.full_name}</p><p>{isoDateInTimeZone(new Date(appointment.starts_at), appointment.timezone)} · {formatTime(new Date(appointment.starts_at), appointment.timezone)}</p>{appointment.cancellation_reason ? <p className="mt-2 text-sm text-muted-foreground">{appointment.cancellation_reason}</p> : null}</div> : <><AppointmentForm patients={options.patients.map((row) => ({ id: row.id, fullName: row.full_name }))} therapists={options.therapists.map((row) => ({ id: row.id, fullName: row.profiles.full_name }))} initial={{ appointmentId: appointment.id, patientProfileId: appointment.patient_profile_id, therapistMemberId: appointment.therapist_member_id ?? undefined, date: isoDateInTimeZone(new Date(appointment.starts_at), appointment.timezone), startTime: formatTime(new Date(appointment.starts_at), appointment.timezone), durationMinutes: duration, locationName: appointment.location_name, note: appointment.note }} /><AppointmentActions appointmentId={appointment.id} /></>}</div>;
}

