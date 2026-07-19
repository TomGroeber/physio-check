"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSessionContext } from "@/server/services/session";
import { getPatientDetail } from "@/server/services/practice";
import {
  removePatientCalendarColor,
  setPatientCalendarColor,
} from "@/server/services/patient-calendar-colors";
import { CALENDAR_COLORS } from "@/lib/calendar-colors";
import { de } from "@/messages/de";

const schema = z.object({
  patientId: z.uuid(),
  // "none" entfernt die Zuordnung – der Patient erscheint neutral.
  color: z.enum([...CALENDAR_COLORS, "none"]),
});

export type PatientColorState = { error?: string };

/**
 * Kalenderfarbe eines Patienten setzen oder entfernen. Die Praxis-ID
 * stammt ausschließlich aus der verifizierten Mitgliedschaft; zusätzlich
 * wird die aktive Verbindung zum Patienten geprüft (RLS als zweite
 * Verteidigungslinie). Erfolg bestätigt die Detailseite per Redirect mit
 * Query-Parameter (D-053: Rückgabezustand + revalidatePath erreicht den
 * Client nicht zuverlässig; auf dem Produktionsserver reproduzierbar).
 */
export async function setPatientCalendarColorAction(
  _state: PatientColorState,
  formData: FormData
): Promise<PatientColorState> {
  const parsed = schema.safeParse({
    patientId: formData.get("patientId"),
    color: formData.get("color"),
  });
  if (!parsed.success) return { error: de.common.error };

  const session = await getSessionContext();
  const membership = session?.memberships[0];
  if (!session || !membership) return { error: de.errors.notSignedIn };

  const link = await getPatientDetail(membership.practiceId, parsed.data.patientId);
  if (!link) return { error: de.common.error };

  try {
    if (parsed.data.color === "none") {
      await removePatientCalendarColor(membership.practiceId, parsed.data.patientId);
    } else {
      await setPatientCalendarColor(
        membership.practiceId,
        parsed.data.patientId,
        parsed.data.color
      );
    }
  } catch {
    return { error: de.common.error };
  }
  revalidatePath(`/practice/patients/${parsed.data.patientId}`);
  revalidatePath("/practice/calendar");
  redirect(`/practice/patients/${parsed.data.patientId}?calendar_color_saved=1`);
}
