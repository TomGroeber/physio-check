import { de } from "@/messages/de";

const t = de.patient.today;

/** Positive Rückmeldung nur für „Erledigt“, sonst wertungsfreie Bestätigung. */
export function SuccessCelebration({
  loggedStatus,
  allDocumented = false,
  allCompleted = false,
}: {
  loggedStatus: string | undefined;
  allDocumented?: boolean;
  allCompleted?: boolean;
}) {
  if (!loggedStatus) return null;
  const completed = loggedStatus === "completed";
  const title = allCompleted
    ? t.allDoneTitle
    : completed
      ? t.successTitle
      : allDocumented
        ? t.allReportedTitle
        : t.feedbackSavedTitle;
  const body = allCompleted
    ? t.allDoneBody
    : completed
      ? t.loggedSuccess
      : allDocumented
        ? t.allReportedBody
        : t.feedbackSavedBody;

  return (
    <div role="status" aria-live="polite" className="flex items-center gap-4 rounded-xl border border-success/40 bg-success/10 p-5">
      <span className="success-pop flex size-14 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground" aria-hidden>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="size-8">
          <path d="M4.5 12.5l5 5 10-11" className="success-check-path" />
        </svg>
      </span>
      <div>
        <p className="text-xl font-bold">{title}</p>
        <p className="text-base">{body}</p>
      </div>
    </div>
  );
}
