"use client";

import { useEffect, useState } from "react";
import { formatTimerSeconds } from "@/lib/exercise-timer";
import { Button } from "@/components/ui/button";
import { de } from "@/messages/de";

const t = de.patient.session.timer;

export function ExerciseTimer({ durationSeconds }: { durationSeconds: number }) {
  const [remaining, setRemaining] = useState(durationSeconds);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running || remaining <= 0) return;
    const interval = window.setInterval(() => {
      setRemaining((current) => {
        if (current <= 1) {
          setRunning(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [remaining, running]);

  function reset() {
    setRunning(false);
    setRemaining(durationSeconds);
  }

  return (
    <section aria-labelledby="exercise-timer-heading" className="flex flex-col items-center gap-4 rounded-xl border bg-card p-5">
      <h2 id="exercise-timer-heading" className="text-xl font-bold">{t.heading}</h2>
      <p className="text-5xl font-bold tabular-nums" role="timer" aria-live="polite">
        {formatTimerSeconds(remaining)}
      </p>
      {remaining === 0 ? <p className="text-lg font-bold text-success" role="status">{t.finished}</p> : null}
      <div className="grid w-full grid-cols-2 gap-3">
        <Button
          type="button"
          onClick={() => setRunning((current) => !current)}
          disabled={remaining === 0}
          className="h-14 text-lg"
        >
          {running ? t.pause : t.start}
        </Button>
        <Button type="button" variant="outline" onClick={reset} className="h-14 text-lg">
          {t.reset}
        </Button>
      </div>
      <p className="text-base text-muted-foreground">{t.hint}</p>
    </section>
  );
}
