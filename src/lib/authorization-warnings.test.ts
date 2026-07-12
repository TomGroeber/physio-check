import { describe, expect, it } from "vitest";
import {
  EXPIRY_WARNING_DAYS,
  UNITS_WARNING_THRESHOLD,
  evaluateAuthorizationWarnings,
} from "@/lib/authorization-warnings";

const today = "2026-07-12";

describe("evaluateAuthorizationWarnings", () => {
  it("returns no warnings when units and validity are comfortable", () => {
    expect(
      evaluateAuthorizationWarnings({ remaining: 5, validUntil: "2026-12-31", todayIso: today })
    ).toEqual([]);
  });

  it("warns about low units at the threshold, but not above it", () => {
    expect(
      evaluateAuthorizationWarnings({
        remaining: UNITS_WARNING_THRESHOLD,
        validUntil: null,
        todayIso: today,
      })
    ).toEqual([{ type: "low_units", remaining: UNITS_WARNING_THRESHOLD }]);
    expect(
      evaluateAuthorizationWarnings({
        remaining: UNITS_WARNING_THRESHOLD + 1,
        validUntil: null,
        todayIso: today,
      })
    ).toEqual([]);
  });

  it("reports zero units as no_units, never as low_units", () => {
    expect(
      evaluateAuthorizationWarnings({ remaining: 0, validUntil: null, todayIso: today })
    ).toEqual([{ type: "no_units" }]);
  });

  it("warns when the validity ends within the expiry window, including today", () => {
    expect(
      evaluateAuthorizationWarnings({ remaining: 9, validUntil: "2026-07-26", todayIso: today })
    ).toEqual([{ type: "expires_soon", validUntil: "2026-07-26", daysLeft: EXPIRY_WARNING_DAYS }]);
    expect(
      evaluateAuthorizationWarnings({ remaining: 9, validUntil: today, todayIso: today })
    ).toEqual([{ type: "expires_soon", validUntil: today, daysLeft: 0 }]);
    expect(
      evaluateAuthorizationWarnings({ remaining: 9, validUntil: "2026-07-27", todayIso: today })
    ).toEqual([]);
  });

  it("reports an already expired validity as expired", () => {
    expect(
      evaluateAuthorizationWarnings({ remaining: 9, validUntil: "2026-07-11", todayIso: today })
    ).toEqual([{ type: "expired", validUntil: "2026-07-11" }]);
  });

  it("combines unit and expiry warnings", () => {
    expect(
      evaluateAuthorizationWarnings({ remaining: 1, validUntil: "2026-07-15", todayIso: today })
    ).toEqual([
      { type: "low_units", remaining: 1 },
      { type: "expires_soon", validUntil: "2026-07-15", daysLeft: 3 },
    ]);
  });
});
