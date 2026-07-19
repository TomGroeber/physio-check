import { de } from "./de";

/** Sprachhygiene (Regel 1): Selbstauskunft, nie Verifikationsvokabular. */
describe("Sprachhygiene der App-Texte", () => {
  const collect = (value: unknown): string[] => {
    if (typeof value === "string") return [value];
    if (typeof value === "function") return [];
    if (value && typeof value === "object")
      return Object.values(value).flatMap(collect);
    return [];
  };

  it("verwendet nie 'verifiziert', 'bewiesen' oder 'kontrolliert'", () => {
    const texts = collect(de).join(" ").toLowerCase();
    expect(texts).not.toMatch(/verifiziert|bewiesen|kontrolliert/);
  });

  it("feiert nur echte Erledigung, dokumentiert neutral", () => {
    expect(de.exercise.loggedCompleted).toMatch(/Stark/);
    expect(de.exercise.loggedNeutral).not.toMatch(/Stark|Geschafft|Super/i);
    expect(de.today.progress(2, 3)).toBe("2 von 3 eingetragen");
  });
});
