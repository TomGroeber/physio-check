import { de } from "@/messages/de";

/**
 * Kurze, ruhige Erfolgsrückmeldung nach einer gespeicherten Dokumentation.
 * Reine CSS-Animation (siehe globals.css); bei `prefers-reduced-motion`
 * springt sie über die globale Regel sofort zum Endzustand. Die Meldung
 * bleibt eine Selbstauskunft – kein „Nachweis“ der Durchführung.
 */
export function SuccessCelebration({ message }: { message?: string }) {
  return (
    <div
      role="status"
      className="flex items-center gap-4 rounded-xl border border-success/40 bg-success/10 p-5"
    >
      <span className="success-pop flex size-14 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-8"
          aria-hidden
        >
          <path d="M4.5 12.5l5 5 10-11" className="success-check-path" />
        </svg>
      </span>
      <div>
        <p className="text-xl font-bold">{de.patient.today.successTitle}</p>
        <p className="text-base">{message ?? de.patient.today.loggedSuccess}</p>
      </div>
    </div>
  );
}
