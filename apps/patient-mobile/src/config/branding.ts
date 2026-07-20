/**
 * Zentrale Marken- und Designwerte der Patienten-App (Regel: Name und
 * Farben nie hartkodieren). Die Farbwerte sind die exakten sRGB-
 * Entsprechungen der OKLCH-Design-Tokens der Website
 * (src/app/globals.css) – die Patienten-Weboberfläche ist die
 * verbindliche Designreferenz (Auftrag UI-Parität, 19.07.2026).
 */

export const branding = {
  appName: "PhysioCheck",
  defaultTimeZone: "Europe/Luxembourg",
} as const;

export const colors = {
  light: {
    background: "#fbf9f5", // warmes helles Beige
    foreground: "#18263f", // dunkles Navy
    card: "#ffffff",
    primary: "#176a6e", // Teal
    primaryForeground: "#fcfcfa",
    secondary: "#f0ede4",
    muted: "#f1eee7",
    mutedForeground: "#556272",
    accent: "#daeeee", // sehr helles Teal (aktive Navigation)
    accentForeground: "#00474d",
    destructive: "#c1332f",
    success: "#307a4f",
    successForeground: "#fcfcfa",
    successSoft: "#eaf2ec", // success/10 auf Kartenhintergrund
    warning: "#dcaf61",
    warningForeground: "#1f2e47",
    warningSoft: "#faf3e3", // warning/15
    primarySoft: "#e6eff0", // primary/10 (Hinweisflächen)
    border: "#e1ded5",
    input: "#e1ded5",
    ring: "#176a6e",
  },
  dark: {
    background: "#111b2b",
    foreground: "#f0eee9",
    card: "#1b273a",
    primary: "#50a9a8",
    primaryForeground: "#0b1628",
    secondary: "#243145",
    muted: "#243145",
    mutedForeground: "#9ca5b1",
    accent: "#0d3c44",
    accentForeground: "#d6e9e9",
    destructive: "#e8605b",
    success: "#62ab7d",
    successForeground: "#0b1628",
    successSoft: "#20313a",
    warning: "#e3b667",
    warningForeground: "#0f1b2d",
    warningSoft: "#333230",
    primarySoft: "#1d3341",
    border: "rgba(255,255,255,0.12)",
    input: "rgba(255,255,255,0.16)",
    ring: "#50a9a8",
  },
} as const;

export type ThemeColors = { [K in keyof typeof colors.light]: string };

/**
 * Typografie wie die Weboberfläche (Tailwind-Skala): Grundtext 18
 * (text-lg der Patientenansicht), Nebentext 16 (text-base).
 */
export const type = {
  small: 16, // text-base
  base: 18, // text-lg
  lg: 20, // text-xl
  xl: 24, // text-2xl
  title: 30, // text-3xl
} as const;

/** Radien wie das Web-Token --radius: 0.75rem (12px). */
export const radius = {
  md: 10, // rounded-lg
  lg: 12, // rounded-xl (Karten)
  xl: 17, // rounded-2xl
  full: 999,
} as const;

export const touch = {
  minHeight: 48,
  actionHeight: 56, // min-h-14 der Web-Hauptaktionen
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

/** Maximale Inhaltsbreite wie max-w-lg (512px) der Weboberfläche. */
export const maxContentWidth = 512;
