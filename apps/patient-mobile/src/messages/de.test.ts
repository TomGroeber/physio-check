import { app, web } from "./de";

/** Sprachhygiene (Regel 1): Selbstauskunft, nie Verifikationsvokabular. */
describe("Sprachhygiene der App-Texte", () => {
  const collect = (value: unknown): string[] => {
    if (typeof value === "string") return [value];
    if (typeof value === "function") return [];
    if (Array.isArray(value)) return value.flatMap(collect);
    if (value && typeof value === "object")
      return Object.values(value).flatMap(collect);
    return [];
  };

  it("verwendet nie 'verifiziert', 'bewiesen' oder 'kontrolliert'", () => {
    const texts = [...collect(app), ...collect(web.patient), ...collect(web.connect)]
      .join(" ")
      .toLowerCase();
    expect(texts).not.toMatch(/verifiziert|bewiesen|kontrolliert/);
  });

  it("nutzt die identischen Web-Texte (Paritätsquelle)", () => {
    // Stichproben: App und Web teilen wörtlich dieselben Formulierungen.
    expect(web.patient.today.progressShort(2, 3)).toBe("2 von 3 eingetragen");
    expect(web.patient.today.successTitle).toBe("Geschafft!");
    expect(web.patient.exercise.status.completed).toBe("Erledigt");
    expect(web.patient.nav).toEqual({
      today: "Heute",
      appointments: "Termine",
      profile: "Profil",
    });
  });

  it("feiert nur echte Erledigung, dokumentiert neutral", () => {
    // „alles eingetragen“ (auch teilweise/zu schwierig) bleibt wertungsfrei.
    expect(web.patient.today.allReportedTitle).not.toMatch(/geschafft/i);
    expect(web.patient.today.feedbackSavedTitle).not.toMatch(/geschafft/i);
  });
});
