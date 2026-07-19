/**
 * Darstellung (hell/dunkel) der PATIENTEN-Oberfläche.
 * Die Wahl ist eine reine Geräteeinstellung und liegt in einem Cookie –
 * keine Gesundheits- oder Kontodaten. Der Praxisbereich liest das Cookie
 * bewusst nicht und bleibt immer hell (D-056).
 */

export const THEME_COOKIE = "pc-theme";

export type PatientTheme = "light" | "dark";

/** Nur die zwei bekannten Werte akzeptieren; alles andere ist "light". */
export function parsePatientTheme(value: string | undefined | null): PatientTheme {
  return value === "dark" ? "dark" : "light";
}

/**
 * Wahl sofort anwenden und im Cookie merken (nur im Browser aufrufen).
 * Die .dark-Klasse liegt auf dem Patienten-Wrapper, nie auf <html>.
 */
export function applyPatientTheme(next: PatientTheme): void {
  document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=31536000; SameSite=Lax`;
  const root = document.querySelector<HTMLElement>("[data-patient-theme-root]");
  if (root) {
    root.classList.toggle("dark", next === "dark");
    root.style.colorScheme = next;
  }
}
