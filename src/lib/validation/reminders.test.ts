import { describe, expect, it } from "vitest";
import { notificationIdSchema, reminderPreferencesSchema } from "./reminders";

describe("reminderPreferencesSchema", () => {
  const valid = {
    exerciseRemindersEnabled: true,
    planUpdatesEnabled: false,
    quietStart: "20:00",
    quietEnd: "08:00",
  };

  it("accepts explicit preferences and 24-hour times", () => {
    expect(reminderPreferencesSchema.safeParse(valid).success).toBe(true);
    expect(
      reminderPreferencesSchema.safeParse({ ...valid, quietStart: "00:00" }).success
    ).toBe(true);
  });

  it("rejects malformed times and implicit booleans", () => {
    expect(
      reminderPreferencesSchema.safeParse({ ...valid, quietStart: "24:00" }).success
    ).toBe(false);
    expect(
      reminderPreferencesSchema.safeParse({ ...valid, planUpdatesEnabled: "on" }).success
    ).toBe(false);
  });
});

describe("notificationIdSchema", () => {
  it("accepts UUIDs only", () => {
    expect(notificationIdSchema.safeParse("6f4f650b-eae9-421f-a4af-0af47ce4025e").success).toBe(true);
    expect(notificationIdSchema.safeParse("not-an-id").success).toBe(false);
  });
});

