"use client";

import { useActionState } from "react";
import {
  pinPatientAction,
  unpinPatientAction,
  type PinActionState,
} from "@/server/actions/pinned-patients";
import { FormMessage } from "@/components/auth/form-message";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { de } from "@/messages/de";

const t = de.practice.pinned;

/** Patient markieren/Markierung entfernen (nur intern sichtbar). */
export function PinPatientForm({
  patientId,
  pinned,
}: {
  patientId: string;
  pinned: { note: string } | null;
}) {
  const [pinState, pinAction, pinning] = useActionState<PinActionState, FormData>(pinPatientAction, {});
  const [unpinState, unpinAction, unpinning] = useActionState<PinActionState, FormData>(unpinPatientAction, {});

  return (
    <section className="flex flex-col gap-3" aria-labelledby="pin-heading">
      <div>
        <h2 id="pin-heading" className="text-xl font-bold">
          {t.heading}
        </h2>
        <p className="text-sm text-muted-foreground">{t.hint}</p>
      </div>
      <Card>
        <CardContent className="p-5">
          {pinned ? (
            <form action={unpinAction} className="flex flex-col gap-3">
              <input type="hidden" name="patientId" value={patientId} />
              <p className="text-base font-semibold">{t.pinnedState}</p>
              {pinned.note ? <p className="text-base">{pinned.note}</p> : null}
              <FormMessage error={unpinState.error} success={unpinState.success} />
              <Button type="submit" variant="outline" disabled={unpinning} className="h-11 text-base">
                {unpinning ? de.common.loading : t.unpin}
              </Button>
            </form>
          ) : (
            <form action={pinAction} className="flex flex-col gap-3">
              <input type="hidden" name="patientId" value={patientId} />
              <Label htmlFor="pin-note">{t.noteLabel}</Label>
              <Input id="pin-note" name="note" maxLength={200} placeholder={t.notePlaceholder} />
              <FormMessage error={pinState.error} success={pinState.success} />
              <Button type="submit" disabled={pinning} className="h-11 text-base">
                {pinning ? de.common.loading : t.pin}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
