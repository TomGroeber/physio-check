import { z } from "zod";

/**
 * Validierung der Übungsbibliothek. Schritte kommen aus einem Textfeld
 * (eine Zeile = ein Schritt) und werden hier in ein sauberes Array
 * überführt. Alle Zahlenfelder sind optional – leere Eingaben bedeuten
 * „keine Vorgabe".
 */

const optionalInt = (min: number, max: number, message: string) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.coerce.number().int().min(min, message).max(max, message).optional()
  );

export const exerciseFieldsSchema = z.object({
  title: z.string().trim().min(2, "Bitte geben Sie einen Titel ein.").max(200),
  description: z.string().trim().max(1000).default(""),
  startingPosition: z.string().trim().max(500).default(""),
  /** Eine Zeile pro Schritt; leere Zeilen werden entfernt. */
  stepsText: z
    .string()
    .max(4000)
    .default("")
    .transform((value) =>
      value
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
    ),
  commonMistakes: z.string().trim().max(1000).default(""),
  equipment: z.string().trim().max(300).default(""),
  category: z.string().trim().max(100).default(""),
  defaultDosageType: z.enum(["repetitions", "duration"]),
  defaultSets: optionalInt(1, 20, "Sätze: 1 bis 20."),
  defaultRepetitions: optionalInt(1, 100, "Wiederholungen: 1 bis 100."),
  defaultHoldSeconds: optionalInt(1, 600, "Haltezeit: 1 bis 600 Sekunden."),
  defaultTotalDurationSeconds: optionalInt(1, 3600, "Gesamtdauer: 1 bis 3600 Sekunden."),
  defaultRestSeconds: optionalInt(0, 600, "Pause: 0 bis 600 Sekunden."),
});

export const createExerciseSchema = exerciseFieldsSchema;

export const updateExerciseSchema = exerciseFieldsSchema.extend({
  exerciseId: z.uuid(),
});

export const exerciseIdSchema = z.object({ exerciseId: z.uuid() });

export type ExerciseFieldsInput = z.infer<typeof exerciseFieldsSchema>;
