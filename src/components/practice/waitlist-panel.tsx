"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  addWaitlistEntryAction,
  deleteWaitlistEntryAction,
  resolveWaitlistEntryAction,
  type WaitlistActionState,
} from "@/server/actions/waitlist";
import { FormMessage } from "@/components/auth/form-message";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { de } from "@/messages/de";

const t = de.practice.waitlist;

type WaitlistEntry = {
  id: string;
  preferred_times: string;
  priority: "normal" | "high";
  note: string;
  status: "waiting" | "resolved";
  created_at: string;
  resolved_at: string | null;
  patient_profile_id: string;
  patient: { full_name: string; phone: string | null } | null;
  createdAtText: string;
  resolvedAtText: string | null;
};

export function WaitlistPanel({
  patients,
  entries,
}: {
  patients: { id: string; fullName: string }[];
  entries: WaitlistEntry[];
}) {
  const [addState, addAction, adding] = useActionState<WaitlistActionState, FormData>(addWaitlistEntryAction, {});
  const [resolveState, resolveAction, resolving] = useActionState<WaitlistActionState, FormData>(resolveWaitlistEntryAction, {});
  const [deleteState, deleteAction, deleting] = useActionState<WaitlistActionState, FormData>(deleteWaitlistEntryAction, {});

  const waiting = entries.filter((entry) => entry.status === "waiting");
  const resolved = entries.filter((entry) => entry.status === "resolved");

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="p-5">
          <form action={addAction} className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <h2 className="text-lg font-bold">{t.addTitle}</h2>
            </div>
            <FormMessage error={addState.error} success={addState.success} />
            <div className="flex flex-col gap-2">
              <Label htmlFor="waitlist-patient">{t.patientLabel}</Label>
              <select id="waitlist-patient" name="patientId" required defaultValue="" className="h-10 rounded-md border bg-background px-3">
                <option value="" disabled>
                  {t.patientPlaceholder}
                </option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.fullName}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="waitlist-priority">{t.priorityLabel}</Label>
              <select id="waitlist-priority" name="priority" defaultValue="normal" className="h-10 rounded-md border bg-background px-3">
                <option value="normal">{t.priorityNormal}</option>
                <option value="high">{t.priorityHigh}</option>
              </select>
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="waitlist-times">{t.preferredTimesLabel}</Label>
              <Input id="waitlist-times" name="preferredTimes" maxLength={200} placeholder={t.preferredTimesPlaceholder} />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="waitlist-note">{t.noteLabel}</Label>
              <Textarea id="waitlist-note" name="note" maxLength={500} rows={2} />
            </div>
            <Button type="submit" disabled={adding} className="h-11 text-base md:col-span-2">
              {adding ? de.common.loading : t.add}
            </Button>
          </form>
        </CardContent>
      </Card>

      <section className="flex flex-col gap-3" aria-labelledby="waiting-heading">
        <h2 id="waiting-heading" className="text-xl font-bold">
          {t.waitingHeading} ({waiting.length})
        </h2>
        <FormMessage error={resolveState.error ?? deleteState.error} success={resolveState.success ?? deleteState.success} />
        {waiting.length === 0 ? (
          <Card>
            <CardContent className="p-5 text-base text-muted-foreground">{t.emptyWaiting}</CardContent>
          </Card>
        ) : (
          <ul className="flex flex-col gap-2">
            {waiting.map((entry) => (
              <li key={entry.id}>
                <Card>
                  <CardContent className="flex flex-col gap-3 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-col gap-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <Link href={`/practice/patients/${entry.patient_profile_id}`} className="text-base font-semibold text-primary">
                            {entry.patient?.full_name ?? "Unbekannt"}
                          </Link>
                          {entry.priority === "high" ? <Badge>{t.priorityHigh}</Badge> : null}
                        </span>
                        <span className="text-sm text-muted-foreground">{t.waitingSince(entry.createdAtText)}</span>
                        {entry.preferred_times ? <span className="text-sm">{entry.preferred_times}</span> : null}
                        {entry.note ? <span className="text-sm text-muted-foreground">{entry.note}</span> : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <form action={resolveAction}>
                          <input type="hidden" name="entryId" value={entry.id} />
                          <Button type="submit" variant="secondary" disabled={resolving}>
                            {t.resolve}
                          </Button>
                        </form>
                        <form action={deleteAction}>
                          <input type="hidden" name="entryId" value={entry.id} />
                          <Button type="submit" variant="outline" disabled={deleting}>
                            {t.delete}
                          </Button>
                        </form>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      {resolved.length ? (
        <section className="flex flex-col gap-3" aria-labelledby="resolved-heading">
          <h2 id="resolved-heading" className="text-xl font-bold">
            {t.resolvedHeading} ({resolved.length})
          </h2>
          <ul className="flex flex-col gap-2">
            {resolved.map((entry) => (
              <li key={entry.id}>
                <Card>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-base font-semibold">{entry.patient?.full_name ?? "Unbekannt"}</span>
                      {entry.resolvedAtText ? (
                        <span className="text-sm text-muted-foreground">{t.resolvedAt(entry.resolvedAtText)}</span>
                      ) : null}
                    </div>
                    <form action={deleteAction}>
                      <input type="hidden" name="entryId" value={entry.id} />
                      <Button type="submit" variant="outline" disabled={deleting}>
                        {t.delete}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
