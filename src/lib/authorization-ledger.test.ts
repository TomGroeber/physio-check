import { describe, expect, it } from "vitest";
import { buildAuthorizationLedger, ledgerBalance } from "@/lib/authorization-ledger";

const base = {
  prescribed_sessions: 9,
  created_at: "2026-07-01T10:00:00Z",
  treatment_authorization_adjustments: [],
  appointment_authorization_usages: [],
};

describe("buildAuthorizationLedger", () => {
  it("starts with the initial allocation", () => {
    const ledger = buildAuthorizationLedger(base);
    expect(ledger).toEqual([
      { type: "initial_allocation", delta: 9, at: "2026-07-01T10:00:00Z", reason: "" },
    ]);
    expect(ledgerBalance(ledger)).toBe(9);
  });

  it("maps adjustments to manual_increase / manual_decrease with reason", () => {
    const ledger = buildAuthorizationLedger({
      ...base,
      treatment_authorization_adjustments: [
        { session_delta: -2, reason: "Übertrag korrigiert", created_at: "2026-07-02T09:00:00Z" },
        { session_delta: 3, reason: "Verlängerung bewilligt", created_at: "2026-07-03T09:00:00Z" },
      ],
    });
    expect(ledger.map((entry) => entry.type)).toEqual([
      "initial_allocation",
      "manual_decrease",
      "manual_increase",
    ]);
    expect(ledgerBalance(ledger)).toBe(10);
  });

  it("books a completed appointment as exactly -1 and a reversal as +1", () => {
    const ledger = buildAuthorizationLedger({
      ...base,
      appointment_authorization_usages: [
        { sessions_used: 1, created_at: "2026-07-04T08:00:00Z", reversed_at: "2026-07-05T08:00:00Z" },
        { sessions_used: 1, created_at: "2026-07-06T08:00:00Z", reversed_at: null },
      ],
    });
    expect(ledger.map((entry) => [entry.type, entry.delta])).toEqual([
      ["initial_allocation", 9],
      ["appointment_completed", -1],
      ["appointment_completion_reversed", 1],
      ["appointment_completed", -1],
    ]);
    expect(ledgerBalance(ledger)).toBe(8);
  });

  it("sorts all events chronologically", () => {
    const ledger = buildAuthorizationLedger({
      ...base,
      treatment_authorization_adjustments: [
        { session_delta: 1, reason: "Nachtrag", created_at: "2026-07-09T09:00:00Z" },
      ],
      appointment_authorization_usages: [
        { sessions_used: 1, created_at: "2026-07-08T08:00:00Z", reversed_at: null },
      ],
    });
    expect(ledger.map((entry) => entry.at)).toEqual([
      "2026-07-01T10:00:00Z",
      "2026-07-08T08:00:00Z",
      "2026-07-09T09:00:00Z",
    ]);
  });

  it("never reports a negative balance", () => {
    const ledger = buildAuthorizationLedger({
      ...base,
      prescribed_sessions: 1,
      appointment_authorization_usages: [
        { sessions_used: 1, created_at: "2026-07-04T08:00:00Z", reversed_at: null },
        { sessions_used: 1, created_at: "2026-07-05T08:00:00Z", reversed_at: null },
      ],
    });
    expect(ledgerBalance(ledger)).toBe(0);
  });
});
