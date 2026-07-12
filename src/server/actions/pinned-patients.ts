"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/server/db/server-client";
import { getSessionContext } from "@/server/services/session";
import { getPatientDetail } from "@/server/services/practice";

export type PinActionState = { error?: string; success?: string };

const pinSchema = z.object({
  patientId: z.uuid(),
  note: z.string().trim().max(200, "Die Notiz darf höchstens 200 Zeichen lang sein."),
});
const unpinSchema = z.object({ patientId: z.uuid() });

async function authorizedContext(patientId: string) {
  const session = await getSessionContext();
  const membership = session?.memberships[0];
  if (!session || !membership) return null;
  const patient = await getPatientDetail(membership.practiceId, patientId);
  return patient ? { session, membership } : null;
}

export async function pinPatientAction(
  _state: PinActionState,
  formData: FormData
): Promise<PinActionState> {
  const parsed = pinSchema.safeParse({
    patientId: formData.get("patientId"),
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const context = await authorizedContext(parsed.data.patientId);
  if (!context) return { error: "Kein Zugriff auf diesen Patienten." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("pinned_patients").upsert(
    {
      practice_id: context.membership.practiceId,
      patient_profile_id: parsed.data.patientId,
      note: parsed.data.note,
      pinned_by: context.membership.memberId,
    },
    { onConflict: "practice_id,patient_profile_id" }
  );
  if (error) return { error: "Die Markierung konnte nicht gespeichert werden." };
  revalidatePath(`/practice/patients/${parsed.data.patientId}`);
  revalidatePath("/practice/patients");
  revalidatePath("/practice");
  return { success: "Der Patient ist jetzt markiert." };
}

export async function unpinPatientAction(
  _state: PinActionState,
  formData: FormData
): Promise<PinActionState> {
  const parsed = unpinSchema.safeParse({ patientId: formData.get("patientId") });
  if (!parsed.success) return { error: "Ungültige Anfrage." };
  const context = await authorizedContext(parsed.data.patientId);
  if (!context) return { error: "Kein Zugriff auf diesen Patienten." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("pinned_patients")
    .delete()
    .eq("practice_id", context.membership.practiceId)
    .eq("patient_profile_id", parsed.data.patientId);
  if (error) return { error: "Die Markierung konnte nicht entfernt werden." };
  revalidatePath(`/practice/patients/${parsed.data.patientId}`);
  revalidatePath("/practice/patients");
  revalidatePath("/practice");
  return { success: "Die Markierung wurde entfernt." };
}
