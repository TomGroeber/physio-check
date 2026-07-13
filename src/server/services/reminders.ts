import "server-only";

import { createSupabaseServerClient } from "@/server/db/server-client";
import { timeValueInTimeZone } from "@/lib/datetime";
import {
  DEFAULT_REMINDER_PREFERENCES,
  shouldShowExerciseReminder,
} from "@/lib/reminders";

export type PatientReminderPreferences = {
  exerciseRemindersEnabled: boolean;
  planUpdatesEnabled: boolean;
  quietStart: string;
  quietEnd: string;
};

export type PlanUpdateNotification = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
};

function toTimeValue(value: string): string {
  return value.slice(0, 5);
}

export async function getPatientReminderPreferences(
  userId: string
): Promise<PatientReminderPreferences> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("patient_reminder_preferences")
    .select(
      "exercise_reminders_enabled, plan_updates_enabled, quiet_start, quiet_end"
    )
    .eq("profile_id", userId)
    .maybeSingle();
  if (error) throw new Error(`Reminder preferences could not be loaded: ${error.message}`);

  if (!data) return { ...DEFAULT_REMINDER_PREFERENCES };
  return {
    exerciseRemindersEnabled: data.exercise_reminders_enabled,
    planUpdatesEnabled: data.plan_updates_enabled,
    quietStart: toTimeValue(data.quiet_start),
    quietEnd: toTimeValue(data.quiet_end),
  };
}

export async function updatePatientReminderPreferences(
  userId: string,
  preferences: PatientReminderPreferences
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("patient_reminder_preferences").upsert(
    {
      profile_id: userId,
      exercise_reminders_enabled: preferences.exerciseRemindersEnabled,
      plan_updates_enabled: preferences.planUpdatesEnabled,
      quiet_start: preferences.quietStart,
      quiet_end: preferences.quietEnd,
    },
    { onConflict: "profile_id" }
  );
  if (error) throw new Error(`Reminder preferences could not be saved: ${error.message}`);
}

export async function getPatientReminderData(input: {
  userId: string;
  timezone: string;
  remainingOccurrences: number;
  now?: Date;
}) {
  const preferences = await getPatientReminderPreferences(input.userId);
  const localTime = timeValueInTimeZone(input.now ?? new Date(), input.timezone);
  const showExerciseReminder = shouldShowExerciseReminder({
    enabled: preferences.exerciseRemindersEnabled,
    remainingOccurrences: input.remainingOccurrences,
    localTime,
    quietStart: preferences.quietStart,
    quietEnd: preferences.quietEnd,
  });

  let planUpdates: PlanUpdateNotification[] = [];
  if (preferences.planUpdatesEnabled) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("notifications")
      .select("id, title, body, created_at")
      .eq("recipient_profile_id", input.userId)
      .in("type", ["exercise_plan_published", "exercise_plan_archived"])
      .is("read_at", null)
      .order("created_at", { ascending: false })
      .limit(5);
    if (error) throw new Error(`Plan notifications could not be loaded: ${error.message}`);
    planUpdates = (data ?? []).map((notification) => ({
      id: notification.id,
      title: notification.title,
      body: notification.body,
      createdAt: notification.created_at,
    }));
  }

  return { preferences, showExerciseReminder, planUpdates };
}

