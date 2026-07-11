/**
 * ============================================================
 * ZENTRALE BRANDING-KONFIGURATION
 * ============================================================
 * App-Name und Logo werden AUSSCHLIESSLICH hier gepflegt.
 * Farben liegen in `src/app/globals.css` (Abschnitt FARB-TOKENS).
 * Oberflächentexte liegen in `src/messages/de.ts`.
 *
 * Zum Umbenennen der App: nur `appName` (und ggf. `appShortName`)
 * ändern. Zum Logo-Tausch: Datei unter `public/` ersetzen und
 * `logoPath` anpassen.
 * ============================================================
 */
export const branding = {
  /** Vollständiger Anzeigename der App */
  appName: "PhysioCheck",
  /** Kurzname, z. B. für den Homescreen (PWA) */
  appShortName: "PhysioCheck",
  /** Kurzbeschreibung für Browser-Tab und App-Stores */
  appDescription:
    "Heimübungen, Termine und Rückmeldungen – die App Ihrer Physiotherapiepraxis.",
  /** Pfad zum Logo (liegt im Ordner `public/`) */
  logoPath: "/logo.svg",
  /** Standard-Zeitzone neuer Praxen (IANA-Format) */
  defaultTimeZone: "Europe/Luxembourg",
  /** Standard-Sprache der Oberfläche */
  defaultLocale: "de",
} as const;

export type Branding = typeof branding;
