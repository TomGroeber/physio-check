"use client";

import { useActionState } from "react";
import {
  updateReminderPreferencesAction,
  type ReminderActionState,
} from "@/server/actions/reminders";
import type { PatientReminderPreferences } from "@/server/services/reminders";
import { FormMessage } from "@/components/auth/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { de } from "@/messages/de";

const t = de.patient.reminders;

function PreferenceCheckbox({
  id,
  name,
  title,
  hint,
  defaultChecked,
}: {
  id: string;
  name: string;
  title: string;
  hint: string;
  defaultChecked: boolean;
}) {
  return (
    <label htmlFor={id} className="flex min-h-14 cursor-pointer items-start gap-3 rounded-lg border p-3">
      <input
        id={id}
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="mt-1 size-6 shrink-0 accent-primary"
      />
      <span>
        <span className="block text-base font-bold">{title}</span>
        <span className="block text-base text-muted-foreground">{hint}</span>
      </span>
    </label>
  );
}

export function ReminderPreferencesForm({
  preferences,
}: {
  preferences: PatientReminderPreferences;
}) {
  const [state, action, pending] = useActionState<ReminderActionState, FormData>(
    updateReminderPreferencesAction,
    {}
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      {/* Die Bereichsüberschrift „Erinnerungen“ stellt die Profilseite. */}
      <p className="text-base text-muted-foreground">{t.intro}</p>
      <PreferenceCheckbox
        id="exerciseRemindersEnabled"
        name="exerciseRemindersEnabled"
        title={t.exerciseTitle}
        hint={t.exerciseHint}
        defaultChecked={preferences.exerciseRemindersEnabled}
      />
      <PreferenceCheckbox
        id="planUpdatesEnabled"
        name="planUpdatesEnabled"
        title={t.planUpdatesTitle}
        hint={t.planUpdatesHint}
        defaultChecked={preferences.planUpdatesEnabled}
      />
      <fieldset className="rounded-lg border p-3">
        <legend className="px-1 text-base font-bold">{t.quietHours}</legend>
        <p className="mb-3 text-base text-muted-foreground">{t.quietHoursHint}</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="quietStart" className="text-base">{t.quietStart}</Label>
            <Input
              id="quietStart"
              name="quietStart"
              type="time"
              required
              defaultValue={preferences.quietStart}
              className="h-12 text-lg"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="quietEnd" className="text-base">{t.quietEnd}</Label>
            <Input
              id="quietEnd"
              name="quietEnd"
              type="time"
              required
              defaultValue={preferences.quietEnd}
              className="h-12 text-lg"
            />
          </div>
        </div>
      </fieldset>
      <FormMessage error={state.error} success={state.success} />
      <Button type="submit" disabled={pending} className="h-12 text-lg">
        {pending ? de.common.loading : t.save}
      </Button>
    </form>
  );
}
