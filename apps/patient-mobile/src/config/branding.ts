/**
 * Zentrale Marken- und Designwerte der Patienten-App (Regel: Name und
 * Farben nie hartkodieren). Farbwerte entsprechen den Design-Tokens
 * der Website (globals.css), übersetzt in konkrete Hex-Werte.
 */

export const branding = {
  appName: "PhysioCheck",
  defaultTimeZone: "Europe/Luxembourg",
} as const;

export const colors = {
  light: {
    background: "#f8fafc",
    card: "#ffffff",
    text: "#0f172a",
    mutedText: "#475569",
    primary: "#0f766e",
    primaryText: "#ffffff",
    border: "#e2e8f0",
    success: "#15803d",
    successBg: "#f0fdf4",
    warning: "#a16207",
    warningBg: "#fefce8",
    danger: "#b91c1c",
    dangerBg: "#fef2f2",
    inputBg: "#ffffff",
  },
  dark: {
    background: "#0b1220",
    card: "#111a2c",
    text: "#e2e8f0",
    mutedText: "#94a3b8",
    primary: "#2dd4bf",
    primaryText: "#042f2e",
    border: "#1e293b",
    success: "#4ade80",
    successBg: "#052e16",
    warning: "#facc15",
    warningBg: "#422006",
    danger: "#f87171",
    dangerBg: "#450a0a",
    inputBg: "#0f172a",
  },
} as const;

export type ThemeColors = { [K in keyof typeof colors.light]: string };

/**
 * Barrierefreiheit (Teil K): Basisschrift 18, große Aktionen,
 * Touch-Ziele mindestens 48 pt.
 */
export const type = {
  base: 18,
  small: 16,
  large: 22,
  title: 28,
} as const;

export const touch = {
  minHeight: 48,
  actionHeight: 56,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;
