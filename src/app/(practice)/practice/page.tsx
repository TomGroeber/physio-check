import type { Metadata } from "next";
import Link from "next/link";
import { getSessionContext } from "@/server/services/session";
import { getDashboardData, getPractice } from "@/server/services/practice";
import { listAuthorizationWarningsForPractice } from "@/server/services/authorizations";
import { listPinnedPatients } from "@/server/services/pinned-patients";
import { authorizationWarningText } from "@/lib/authorization-warning-text";
import { branding } from "@/config/branding";
import { formatDateShort, formatDateTime, formatTime } from "@/lib/datetime";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { de } from "@/messages/de";

export const metadata: Metadata = { title: de.practice.dashboard.title };

const t = de.practice.dashboard;

function EmptyHint({ children }: { children: React.ReactNode }) {
  return <p className="text-base text-muted-foreground">{children}</p>;
}

export default async function PracticeDashboardPage() {
  const session = (await getSessionContext())!;
  const { practiceId } = session.memberships[0];
  const practice = await getPractice(practiceId);
  const timezone = practice?.timezone ?? branding.defaultTimeZone;

  const [
    { todaysAppointments, pendingCancellations, recentLogs, flaggedLogs },
    authorizationWarnings,
    pinnedPatients,
  ] = await Promise.all([
    getDashboardData(practiceId, timezone),
    listAuthorizationWarningsForPractice(practiceId, timezone),
    listPinnedPatients(practiceId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t.title}</h1>

      <Card className={authorizationWarnings.length ? "border-amber-600/50" : undefined}>
        <CardHeader>
          <CardTitle className="text-lg">{t.authorizationWarnings}</CardTitle>
        </CardHeader>
        <CardContent>
          {authorizationWarnings.length === 0 ? (
            <EmptyHint>{t.emptyAuthorizationWarnings}</EmptyHint>
          ) : (
            <ul className="flex flex-col divide-y">
              {authorizationWarnings.map((entry) => (
                <li key={entry.authorizationId} className="flex flex-col gap-1 py-2.5">
                  <Link
                    href={`/practice/patients/${entry.patientId}`}
                    className="text-base font-semibold text-primary"
                  >
                    {entry.patientName}
                  </Link>
                  <span className="text-sm text-muted-foreground">
                    {entry.authorizationTitle} ·{" "}
                    {entry.warnings.map((warning) => authorizationWarningText(warning)).join(" ")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{de.practice.pinned.dashboardTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          {pinnedPatients.length === 0 ? (
            <EmptyHint>{de.practice.pinned.dashboardEmpty}</EmptyHint>
          ) : (
            <ul className="flex flex-col divide-y">
              {pinnedPatients.map((entry) => (
                <li key={entry.patient_profile_id} className="flex flex-col gap-1 py-2.5">
                  <Link
                    href={`/practice/patients/${entry.patient_profile_id}`}
                    className="text-base font-semibold text-primary"
                  >
                    {entry.patient?.full_name ?? "Unbekannt"}
                  </Link>
                  {entry.note ? (
                    <span className="text-sm text-muted-foreground">{entry.note}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t.todaysAppointments}</CardTitle>
          </CardHeader>
          <CardContent>
            {todaysAppointments.length === 0 ? (
              <EmptyHint>{t.emptyAppointments}</EmptyHint>
            ) : (
              <ul className="flex flex-col divide-y">
                {todaysAppointments.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 py-2.5">
                    <span className="w-14 shrink-0 font-mono text-base">
                      {formatTime(new Date(a.starts_at), a.timezone)}
                    </span>
                    <span className="flex-1 truncate text-base font-semibold">
                      {a.patient?.full_name}
                    </span>
                    <span className="truncate text-sm text-muted-foreground">
                      {a.therapist?.profiles?.full_name}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t.openCancellations}</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingCancellations.length === 0 ? (
              <EmptyHint>{t.emptyCancellations}</EmptyHint>
            ) : (
              <ul className="flex flex-col divide-y">
                {pendingCancellations.map((c) => (
                  <li key={c.id} className="flex flex-col gap-1 py-2.5">
                    <span className="text-base font-semibold">
                      {c.appointments?.patient?.full_name}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatDateTime(
                        new Date(c.appointments.starts_at),
                        c.appointments.timezone
                      )}
                      {c.reason && ` · ${c.reason}`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t.recentActivity}</CardTitle>
          </CardHeader>
          <CardContent>
            {recentLogs.length === 0 ? (
              <EmptyHint>{t.emptyActivity}</EmptyHint>
            ) : (
              <ul className="flex flex-col divide-y">
                {recentLogs.map((log) => (
                  <li key={log.id} className="flex items-center gap-3 py-2.5">
                    <span className="flex-1 truncate text-base">
                      <span className="font-semibold">{log.patient?.full_name}</span>
                      {" · "}
                      {log.exercise_plan_items?.exercises?.title}
                    </span>
                    <span className="shrink-0 text-sm text-muted-foreground">
                      {formatDateShort(new Date(log.performed_at), timezone)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t.flaggedFeedback}</CardTitle>
          </CardHeader>
          <CardContent>
            {flaggedLogs.length === 0 ? (
              <EmptyHint>{t.emptyFeedback}</EmptyHint>
            ) : (
              <ul className="flex flex-col divide-y">
                {flaggedLogs.map((log) => (
                  <li key={log.id} className="flex flex-col gap-1 py-2.5">
                    <span className="text-base">
                      <span className="font-semibold">{log.patient?.full_name}</span>
                      {" · "}
                      {log.exercise_plan_items?.exercises?.title}
                    </span>
                    <span className="flex flex-wrap items-center gap-2">
                      {(log.status === "too_difficult" ||
                        log.status === "not_possible") && (
                        <Badge variant="secondary">
                          {t.logStatus[log.status]}
                        </Badge>
                      )}
                      {log.pain_after !== null && log.pain_after >= 7 && (
                        <Badge variant="secondary">
                          {t.painAfter(log.pain_after)}
                        </Badge>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="text-sm text-muted-foreground">{t.selfReportNote}</p>
    </div>
  );
}
