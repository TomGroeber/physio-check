"use server";

import { revalidatePath } from "next/cache";
import { archivePlanSchema, publishPlanSchema } from "@/lib/validation/plans";
import { de } from "@/messages/de";
import { getPatientDetail } from "@/server/services/practice";
import { getSessionContext } from "@/server/services/session";
import { archiveExercisePlan, publishExercisePlan } from "@/server/services/plans";

export type PlanActionState = { error?: string; success?: string };

async function verifiedPracticePatient(patientId: string) {
  const session = await getSessionContext();
  const membership = session?.memberships[0];
  if (!session || !membership) return null;
  const patient = await getPatientDetail(membership.practiceId, patientId);
  if (!patient) return null;
  return { session, membership };
}

export async function publishExercisePlanAction(
  _state: PlanActionState,
  formData: FormData
): Promise<PlanActionState> {
  let items: unknown;
  try {
    const rawItems = formData.get("items");
    items = JSON.parse(typeof rawItems === "string" ? rawItems : "");
  } catch {
    return { error: de.practice.plans.invalidItems };
  }

  const parsed = publishPlanSchema.safeParse({
    patientId: formData.get("patientId"),
    title: formData.get("title"),
    changeNote: formData.get("changeNote") ?? "",
    items,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? de.practice.plans.invalidItems };
  }

  const context = await verifiedPracticePatient(parsed.data.patientId);
  if (!context) return { error: de.errors.forbiddenBody };

  try {
    await publishExercisePlan(context.membership.practiceId, parsed.data);
  } catch (error) {
    return { error: error instanceof Error ? error.message : de.practice.plans.publishError };
  }

  revalidatePath(`/practice/patients/${parsed.data.patientId}`);
  revalidatePath("/today");
  return { success: de.practice.plans.published };
}

export async function archiveExercisePlanAction(
  _state: PlanActionState,
  formData: FormData
): Promise<PlanActionState> {
  const parsed = archivePlanSchema.safeParse({
    patientId: formData.get("patientId"),
    planId: formData.get("planId"),
  });
  if (!parsed.success) return { error: de.practice.plans.archiveError };
  const context = await verifiedPracticePatient(parsed.data.patientId);
  if (!context) return { error: de.errors.forbiddenBody };

  try {
    await archiveExercisePlan(
      context.membership.practiceId,
      parsed.data.patientId,
      parsed.data.planId
    );
  } catch (error) {
    return { error: error instanceof Error ? error.message : de.practice.plans.archiveError };
  }

  revalidatePath(`/practice/patients/${parsed.data.patientId}`);
  revalidatePath("/today");
  return { success: de.practice.plans.archived };
}
