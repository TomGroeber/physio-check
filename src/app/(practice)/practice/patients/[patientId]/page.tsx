import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { getSessionContext } from "@/server/services/session";
import {
  getPatientCompletionLogs,
  getPatientDetail,
  getPatientNextAppointment,
} from "@/server/services/practice";
import { formatDateShort, formatDateTime } from "@/lib/datetime";
import { branding } from "@/config/branding";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PatientPhoneForm } from "@/components/practice/patient-phone-form";
import { AuthorizationPanel } from "@/components/practice/authorization-panel";
import { DocumentPanel } from "@/components/practice/document-panel";
import { getPatientUnitStatus, listPatientAuthorizations } from "@/server/services/authorizations";
import { evaluateAuthorizationWarnings } from "@/lib/authorization-warnings";
import { authorizationWarningText } from "@/lib/authorization-warning-text";
import { todayInTimeZone } from "@/lib/datetime";
import { FormMessage } from "@/components/auth/form-message";
import { listPatientDocuments } from "@/server/services/documents";
import { getPatientInternalProfile } from "@/server/services/internal-profile";
import { InternalProfileForm } from "@/components/practice/internal-profile-form";
import { getPinnedPatient } from "@/server/services/pinned-patients";
import { PinPatientForm } from "@/components/practice/pin-patient-form";
import { ExercisePlanBuilder } from "@/components/practice/exercise-plan-builder";
import { getPlanEditorData } from "@/server/services/plans";
import { getPatientAdherenceAnalytics } from "@/server/services/adherence";
import { FeedbackReviewButton } from "@/components/practice/feedback-review-button";
import { PatientAvatar } from "@/components/patient-avatar";
import { de } from "@/messages/de";

export const metadata: Metadata = { title: de.practice.patients.title };

const t = de.practice.patientDetail;
const logStatus = de.practice.dashboard.logStatus;

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  completed: "default",
  partial: "secondary",
  too_difficult: "destructive",
  not_possible: "destructive",
};

export default async function PatientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ patientId: string }>;
  searchParams: Promise<{ range?: string }>;
}) {
  const session = await getSessionContext();
  if (!session?.memberships[0]) redirect("/login");
  const practiceId = session.memberships[0].practiceId;
  const [{ patientId }, { range }] = await Promise.all([params, searchParams]);
  const days = range === "30" ? 30 : 7;

  // Serverseitige Autorisierung: patientId aus der URL genügt nie allein.
  const link = await getPatientDetail(practiceId, patientId);
  if (!link) notFound();

  const [logs, planEditor, nextAppointment, authorizations, documents, unitStatus, internalProfile, pinned, analytics] =
    await Promise.all([
      getPatientCompletionLogs(practiceId, patientId, days),
      getPlanEditorData(practiceId, patientId),
      getPatientNextAppointment(practiceId, patientId),
      listPatientAuthorizations(practiceId, patientId),
      listPatientDocuments(practiceId, patientId),
      getPatientUnitStatus(patientId),
      getPatientInternalProfile(practiceId, patientId),
      getPinnedPatient(practiceId, patientId),
      getPatientAdherenceAnalytics(practiceId, patientId, days),
    ]);
  const warnings = unitStatus
    ? evaluateAuthorizationWarnings({
        remaining: unitStatus.remaining,
        validUntil: unitStatus.validUntil,
        todayIso: todayInTimeZone(branding.defaultTimeZone),
      })
    : [];

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Link
        href="/practice/patients"
        className="flex items-center gap-2 text-base font-semibold text-primary"
      >
        <HugeiconsIcon icon={ArrowLeft02Icon} strokeWidth={2} className="size-5" aria-hidden />
        {t.backToList}
      </Link>

      <div className="flex items-center gap-4">
        <PatientAvatar url={link.avatarUrl} name={link.patient.full_name} size="md" />
        <div>
          <h1 className="flex flex-wrap items-center gap-3 text-2xl font-bold">
            {link.patient.full_name}
            {pinned ? <Badge variant="secondary">{de.practice.pinned.badge}</Badge> : null}
          </h1>
          <p className="text-base text-muted-foreground">
            {t.connectedSince(
              formatDateShort(new Date(link.linked_at), branding.defaultTimeZone)
            )}
          </p>
        </div>
      </div>

      <section aria-labelledby="contact-heading" className="flex flex-col gap-3">
        <h2 id="contact-heading" className="text-xl font-bold">
          {t.contactHeading}
        </h2>
        <Card>
          <CardContent className="flex flex-col gap-4 p-5">
            <p className="text-base">
              {link.patient.phone ? (
                <a href={`tel:${link.patient.phone.replace(/[^\d+]/g, "")}`} className="font-bold text-primary">
                  {link.patient.phone}
                </a>
              ) : (
                <span className="text-muted-foreground">{t.phoneEmpty}</span>
              )}
            </p>
            <PatientPhoneForm patientId={patientId} initialPhone={link.patient.phone ?? ""} />
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="appointment-heading" className="flex flex-col gap-3">
        <h2 id="appointment-heading" className="text-xl font-bold">
          {t.nextAppointment}
        </h2>
        <Card>
          <CardContent className="p-4 text-base">
            {nextAppointment ? (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold">
                  {formatDateTime(
                    new Date(nextAppointment.starts_at),
                    nextAppointment.timezone
                  )}
                </span>
                <span className="text-muted-foreground">
                  {nextAppointment.therapist?.profiles?.full_name ?? ""}
                </span>
              </div>
            ) : (
              <span className="text-muted-foreground">{t.noAppointment}</span>
            )}
          </CardContent>
        </Card>
      </section>

      {warnings.length > 0 ? (
        <FormMessage warning={warnings.map((warning) => authorizationWarningText(warning)).join(" ")} />
      ) : null}

      <PinPatientForm patientId={patientId} pinned={pinned ? { note: pinned.note } : null} />

      <InternalProfileForm
        patientId={patientId}
        initialContent={internalProfile?.content ?? ""}
        updatedAt={
          internalProfile?.updated_at
            ? formatDateTime(new Date(internalProfile.updated_at), branding.defaultTimeZone)
            : null
        }
      />

      <AuthorizationPanel patientId={patientId} authorizations={authorizations} />

      <DocumentPanel patientId={patientId} documents={documents} />

      <ExercisePlanBuilder
        key={planEditor.plan?.currentVersionId ?? "new-plan"}
        patientId={patientId}
        data={planEditor}
      />

      <section aria-labelledby="analytics-heading" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="analytics-heading" className="text-xl font-bold">
              {de.practice.analytics.heading}
            </h2>
            <p className="text-sm text-muted-foreground">
              {de.practice.analytics.currentPlanHint}
            </p>
          </div>
          {analytics.planId ? (
            <Link
              href={`/practice/patients/${patientId}#plan-builder-heading`}
              className="text-sm font-semibold text-primary underline"
            >
              {de.practice.analytics.openPlan}
            </Link>
          ) : null}
        </div>

        {!analytics.planId ? (
          <Card><CardContent className="p-5 text-base text-muted-foreground">{de.practice.analytics.noPlan}</CardContent></Card>
        ) : (
          <>
            <p className="text-base font-semibold">{de.practice.analytics.rangeLabel(days)}</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                [de.practice.analytics.planned, analytics.planned],
                [de.practice.analytics.documented, analytics.documented],
                [de.practice.analytics.completed, analytics.completed],
                [de.practice.analytics.unread, analytics.unread],
                [de.practice.analytics.painFlags, analytics.painFlags],
                [de.practice.analytics.feedback, analytics.partial + analytics.tooDifficult + analytics.notPossible],
              ].map(([label, value]) => (
                <Card key={label}>
                  <CardContent className="p-4">
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-sm text-muted-foreground">{label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{de.practice.analytics.partial}: {analytics.partial}</Badge>
              <Badge variant="secondary">{de.practice.analytics.difficult}: {analytics.tooDifficult}</Badge>
              <Badge variant="secondary">{de.practice.analytics.notPossible}: {analytics.notPossible}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {de.practice.analytics.lastActivity}: {analytics.latestOverallAt
                ? formatDateTime(new Date(analytics.latestOverallAt), branding.defaultTimeZone)
                : de.practice.analytics.noActivity}
            </p>
            <Card>
              <CardContent className="flex flex-col gap-3 p-5">
                <h3 className="text-base font-bold">{de.practice.analytics.exerciseBreakdown}</h3>
                <ul className="flex flex-col divide-y">
                  {analytics.exercises.map((exercise) => (
                    <li key={exercise.planItemId} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
                      <div className="flex flex-wrap justify-between gap-2">
                        <span className="text-base font-semibold">{exercise.exerciseTitle}</span>
                        <Link href={`/practice/exercises/${exercise.exerciseId}`} className="text-sm font-semibold text-primary underline">
                          {de.practice.analytics.openExercise}
                        </Link>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {de.practice.analytics.ratio(exercise.documented, exercise.planned)} · {de.practice.analytics.completedRatio(exercise.completed, exercise.planned)}
                      </p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </>
        )}
      </section>

      <section aria-labelledby="logs-heading" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="logs-heading" className="text-xl font-bold">
            {t.logsHeading}
          </h2>
          <nav aria-label={t.logsHeading} className="flex gap-2">
            <Link
              href={`/practice/patients/${patientId}`}
              aria-current={days === 7 ? "page" : undefined}
              className={`rounded-md border px-3 py-2 text-sm font-semibold ${
                days === 7 ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              {t.range7}
            </Link>
            <Link
              href={`/practice/patients/${patientId}?range=30`}
              aria-current={days === 30 ? "page" : undefined}
              className={`rounded-md border px-3 py-2 text-sm font-semibold ${
                days === 30 ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              {t.range30}
            </Link>
          </nav>
        </div>

        <p className="text-sm text-muted-foreground">{t.selfReportNote}</p>

        {logs.length === 0 ? (
          <Card>
            <CardContent className="p-4 text-base text-muted-foreground">
              {t.noLogs}
            </CardContent>
          </Card>
        ) : (
          <ul className="flex flex-col gap-2">
            {logs.map((log) => (
              <li key={log.id}>
                <Card>
                  <CardContent className="flex flex-col gap-2 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-base font-semibold">
                        {log.exercise_plan_items?.exercises?.title ?? "Übung"}
                      </span>
                      <span className="flex flex-wrap gap-2">
                        {!log.reviewed_at ? <Badge variant="secondary">{de.practice.analytics.newBadge}</Badge> : null}
                        <Badge variant={statusVariant[log.status] ?? "secondary"}>
                          {logStatus[log.status]}
                        </Badge>
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(
                        new Date(log.performed_at),
                        branding.defaultTimeZone
                      )}
                      {` · ${t.occurrence(log.occurrence_index)}`}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      {log.sets_completed !== null ? (
                        <span>{t.setsCompleted(log.sets_completed)}</span>
                      ) : null}
                      {log.pain_before !== null ? (
                        <span>{t.painBefore(log.pain_before)}</span>
                      ) : null}
                      {log.pain_after !== null ? (
                        <span>{t.painAfter(log.pain_after)}</span>
                      ) : null}
                    </div>
                    {log.note ? (
                      <p className="rounded-md bg-muted p-2 text-sm">
                        <span className="font-semibold">{t.patientNote}: </span>
                        {log.note}
                      </p>
                    ) : null}
                    {!log.reviewed_at ? (
                      <FeedbackReviewButton logId={log.id} patientId={patientId} />
                    ) : null}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
