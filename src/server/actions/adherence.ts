"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { de } from "@/messages/de";
import { createSupabaseServerClient } from "@/server/db/server-client";
import { getPatientDetail } from "@/server/services/practice";
import { getSessionContext } from "@/server/services/session";

export type FeedbackReviewState = { error?: string; success?: string };

const reviewSchema = z.object({
  logId: z.uuid(),
  patientId: z.uuid(),
});

export async function markFeedbackReviewedAction(
  _state: FeedbackReviewState,
  formData: FormData
): Promise<FeedbackReviewState> {
  const parsed = reviewSchema.safeParse({
    logId: formData.get("logId"),
    patientId: formData.get("patientId"),
  });
  if (!parsed.success) return { error: de.practice.analytics.reviewError };
  const session = await getSessionContext();
  const membership = session?.memberships[0];
  if (!session || !membership) return { error: de.errors.forbiddenBody };
  const patient = await getPatientDetail(membership.practiceId, parsed.data.patientId);
  if (!patient) return { error: de.errors.forbiddenBody };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("mark_completion_log_reviewed", {
    p_log_id: parsed.data.logId,
  });
  if (error) return { error: de.practice.analytics.reviewError };

  revalidatePath(`/practice/patients/${parsed.data.patientId}`);
  revalidatePath("/practice");
  return { success: de.practice.analytics.reviewed };
}
