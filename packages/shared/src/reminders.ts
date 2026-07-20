export const DEFAULT_REMINDER_PREFERENCES = {
  exerciseRemindersEnabled: true,
  planUpdatesEnabled: true,
  quietStart: "20:00",
  quietEnd: "08:00",
} as const;

const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

function minutesSinceMidnight(value: string): number {
  if (!TIME_PATTERN.test(value)) throw new Error("Invalid time");
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Quiet periods may cross midnight (20:00–08:00). Equal start/end means
 * no quiet period, so patients can explicitly opt out without another flag.
 */
export function isWithinQuietHours(
  localTime: string,
  quietStart: string,
  quietEnd: string
): boolean {
  const current = minutesSinceMidnight(localTime);
  const start = minutesSinceMidnight(quietStart);
  const end = minutesSinceMidnight(quietEnd);
  if (start === end) return false;
  if (start < end) return current >= start && current < end;
  return current >= start || current < end;
}

export function shouldShowExerciseReminder(input: {
  enabled: boolean;
  remainingOccurrences: number;
  localTime: string;
  quietStart: string;
  quietEnd: string;
}): boolean {
  return (
    input.enabled &&
    input.remainingOccurrences > 0 &&
    !isWithinQuietHours(input.localTime, input.quietStart, input.quietEnd)
  );
}

