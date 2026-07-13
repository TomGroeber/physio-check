"use client";

import { useActionState } from "react";
import {
  markNotificationReadAction,
  type ReminderActionState,
} from "@/server/actions/reminders";
import { FormMessage } from "@/components/auth/form-message";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { de } from "@/messages/de";

export function PlanNotificationCard({
  notification,
}: {
  notification: { id: string; title: string; body: string };
}) {
  const [state, action, pending] = useActionState<ReminderActionState, FormData>(
    markNotificationReadAction,
    {}
  );

  return (
    <Card className="border-primary/40 bg-primary/5">
      <CardContent className="flex flex-col gap-3 p-5">
        <div>
          <p className="text-lg font-bold">{notification.title}</p>
          {notification.body ? (
            <p className="text-base text-muted-foreground">{notification.body}</p>
          ) : null}
        </div>
        <form action={action} className="flex flex-col gap-2">
          <input type="hidden" name="notificationId" value={notification.id} />
          <FormMessage error={state.error} />
          <Button type="submit" variant="outline" disabled={pending} className="h-12 text-base">
            {pending ? de.common.loading : de.patient.reminders.markRead}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

