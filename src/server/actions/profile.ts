"use server";

import { revalidatePath } from "next/cache";
import { getSessionContext } from "@/server/services/session";
import { getPatientDetail } from "@/server/services/practice";
import {
  setOwnCalendarColor,
  setPatientPhone,
  updateOwnPhone,
} from "@/server/services/profile";
import {
  setCalendarColorSchema,
  updateOwnPhoneSchema,
  updatePatientPhoneSchema,
} from "@/lib/validation/profile";
import { de } from "@/messages/de";

export type ProfileActionState = { error?: string; success?: string };

/** Patient (oder jede angemeldete Person) pflegt die eigene Telefonnummer. */
export async function updateOwnPhoneAction(
  _state: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const parsed = updateOwnPhoneSchema.safeParse({ phone: formData.get("phone") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const session = await getSessionContext();
  if (!session) return { error: de.errors.notSignedIn };

  try {
    await updateOwnPhone(session.userId, parsed.data.phone);
  } catch {
    return { error: de.profilePhone.saveError };
  }
  revalidatePath("/profile");
  return { success: de.profilePhone.saved };
}

/** Praxis korrigiert die Telefonnummer eines aktiv verbundenen Patienten. */
export async function updatePatientPhoneAction(
  _state: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const parsed = updatePatientPhoneSchema.safeParse({
    patientId: formData.get("patientId"),
    phone: formData.get("phone"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const session = await getSessionContext();
  const membership = session?.memberships[0];
  if (!session || !membership) return { error: de.errors.notSignedIn };
  const patient = await getPatientDetail(membership.practiceId, parsed.data.patientId);
  if (!patient) return { error: "Kein Zugriff auf diesen Patienten." };

  try {
    await setPatientPhone(parsed.data.patientId, parsed.data.phone);
  } catch {
    return { error: de.profilePhone.saveError };
  }
  revalidatePath(`/practice/patients/${parsed.data.patientId}`);
  revalidatePath("/practice/patients");
  return { success: de.profilePhone.saved };
}

/** Praxismitglied wählt die eigene Kalenderfarbe. */
export async function setCalendarColorAction(
  _state: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const parsed = setCalendarColorSchema.safeParse({ color: formData.get("color") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const session = await getSessionContext();
  const membership = session?.memberships[0];
  if (!session || !membership) return { error: de.errors.notSignedIn };

  try {
    await setOwnCalendarColor(membership.memberId, session.userId, parsed.data.color);
  } catch {
    return { error: de.practice.settings.colorSaveError };
  }
  revalidatePath("/practice/settings");
  revalidatePath("/practice/calendar");
  return { success: de.practice.settings.colorSaved };
}
