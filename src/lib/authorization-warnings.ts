/**
 * Verordnungswarnungen (Etappe 4). Zentrale Schwellenwerte und die reine
 * Bewertungslogik – dieselben Werte werden an die DB-Funktion
 * `list_authorization_warnings` übergeben, damit Liste, Detailseite und
 * Benachrichtigung identisch entscheiden.
 */

/** Warnen, wenn höchstens so viele Einheiten verbleiben. */
export const UNITS_WARNING_THRESHOLD = 2;
/** Warnen, wenn die Verordnung in höchstens so vielen Tagen abläuft. */
export const EXPIRY_WARNING_DAYS = 14;

export type AuthorizationWarning =
  | { type: "no_units" }
  | { type: "low_units"; remaining: number }
  | { type: "expired"; validUntil: string }
  | { type: "expires_soon"; validUntil: string; daysLeft: number };

function daysBetweenIsoDates(fromIso: string, toIso: string): number {
  const [fy, fm, fd] = fromIso.split("-").map(Number);
  const [ty, tm, td] = toIso.split("-").map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000);
}

/**
 * Bewertet eine Verordnung. `todayIso` ist das heutige Datum in der
 * Praxis-Zeitzone (yyyy-mm-dd), `validUntil` das Gültigkeitsende oder null.
 */
export function evaluateAuthorizationWarnings(input: {
  remaining: number;
  validUntil: string | null;
  todayIso: string;
}): AuthorizationWarning[] {
  const warnings: AuthorizationWarning[] = [];
  if (input.remaining <= 0) {
    warnings.push({ type: "no_units" });
  } else if (input.remaining <= UNITS_WARNING_THRESHOLD) {
    warnings.push({ type: "low_units", remaining: input.remaining });
  }
  if (input.validUntil) {
    const daysLeft = daysBetweenIsoDates(input.todayIso, input.validUntil);
    if (daysLeft < 0) {
      warnings.push({ type: "expired", validUntil: input.validUntil });
    } else if (daysLeft <= EXPIRY_WARNING_DAYS) {
      warnings.push({ type: "expires_soon", validUntil: input.validUntil, daysLeft });
    }
  }
  return warnings;
}
