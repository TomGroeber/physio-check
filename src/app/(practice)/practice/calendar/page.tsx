import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionContext } from "@/server/services/session";
import { getAppointmentOptions, listCalendarAppointments } from "@/server/services/appointments";
import { getPatientCalendarColors } from "@/server/services/patient-calendar-colors";
import { isCalendarView, isIsoDate, monthGridDays, navigateDate, visibleRange, weekDaysIso, type CalendarView } from "@/lib/calendar";
import { formatDateLong, formatTime, isoDateInTimeZone, todayInTimeZone, zonedTimeToUtc } from "@/lib/datetime";
import { colorStyle } from "@/lib/calendar-colors";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { de } from "@/messages/de";

export const metadata: Metadata = { title: de.practice.calendar.title };
type Params = { view?: string; date?: string; therapist?: string; patient?: string; status?: string };

function statusLabel(status: string) {
  return de.patient.appointments.status[status as keyof typeof de.patient.appointments.status] ?? status;
}

export default async function CalendarPage({ searchParams }: { searchParams: Promise<Params> }) {
  const session = await getSessionContext();
  const membership = session?.memberships[0];
  if (!session || !membership) redirect("/login");
  const options = await getAppointmentOptions(membership.practiceId);
  if (!options.practice) redirect("/practice");

  const params = await searchParams;
  const view: CalendarView = params.view && isCalendarView(params.view) ? params.view : "month";
  const today = todayInTimeZone(options.practice.timezone);
  const date = params.date && isIsoDate(params.date) ? params.date : today;
  const range = visibleRange(view, date);
  const start = zonedTimeToUtc(range.start, "00:00", options.practice.timezone).toISOString();
  const end = zonedTimeToUtc(range.endExclusive, "00:00", options.practice.timezone).toISOString();
  const patientColors = await getPatientCalendarColors(membership.practiceId);
  const appointments = await listCalendarAppointments(membership.practiceId, start, end, {
    therapistId: params.therapist,
    patientId: params.patient,
    status: (["scheduled", "cancellation_requested", "cancelled", "completed"] as const).includes(
      params.status as "scheduled" | "cancellation_requested" | "cancelled" | "completed"
    ) ? params.status as "scheduled" | "cancellation_requested" | "cancelled" | "completed" : undefined,
  });

  const base = (overrides: Partial<Params>) => {
    const next = new URLSearchParams({ view, date });
    if (params.therapist) next.set("therapist", params.therapist);
    if (params.patient) next.set("patient", params.patient);
    if (params.status) next.set("status", params.status);
    Object.entries(overrides).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key));
    return `/practice/calendar?${next}`;
  };

  // Farbe je PATIENT (D-057): ohne Zuordnung bleibt der Termin neutral.
  const patientChip = (patientId: string) => {
    const color = patientColors[patientId];
    return color ? colorStyle(color).chip : "";
  };
  const patientDot = (patientId: string) => {
    const color = patientColors[patientId];
    return color ? colorStyle(color).dot : null;
  };
  // Legende: nur Patienten mit Farbe, die im sichtbaren Zeitraum vorkommen.
  const legendPatients = Array.from(
    new Map(
      appointments
        .filter((appointment) => patientColors[appointment.patient.id])
        .map((appointment) => [appointment.patient.id, appointment.patient])
    ).values()
  );

  const appointmentsForDay = (day: string) => appointments.filter((appointment) => isoDateInTimeZone(new Date(appointment.starts_at), options.practice!.timezone) === day);
  const days = view === "month" ? monthGridDays(date) : view === "week" ? weekDaysIso(date) : view === "day" ? [date] : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{de.practice.calendar.title}</h1>
          <p className="text-base text-muted-foreground">{formatDateLong(zonedTimeToUtc(date, "12:00", options.practice.timezone), options.practice.timezone)}</p>
        </div>
        <Button asChild className="h-11 text-base"><Link href={`/practice/calendar/new?date=${date}`}>{de.practice.calendar.addAppointment}</Link></Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-3">
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link href={base({ date: navigateDate(view, date, -1) })}>←</Link></Button>
          <Button asChild variant="outline"><Link href={base({ date: today })}>{de.practice.calendar.today}</Link></Button>
          <Button asChild variant="outline"><Link href={base({ date: navigateDate(view, date, 1) })}>→</Link></Button>
        </div>
        <nav aria-label={de.practice.calendar.views} className="flex flex-wrap gap-1">
          {(["month", "week", "day", "list"] as const).map((item) => (
            <Button key={item} asChild variant={view === item ? "default" : "ghost"}>
              <Link href={base({ view: item })}>{de.practice.calendar.view[item]}</Link>
            </Button>
          ))}
        </nav>
      </div>

      <form method="GET" className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-4">
        <input type="hidden" name="view" value={view} /><input type="hidden" name="date" value={date} />
        <select name="therapist" defaultValue={params.therapist ?? ""} className="h-11 rounded-md border bg-background px-3 text-base"><option value="">{de.practice.calendar.allTherapists}</option>{options.therapists.map((row) => <option key={row.id} value={row.id}>{row.profiles.full_name}</option>)}</select>
        <select name="patient" defaultValue={params.patient ?? ""} className="h-11 rounded-md border bg-background px-3 text-base"><option value="">{de.practice.calendar.allPatients}</option>{options.patients.map((row) => <option key={row.id} value={row.id}>{row.full_name}</option>)}</select>
        <select name="status" defaultValue={params.status ?? ""} className="h-11 rounded-md border bg-background px-3 text-base"><option value="">{de.practice.calendar.allStatuses}</option>{Object.entries(de.patient.appointments.status).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <Button type="submit" variant="secondary" className="h-11 text-base">{de.practice.calendar.filter}</Button>
      </form>

      {legendPatients.length > 0 ? (
        <ul aria-label={de.practice.calendar.legend} className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {legendPatients.map((patient) => (
            <li key={patient.id} className="flex items-center gap-1.5">
              <span aria-hidden className={`size-2.5 rounded-full ${patientDot(patient.id)}`} />
              {patient.full_name}
            </li>
          ))}
        </ul>
      ) : null}

      {view === "month" ? (
        <div className="grid grid-cols-7 overflow-hidden rounded-xl border bg-border" role="grid" aria-label={de.practice.calendar.monthView}>
          {de.practice.calendar.weekdays.map((weekday) => <div key={weekday} className="bg-muted p-2 text-center text-sm font-bold">{weekday}</div>)}
          {days.map((day) => {
            const dayAppointments = appointmentsForDay(day);
            return <div key={day} className={`min-h-32 bg-card p-2 ${day === today ? "ring-2 ring-inset ring-primary" : ""}`} role="gridcell">
              <div className="mb-2 flex items-center justify-between"><span className="text-sm font-bold">{Number(day.slice(-2))}</span><Link href={`/practice/calendar/new?date=${day}`} className="text-sm text-primary" aria-label={`${day}: Termin anlegen`}>+</Link></div>
              <div className="flex flex-col gap-1">{dayAppointments.slice(0, 4).map((appointment) => <Link key={appointment.id} href={`/practice/calendar/${appointment.id}`} className={`flex items-center gap-1 rounded bg-primary/10 px-2 py-1 text-xs hover:bg-primary/20 ${patientChip(appointment.patient.id)}`}>{patientDot(appointment.patient.id) ? <span aria-hidden className={`size-2 shrink-0 rounded-full ${patientDot(appointment.patient.id)}`} /> : null}<span className="font-bold">{formatTime(new Date(appointment.starts_at), appointment.timezone)}</span> <span className="truncate">{appointment.patient.full_name}</span></Link>)}{dayAppointments.length > 4 ? <Link href={base({ view: "day", date: day })} className="text-xs font-semibold text-primary">+ {dayAppointments.length - 4} weitere</Link> : null}</div>
            </div>;
          })}
        </div>
      ) : view === "list" ? (
        <AppointmentList appointments={appointments} />
      ) : (
        <div className={`grid gap-3 ${view === "week" ? "lg:grid-cols-7" : ""}`}>
          {days.map((day) => <section key={day} className="min-h-48 rounded-xl border bg-card p-3"><div className="mb-3 flex items-center justify-between"><h2 className="font-bold">{formatDateLong(zonedTimeToUtc(day, "12:00", options.practice!.timezone), options.practice!.timezone)}</h2><Link href={`/practice/calendar/new?date=${day}`} className="text-sm font-semibold text-primary">+</Link></div><AppointmentList appointments={appointmentsForDay(day)} /></section>)}
        </div>
      )}
    </div>
  );
}

function AppointmentList({ appointments }: { appointments: Awaited<ReturnType<typeof listCalendarAppointments>> }) {
  if (!appointments.length) return <p className="text-sm text-muted-foreground">{de.practice.calendar.empty}</p>;
  return <ul className="flex flex-col gap-2">{appointments.map((appointment) => <li key={appointment.id}><Link href={`/practice/calendar/${appointment.id}`} className={`flex flex-wrap items-center gap-2 rounded-lg border p-3 hover:bg-muted ${patientChip(appointment.patient.id)}`}><span className="font-bold">{formatTime(new Date(appointment.starts_at), appointment.timezone)}</span><span className="flex flex-1 items-center gap-1.5">{patientDot(appointment.patient.id) ? <span aria-hidden className={`size-2.5 shrink-0 rounded-full ${patientDot(appointment.patient.id)}`} /> : null}{appointment.patient.full_name}</span>{appointment.therapist ? <span className="text-sm text-muted-foreground">{appointment.therapist.profiles?.full_name}</span> : null}<Badge variant="secondary">{statusLabel(appointment.status)}</Badge></Link></li>)}</ul>;
}
