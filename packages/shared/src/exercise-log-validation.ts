import { z } from "zod";

/**
 * Validierung der Übungsdokumentation (Selbstauskunft des Patienten).
 * Optionale Zahlenfelder kommen aus FormData als Strings; leere
 * Eingaben werden zu undefined.
 */

const optionalInt = (min: number, max: number) =>
  z.preprocess(
    (value) =>
      value === "" || value === null || value === undefined
        ? undefined
        : Number(value),
    z.number().int().min(min).max(max).optional()
  );

export const completionStatusValues = [
  "completed",
  "partial",
  "too_difficult",
  "not_possible",
] as const;

export const completionLogSchema = z.object({
  planItemId: z.uuid(),
  mode: z.enum(["detail", "guided"]).default("detail"),
  status: z.enum(completionStatusValues),
  setsCompleted: optionalInt(0, 20),
  painBefore: optionalInt(0, 10),
  painAfter: optionalInt(0, 10),
  note: z
    .string()
    .trim()
    .max(1000, "Die Notiz ist zu lang (maximal 1000 Zeichen).")
    .optional()
    .default(""),
});

export type CompletionLogInput = z.infer<typeof completionLogSchema>;

/**
 * Neutraler Schmerz-Hinweis: bei hohem oder gestiegenem Wert nach der
 * Übung. Keine Diagnose, keine Therapieentscheidung.
 */
export function shouldShowPainHint(input: {
  painBefore?: number;
  painAfter?: number;
}): boolean {
  if (input.painAfter === undefined) return false;
  if (input.painAfter >= 7) return true;
  return input.painBefore !== undefined && input.painAfter > input.painBefore;
}
