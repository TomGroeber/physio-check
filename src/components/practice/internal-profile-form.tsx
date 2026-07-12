"use client";

import { useActionState } from "react";
import {
  savePatientInternalProfileAction,
  type DocumentActionState,
} from "@/server/actions/documents";
import { FormMessage } from "@/components/auth/form-message";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { de } from "@/messages/de";

const t = de.practice.internalProfile;

/** Internes Kurzprofil der Praxis zu einem Patienten (für Patienten unsichtbar). */
export function InternalProfileForm({
  patientId,
  initialContent,
  updatedAt,
}: {
  patientId: string;
  initialContent: string;
  updatedAt: string | null;
}) {
  const [state, action, pending] = useActionState<DocumentActionState, FormData>(
    savePatientInternalProfileAction,
    {}
  );

  return (
    <section className="flex flex-col gap-3" aria-labelledby="internal-profile-heading">
      <div>
        <h2 id="internal-profile-heading" className="text-xl font-bold">
          {t.heading}
        </h2>
        <p className="text-sm text-muted-foreground">{t.hint}</p>
      </div>
      <Card>
        <CardContent className="p-5">
          <form action={action} className="flex flex-col gap-3">
            <input type="hidden" name="patientId" value={patientId} />
            <Label htmlFor="internal-profile-content">{t.label}</Label>
            <Textarea
              id="internal-profile-content"
              name="content"
              defaultValue={initialContent}
              maxLength={2000}
              rows={5}
            />
            <FormMessage error={state.error} success={state.success} />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button type="submit" disabled={pending} className="h-11 text-base">
                {pending ? de.common.loading : t.save}
              </Button>
              {updatedAt ? (
                <span className="text-sm text-muted-foreground">{t.updatedAt(updatedAt)}</span>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
