import { describe, expect, it } from "vitest";
import { createExerciseSchema } from "@/lib/validation/exercises";

const base = {
  title: "Brücke",
  defaultDosageType: "repetitions",
};

describe("createExerciseSchema", () => {
  it("splits steps into trimmed non-empty lines", () => {
    const parsed = createExerciseSchema.parse({
      ...base,
      stepsText: "Rückenlage einnehmen\n\n  Becken anheben  \nLangsam absenken\n",
    });
    expect(parsed.stepsText).toEqual([
      "Rückenlage einnehmen",
      "Becken anheben",
      "Langsam absenken",
    ]);
  });

  it("treats empty numeric inputs as no default", () => {
    const parsed = createExerciseSchema.parse({ ...base, defaultSets: "", defaultRepetitions: "12" });
    expect(parsed.defaultSets).toBeUndefined();
    expect(parsed.defaultRepetitions).toBe(12);
  });

  it("rejects out-of-range defaults", () => {
    expect(
      createExerciseSchema.safeParse({ ...base, defaultSets: "25" }).success
    ).toBe(false);
    expect(
      createExerciseSchema.safeParse({ ...base, defaultTotalDurationSeconds: "5000" }).success
    ).toBe(false);
  });

  it("requires a title of at least two characters", () => {
    expect(createExerciseSchema.safeParse({ ...base, title: "B" }).success).toBe(false);
  });
});
