/** Pure helpers for the optional, non-medical exercise countdown. */

export function exerciseTimerDuration(input: {
  totalDurationSeconds: number | null;
  holdSeconds: number | null;
}): number | null {
  return input.totalDurationSeconds ?? input.holdSeconds ?? null;
}

export function formatTimerSeconds(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
