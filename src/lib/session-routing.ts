import type { SessionContext } from "@/server/services/session";

/**
 * Zielroute nach Login, abhängig von der Rolle. Betreiber zuerst
 * geprüft (D-094: strikt eigene Rolle, nicht über practice_members
 * ableitbar) – sonst landete ein Plattformadmin-Konto, das zufällig
 * auch als Patient verbunden ist (z. B. der Demo-Account), im
 * Patientenbereich und hatte von dort keinen sichtbaren Weg zu /admin.
 *
 * Eigene Datei statt in session.ts, damit diese reine Funktion ohne
 * `server-only`-Importkette (Datenbankzugriff) unit-testbar bleibt.
 */
export function homeRouteFor(session: SessionContext): string {
  if (session.isPlatformAdmin) return "/admin";
  if (session.memberships.length > 0) return "/practice";
  if (session.patientLink) return "/today";
  // Angemeldet, aber ohne Praxisverknüpfung: Codeeingabe im
  // geschützten Verbindungsbereich (kein Zugriff auf Patientendaten).
  return "/connect";
}
