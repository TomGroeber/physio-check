"use server";

import { redirect } from "next/navigation";
import { redeemPracticeMemberRecovery } from "@/server/services/practice-member-recovery";
import { passwordSchema } from "@/lib/validation/auth";
import { de } from "@/messages/de";

export type PracticeRecoveryFormState = { error?: string };

/**
 * Löst eine Zugangs-Wiederherstellung ein (D-113): legt ein neues
 * Konto mit der vom Plattformadmin festgelegten E-Mail-Adresse an und
 * hängt die bestehende Praxismitgliedschaft darauf um. Kein
 * Session-Handling danach - die Person meldet sich bewusst separat
 * mit dem neuen Konto an.
 */
export async function redeemPracticeMemberRecoveryAction(
  token: string,
  _previousState: PracticeRecoveryFormState,
  formData: FormData
): Promise<PracticeRecoveryFormState> {
  const parsed = passwordSchema.safeParse(formData.get("password"));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };

  const result = await redeemPracticeMemberRecovery(token, parsed.data);
  if (!result.ok) {
    if (result.reason === "invalid") redirect("/practice-recovery/invalid");
    if (result.reason === "email_in_use") return { error: de.admin.practiceRecovery.emailInUse };
    return { error: de.admin.practiceRecovery.error };
  }

  redirect("/login?recovered=1");
}
