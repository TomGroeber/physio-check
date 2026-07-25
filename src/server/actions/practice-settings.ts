"use server";

import { revalidatePath } from "next/cache";
import { getSessionContext } from "@/server/services/session";
import { createSupabaseServerClient } from "@/server/db/server-client";
import { updatePracticeProfileAsPracticeAdmin, getPractice } from "@/server/services/practice";
import { practiceProfileSchema, practiceSettingsSchema } from "@/lib/validation/platform-admin";
import type { SimpleActionState } from "@/server/actions/platform-admin";
import { de } from "@/messages/de";

/** Praxisadmin bearbeitet die Stammdaten der eigenen Praxis. */
export async function updateOwnPracticeProfileAction(
  _previousState: SimpleActionState,
  formData: FormData
): Promise<SimpleActionState> {
  const session = await getSessionContext();
  const membership = session?.memberships.find((m) => m.role === "admin");
  if (!membership) return { error: de.errors.forbiddenBody };

  const parsed = practiceProfileSchema.safeParse({
    name: formData.get("name"),
    addressStreet: formData.get("addressStreet"),
    addressPostalCode: formData.get("addressPostalCode"),
    addressCity: formData.get("addressCity"),
    phone: formData.get("phone"),
    timezone: formData.get("timezone"),
    supportEmail: formData.get("supportEmail"),
    supportUrl: formData.get("supportUrl"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };

  const ok = await updatePracticeProfileAsPracticeAdmin(membership.practiceId, parsed.data);
  if (!ok) return { error: "Die Änderung konnte nicht gespeichert werden." };
  revalidatePath("/practice/settings");
  return { success: true };
}

/** Praxisadmin bearbeitet die Einstellungen der eigenen Praxis. */
export async function updateOwnPracticeSettingsAction(
  _previousState: SimpleActionState,
  formData: FormData
): Promise<SimpleActionState> {
  const session = await getSessionContext();
  const membership = session?.memberships.find((m) => m.role === "admin");
  if (!membership) return { error: de.errors.forbiddenBody };

  const current = await getPractice(membership.practiceId);
  const parsed = practiceSettingsSchema.safeParse({
    ...(current?.settings as object | undefined),
    defaultAppointmentDurationMinutes: Number(formData.get("defaultAppointmentDurationMinutes")),
    cancellationNoticeHours: formData.get("cancellationNoticeHours"),
    cancellationNoticeText: formData.get("cancellationNoticeText"),
    lowSessionsThreshold: formData.get("lowSessionsThreshold"),
    patientSafetyText: formData.get("patientSafetyText"),
    accentColor: formData.get("accentColor"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("update_practice_settings", {
    p_practice_id: membership.practiceId,
    p_settings: parsed.data,
  });
  if (error) return { error: "Die Einstellungen konnten nicht gespeichert werden." };
  revalidatePath("/practice/settings");
  return { success: true };
}
