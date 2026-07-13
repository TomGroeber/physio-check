import { z } from "zod";
import { planScheduleSchema } from "@/lib/plan-schedule";

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Bitte geben Sie ein gültiges Datum ein.");
const nullableInt = (min: number, max: number) => z.number().int().min(min).max(max).nullable();

export const planBuilderItemSchema = z
  .object({
    exerciseId: z.uuid(),
    startDate: isoDateSchema,
    endDate: isoDateSchema.nullable(),
    schedule: planScheduleSchema,
    sets: nullableInt(1, 20),
    repetitions: nullableInt(1, 100),
    holdSeconds: nullableInt(1, 600),
    totalDurationSeconds: nullableInt(1, 3600),
    restSeconds: nullableInt(0, 600),
    note: z.string().trim().max(1000),
  })
  .refine((item) => !item.endDate || item.endDate >= item.startDate, {
    path: ["endDate"],
    message: "Das Enddatum darf nicht vor dem Startdatum liegen.",
  });

export const publishPlanSchema = z
  .object({
    patientId: z.uuid(),
    title: z.string().trim().min(2, "Bitte geben Sie einen Plannamen ein.").max(200),
    changeNote: z.string().trim().max(500),
    items: z.array(planBuilderItemSchema).min(1, "Fügen Sie mindestens eine Übung hinzu.").max(30),
  })
  .superRefine((plan, context) => {
    const ids = plan.items.map((item) => item.exerciseId);
    if (new Set(ids).size !== ids.length) {
      context.addIssue({
        code: "custom",
        path: ["items"],
        message: "Eine Übung darf pro Planversion nur einmal vorkommen.",
      });
    }
  });

export const archivePlanSchema = z.object({
  patientId: z.uuid(),
  planId: z.uuid(),
});

export type PublishPlanInput = z.infer<typeof publishPlanSchema>;
export type PlanBuilderItemInput = z.infer<typeof planBuilderItemSchema>;
