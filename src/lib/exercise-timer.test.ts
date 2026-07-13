import { describe, expect, it } from "vitest";
import { exerciseTimerDuration, formatTimerSeconds } from "@/lib/exercise-timer";

describe("exerciseTimerDuration", () => {
  it("prefers the total exercise duration", () => {
    expect(exerciseTimerDuration({ totalDurationSeconds: 180, holdSeconds: 30 })).toBe(180);
  });

  it("falls back to hold time and stays optional", () => {
    expect(exerciseTimerDuration({ totalDurationSeconds: null, holdSeconds: 30 })).toBe(30);
    expect(exerciseTimerDuration({ totalDurationSeconds: null, holdSeconds: null })).toBeNull();
  });
});

describe("formatTimerSeconds", () => {
  it("formats a safe mm:ss countdown", () => {
    expect(formatTimerSeconds(185)).toBe("03:05");
    expect(formatTimerSeconds(-5)).toBe("00:00");
  });
});
