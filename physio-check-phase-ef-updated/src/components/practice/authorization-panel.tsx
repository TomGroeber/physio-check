"use client";

import { useActionState } from "react";
import {
  adjustAuthorizationAction,
  archiveAuthorizationAction,
  createAuthorizationAction,
  type AuthorizationActionState,
} from "@/server/actions/authorizations";
import { FormMessage } from "@/components/auth/form-message";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { de } from "@/messages/de";

type Authorization = {
  id: string;
  title: string;
  reference: string;
  issued_on: string;
  valid_from: string | null;
  valid_until: string | null;
  status: "active" | "exhausted" | "expired" | "archived";
  prescribing_doctor: string;
  remaining: number;
  adjustedTotal: number;
  treatment_authorization_adjustments: {
    id: string;
    session_delta: number;
    reason: string;
    created_at: string;
  }[];
  appointment_authorization_usages: { id: string; sessions_used: number; created_at: string }[];
};

const statusText = {
  active: "Aktiv",
  exhausted: "Ausgeschöpft",
  expired: "Abgelaufen",
  archived: "Archiviert",
};

export function AuthorizationPanel({ patientId, authorizations }: { patientId: string; authorizations: Authorization[] }) {
  const [createState, createAction, creating] = useActionState<AuthorizationActionState, FormData>(
    createAuthorizationAction,
    {}
  );

  return (
    <section className="flex flex-col gap-4" aria-labelledby="authorizations-heading">
      <div>
        <h2 id="authorizations-heading" className="text-xl font-bold">{de.practice.authorizations.title}</h2>
        <p className="text-sm text-muted-foreground">{de.practice.authorizations.coverageHint}</p>
      </div>

      {authorizations.map((authorization) => (
        <AuthorizationCard key={authorization.id} patientId={patientId} authorization={authorization} />
      ))}

      <Card>
        <CardContent className="p-5">
          <form action={createAction} className="grid gap-4 md:grid-cols-2">
            <input type="hidden" name="patientId" value={patientId} />
            <div className="md:col-span-2"><h3 className="font-bold">{de.practice.authorizations.add}</h3></div>
            <FormMessage error={createState.error} success={createState.success} />
            <Field label="Bezeichnung" name="title" defaultValue="Ärztliche Verordnung" required />
            <Field label="Interne Referenz (optional)" name="reference" />
            <Field label="Verordnete Sitzungen" name="prescribedSessions" type="number" min="1" max="500" required />
            <Field label="Ausstellungsdatum" name="issuedOn" type="date" required />
            <Field label="Gültig ab (optional)" name="validFrom" type="date" />
            <Field label="Gültig bis (optional)" name="validUntil" type="date" />
            <Field label="Verordnender Arzt (optional)" name="prescribingDoctor" />
            <div className="flex flex-col gap-2">
              <Label htmlFor="authorization-note">Interne Notiz (optional)</Label>
              <Textarea id="authorization-note" name="note" maxLength={1000} />
            </div>
            <Button type="submit" disabled={creating} className="h-11 md:col-span-2">
              {creating ? de.common.loading : de.practice.authorizations.save}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}

function AuthorizationCard({ patientId, authorization }: { patientId: string; authorization: Authorization }) {
  const [state, action, pending] = useActionState<AuthorizationActionState, FormData>(adjustAuthorizationAction, {});
  const used = authorization.appointment_authorization_usages.reduce(
    (sum, usage) => sum + usage.sessions_used,
    0
  );
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold">{authorization.title}</h3>
            <p className="text-sm text-muted-foreground">
              {authorization.reference || `Ausgestellt am ${authorization.issued_on}`}
            </p>
          </div>
          <Badge variant={authorization.remaining === 0 ? "destructive" : "secondary"}>{statusText[authorization.status]}</Badge>
        </div>
        <div className="rounded-lg bg-primary/10 p-4">
          <p className="text-2xl font-bold">{authorization.remaining} von {authorization.adjustedTotal}</p>
          <p className="text-sm text-muted-foreground">Sitzungen verbleibend · {used} angerechnet</p>
        </div>
        {authorization.prescribing_doctor ? <p className="text-sm">Arzt: {authorization.prescribing_doctor}</p> : null}
        {authorization.treatment_authorization_adjustments.length ? (
          <ul className="text-sm text-muted-foreground">
            {authorization.treatment_authorization_adjustments.map((adjustment) => (
              <li key={adjustment.id}>{adjustment.session_delta > 0 ? "+" : ""}{adjustment.session_delta}: {adjustment.reason}</li>
            ))}
          </ul>
        ) : null}
        {authorization.status !== "archived" ? (
          <form action={action} className="grid gap-3 rounded-lg border p-4 md:grid-cols-[8rem_1fr_auto] md:items-end">
            <input type="hidden" name="authorizationId" value={authorization.id} />
            <input type="hidden" name="patientId" value={patientId} />
            <div className="flex flex-col gap-2">
              <Label htmlFor={`delta-${authorization.id}`}>Anpassung</Label>
              <Input id={`delta-${authorization.id}`} name="sessionDelta" type="number" placeholder="z. B. +6" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`reason-${authorization.id}`}>Grund</Label>
              <Input id={`reason-${authorization.id}`} name="reason" minLength={3} maxLength={500} required />
            </div>
            <Button type="submit" disabled={pending} className="h-10">Anpassen</Button>
            <div className="md:col-span-3"><FormMessage error={state.error} success={state.success} /></div>
          </form>
        ) : null}
        {authorization.status !== "archived" ? (
          <form action={archiveAuthorizationAction}>
            <input type="hidden" name="authorizationId" value={authorization.id} />
            <input type="hidden" name="patientId" value={patientId} />
            <Button type="submit" variant="outline">Verordnung archivieren</Button>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Field({ label, name, ...props }: { label: string; name: string } & React.ComponentProps<typeof Input>) {
  return <div className="flex flex-col gap-2"><Label htmlFor={name}>{label}</Label><Input id={name} name={name} {...props} /></div>;
}
