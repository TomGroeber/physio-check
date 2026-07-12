/**
 * Baut aus den append-only Tabellen einer Verordnung die vollständige,
 * chronologische Historie („Ledger“) mit den fachlichen Ereignissen:
 * initial_allocation · manual_increase · manual_decrease ·
 * appointment_completed · appointment_completion_reversed.
 * Es wird nie etwas gelöscht oder verrechnet – jede Zeile bleibt sichtbar.
 */

export type LedgerEventType =
  | "initial_allocation"
  | "manual_increase"
  | "manual_decrease"
  | "appointment_completed"
  | "appointment_completion_reversed";

export type LedgerEntry = {
  type: LedgerEventType;
  /** Vorzeichenbehaftete ganze Einheiten (+ erhöht, − verbraucht). */
  delta: number;
  /** Zeitpunkt des Ereignisses (ISO). */
  at: string;
  /** Pflichtgrund bei manuellen Anpassungen, sonst leer. */
  reason: string;
};

type AuthorizationForLedger = {
  prescribed_sessions: number;
  created_at: string;
  treatment_authorization_adjustments: {
    session_delta: number;
    reason: string;
    created_at: string;
  }[];
  appointment_authorization_usages: {
    sessions_used: number;
    created_at: string;
    reversed_at: string | null;
  }[];
};

export function buildAuthorizationLedger(authorization: AuthorizationForLedger): LedgerEntry[] {
  const entries: LedgerEntry[] = [
    {
      type: "initial_allocation",
      delta: authorization.prescribed_sessions,
      at: authorization.created_at,
      reason: "",
    },
  ];

  for (const adjustment of authorization.treatment_authorization_adjustments) {
    entries.push({
      type: adjustment.session_delta > 0 ? "manual_increase" : "manual_decrease",
      delta: adjustment.session_delta,
      at: adjustment.created_at,
      reason: adjustment.reason,
    });
  }

  for (const usage of authorization.appointment_authorization_usages) {
    entries.push({
      type: "appointment_completed",
      delta: -usage.sessions_used,
      at: usage.created_at,
      reason: "",
    });
    if (usage.reversed_at) {
      entries.push({
        type: "appointment_completion_reversed",
        delta: usage.sessions_used,
        at: usage.reversed_at,
        reason: "",
      });
    }
  }

  return entries.sort((a, b) => a.at.localeCompare(b.at));
}

/** Saldo des Ledgers, nie unter 0 (Anzeige-Regel „regulär nicht negativ“). */
export function ledgerBalance(entries: LedgerEntry[]): number {
  return Math.max(
    0,
    entries.reduce((sum, entry) => sum + entry.delta, 0)
  );
}
