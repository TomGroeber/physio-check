import { Banner } from "@/components/ui";
import { web } from "@/messages/de";

const t = web.patient.today;

/**
 * Positive Rückmeldung nur für „Erledigt“, sonst wertungsfreie
 * Bestätigung – identische Textlogik wie success-celebration.tsx der
 * Website.
 */
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
    <Banner kind="success" title={title} icon>
      {body}
    </Banner>
  );
}
