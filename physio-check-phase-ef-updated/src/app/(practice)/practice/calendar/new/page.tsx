import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionContext } from "@/server/services/session";
import { getAppointmentOptions } from "@/server/services/appointments";
import { isIsoDate } from "@/lib/calendar";
import { todayInTimeZone } from "@/lib/datetime";
import { AppointmentForm } from "@/components/practice/appointment-form";
import { de } from "@/messages/de";

export const metadata: Metadata = { title: de.practice.calendar.newTitle };

export default async function NewAppointmentPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const session = await getSessionContext();
  const membership = session?.memberships[0];
  if (!membership) redirect("/login");
  const options = await getAppointmentOptions(membership.practiceId);
  if (!options.practice) redirect("/practice");
  const { date } = await searchParams;
  const initialDate = date && isIsoDate(date) ? date : todayInTimeZone(options.practice.timezone);
  return <div className="flex flex-col gap-6"><Link href="/practice/calendar" className="font-semibold text-primary">← {de.common.back}</Link><h1 className="text-2xl font-bold">{de.practice.calendar.newTitle}</h1><AppointmentForm patients={options.patients.map((row) => ({ id: row.id, fullName: row.full_name }))} therapists={options.therapists.map((row) => ({ id: row.id, fullName: row.profiles.full_name }))} initial={{ date: initialDate, startTime: "09:00", durationMinutes: 45, locationName: options.practice.name, note: "" }} /></div>;
}

