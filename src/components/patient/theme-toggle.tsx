"use client";

import { useState } from "react";
import { applyPatientTheme, parsePatientTheme, type PatientTheme } from "@/lib/theme";
import { de } from "@/messages/de";

const t = de.patient.profile.appearance;

/**
 * Hell/Dunkel-Umschalter für die Patientenoberfläche. Wirkt sofort
 * (Klasse auf dem Patienten-Wrapper) und merkt sich die Wahl in einem
 * Cookie, das nur das Patienten-Layout liest – der Praxisbereich bleibt
 * immer hell (D-056). Keine Server-Roundtrips nötig.
 */
export function ThemeToggle({ initialTheme }: { initialTheme: PatientTheme }) {
  const [theme, setTheme] = useState<PatientTheme>(parsePatientTheme(initialTheme));

  function apply(next: PatientTheme) {
    setTheme(next);
    applyPatientTheme(next);
  }

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="pb-1 text-base font-semibold">{t.label}</legend>
      {(
        [
          { value: "light", text: t.light },
          { value: "dark", text: t.dark },
        ] as const
      ).map((option) => (
        <label
          key={option.value}
          className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border px-4 text-lg has-checked:border-primary has-checked:bg-primary/10"
        >
          <input
            type="radio"
            name="patient-theme"
            value={option.value}
            checked={theme === option.value}
            onChange={() => apply(option.value)}
            className="size-5 accent-primary"
          />
          {option.text}
        </label>
      ))}
      <p className="text-base text-muted-foreground">{t.hint}</p>
    </fieldset>
  );
}
