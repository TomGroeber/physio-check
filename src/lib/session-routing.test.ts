import { describe, expect, it } from "vitest";
import { homeRouteFor } from "./session-routing";
import type { SessionContext } from "@/server/services/session";

function baseSession(overrides: Partial<SessionContext> = {}): SessionContext {
  return {
    userId: "user-1",
    email: "test@example.com",
    fullName: "Test Person",
    memberships: [],
    patientLink: null,
    isPlatformAdmin: false,
    ...overrides,
  };
}

describe("homeRouteFor", () => {
  it("schickt einen Plattformadmin ins Betreiberportal", () => {
    expect(homeRouteFor(baseSession({ isPlatformAdmin: true }))).toBe("/admin");
  });

  it("bevorzugt die Betreiberrolle, selbst wenn zusätzlich eine Praxis-/Patientenverknüpfung besteht", () => {
    const session = baseSession({
      isPlatformAdmin: true,
      memberships: [{ memberId: "m1", practiceId: "p1", practiceName: "Praxis", role: "admin" }],
      patientLink: { practiceId: "p2", practiceName: "Andere Praxis" },
    });
    expect(homeRouteFor(session)).toBe("/admin");
  });

  it("schickt ein Praxismitglied ins Praxis-Dashboard", () => {
    const session = baseSession({
      memberships: [{ memberId: "m1", practiceId: "p1", practiceName: "Praxis", role: "therapist" }],
    });
    expect(homeRouteFor(session)).toBe("/practice");
  });

  it("schickt eine verbundene Patientin zu Heute", () => {
    const session = baseSession({ patientLink: { practiceId: "p1", practiceName: "Praxis" } });
    expect(homeRouteFor(session)).toBe("/today");
  });

  it("schickt ein unverbundenes Konto zur Codeeingabe", () => {
    expect(homeRouteFor(baseSession())).toBe("/connect");
  });
});
