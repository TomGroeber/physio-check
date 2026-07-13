"use server";

import { revalidatePath } from "next/cache";
import { de } from "@/messages/de";
import {
  notificationIdSchema,
  reminderPreferencesSchema,
} from "@/lib/validation/reminders";
import { createSupabaseServerClient } from "@/server/db/server-client";
import { getSessionContext } from "@/server/services/session";
import { updatePatientReminderPreferences } from "@/server/services/reminders";

export type ReminderActionState = { error?: string; success?: string };

export async function updateReminderPreferencesAction(
  _state: ReminderActionState,
  formData: FormData
): Promise<ReminderActionState> {
  const parsed = reminderPreferencesSchema.safeParse({
    exerciseRemindersEnabled: formData.get("exerciseRemindersEnabled") === "on",
    planUpdatesEnabled: formData.get("planUpdatesEnabled") === "on",
    quietStart: formData.get("quietStart"),
    quietEnd: formData.get("quietEnd"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const session = await getSessionContext();
  if (!session || !session.patientLink || session.memberships.length > 0) {
    return { error: de.errors.forbiddenBody };
  }

  try {
    await updatePatientReminderPreferences(session.userId, parsed.data);
  } catch {
    return { error: de.patient.reminders.saveError };
  }
  revalidatePath("/profile");
  revalidatePath("/today");
  return { success: de.patient.reminders.saved };
}

export async function markNotificationReadAction(
  _state: ReminderActionState,
  formData: FormData
): Promise<ReminderActionState> {
  const parsed = notificationIdSchema.safeParse(formData.get("notificationId"));
  if (!parsed.success) return { error: de.patient.reminders.readError };
  const session = await getSessionContext();
  if (!session || !session.patientLink || session.memberships.length > 0) {
    return { error: de.errors.forbiddenBody };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("mark_notification_read", {
    p_notification_id: parsed.data,
  });
  if (error) return { error: de.patient.reminders.readError };

  revalidatePath("/today");
  return {};
}

