"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/server/db/server-client";
import { getSessionContext } from "@/server/services/session";
import { getPatientDetail } from "@/server/services/practice";

export type WaitlistActionState = { error?: string; success?: string };

const addSchema = z.object({
  patientId: z.uuid("Bitte wählen Sie einen Patienten aus."),
  preferredTimes: z
    .string()
    .trim()
    .max(200, "Wunschzeiten dürfen höchstens 200 Zeichen lang sein."),
  priority: z.enum(["normal", "high"]),
  note: z.string().trim().max(500, "Die Notiz darf höchstens 500 Zeichen lang sein."),
});
const entrySchema = z.object({ entryId: z.uuid() });

async function practiceContext() {
  const session = await getSessionContext();
  const membership = session?.memberships[0];
  if (!session || !membership) return null;
  return { session, membership };
}

export async function addWaitlistEntryAction(
  _state: WaitlistActionState,
  formData: FormData
): Promise<WaitlistActionState> {
  const parsed = addSchema.safeParse({
    patientId: formData.get("patientId"),
    preferredTimes: formData.get("preferredTimes") ?? "",
    priority: formData.get("priority") ?? "normal",
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const context = await practiceContext();
  if (!context) return { error: "Sie sind nicht für eine Praxis angemeldet." };
  const patient = await getPatientDetail(context.membership.practiceId, parsed.data.patientId);
  if (!patient) return { error: "Kein Zugriff auf diesen Patienten." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("practice_waitlist_entries").insert({
    practice_id: context.membership.practiceId,
    patient_profile_id: parsed.data.patientId,
    preferred_times: parsed.data.preferredTimes,
    priority: parsed.data.priority,
    note: parsed.data.note,
    created_by: context.membership.memberId,
  });
  if (error) {
    // 23505 = partieller Unique-Index: bereits ein offener Eintrag.
    if (error.code === "23505") {
      return { error: "Für diesen Patienten gibt es bereits einen offenen Wartelisten-Eintrag." };
    }
    return { error: "Der Eintrag konnte nicht angelegt werden." };
  }
  revalidatePath("/practice/waitlist");
  revalidatePath("/practice");
  return { success: "Der Patient steht jetzt auf der Warteliste." };
}

export async function resolveWaitlistEntryAction(
  _state: WaitlistActionState,
  formData: FormData
): Promise<WaitlistActionState> {
  const parsed = entrySchema.safeParse({ entryId: formData.get("entryId") });
  if (!parsed.success) return { error: "Ungültige Anfrage." };
  const context = await practiceContext();
  if (!context) return { error: "Sie sind nicht für eine Praxis angemeldet." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("practice_waitlist_entries")
    .update({ status: "resolved", resolved_at: new Date().toISOString() })
    .eq("id", parsed.data.entryId)
    .eq("practice_id", context.membership.practiceId)
    .eq("status", "waiting")
    .select("id");
  if (error || !data?.length) return { error: "Der Eintrag konnte nicht abgeschlossen werden." };
  revalidatePath("/practice/waitlist");
  revalidatePath("/practice");
  return { success: "Der Eintrag wurde als erledigt markiert." };
}

export async function deleteWaitlistEntryAction(
  _state: WaitlistActionState,
  formData: FormData
): Promise<WaitlistActionState> {
  const parsed = entrySchema.safeParse({ entryId: formData.get("entryId") });
  if (!parsed.success) return { error: "Ungültige Anfrage." };
  const context = await practiceContext();
  if (!context) return { error: "Sie sind nicht für eine Praxis angemeldet." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("practice_waitlist_entries")
    .delete()
    .eq("id", parsed.data.entryId)
    .eq("practice_id", context.membership.practiceId)
    .select("id");
  if (error || !data?.length) return { error: "Der Eintrag konnte nicht gelöscht werden." };
  revalidatePath("/practice/waitlist");
  revalidatePath("/practice");
  return { success: "Der Eintrag wurde gelöscht." };
}
