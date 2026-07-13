"use client";

import { useActionState, useMemo, useState } from "react";
import { archiveExercisePlanAction, publishExercisePlanAction, type PlanActionState } from "@/server/actions/plans";
import type {
  PlanEditorData,
  PlanEditorExercise,
  PlanEditorItem,
} from "@/server/services/plans";
import type { PlanSchedule } from "@/lib/plan-schedule";
import { branding } from "@/config/branding";
import { formatDateShort, todayInTimeZone } from "@/lib/datetime";
import { FormMessage } from "@/components/auth/form-message";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { de } from "@/messages/de";

const t = de.practice.plans;
const allWeekdays = [1, 2, 3, 4, 5, 6, 7];

type DraftItem = PlanEditorItem & { draftKey: string };

function draftFromCurrent(item: PlanEditorItem): DraftItem {
  return { ...item, draftKey: item.id };
}

function draftFromExercise(exercise: PlanEditorExercise): DraftItem {
  return {
    id: "",
    draftKey: globalThis.crypto?.randomUUID?.() ?? `${exercise.id}-${Date.now()}`,
    exerciseId: exercise.id,
    exerciseTitle: exercise.title,
    startDate: todayInTimeZone(branding.defaultTimeZone),
    endDate: null,
    schedule: {
      mode: "weekdays",
      weekdays: allWeekdays,
      times_per_day: 1,
      preferred_times: [],
    },
    sets: exercise.defaultSets,
    repetitions: exercise.defaultRepetitions,
    holdSeconds: exercise.defaultHoldSeconds,
    totalDurationSeconds: exercise.defaultTotalDurationSeconds,
    restSeconds: exercise.defaultRestSeconds,
    note: "",
  };
}

function scheduleSummary(schedule: PlanSchedule): string {
  if (schedule.mode === "times_per_week") {
    return t.scheduleSummary.flexible(schedule.times_per_week);
  }
  const days = schedule.weekdays.map((weekday) => t.weekdays[weekday - 1]).join(", ");
  return t.scheduleSummary.fixed(days, schedule.times_per_day);
}

function optionalNumber(value: string): number | null {
  return value === "" ? null : Number(value);
}

function serializableItem(item: DraftItem) {
  return {
    exerciseId: item.exerciseId,
    startDate: item.startDate,
    endDate: item.endDate,
    schedule: item.schedule,
    sets: item.sets,
    repetitions: item.repetitions,
    holdSeconds: item.holdSeconds,
    totalDurationSeconds: item.totalDurationSeconds,
    restSeconds: item.restSeconds,
    note: item.note,
  };
}

function NumberField({
  id,
  label,
  value,
  min,
  max,
  onChange,
}: {
  id: string;
  label: string;
  value: number | null;
  min: number;
  max: number;
  onChange: (value: number | null) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        min={min}
        max={max}
        value={value ?? ""}
        onChange={(event) => onChange(optionalNumber(event.target.value))}
        className="h-10 text-base"
      />
    </div>
  );
}

function ArchivePlanForm({ patientId, planId }: { patientId: string; planId: string }) {
  const [state, action, pending] = useActionState<PlanActionState, FormData>(
    archiveExercisePlanAction,
    {}
  );
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(t.archiveConfirm)) event.preventDefault();
      }}
      className="flex flex-col gap-2"
    >
      <input type="hidden" name="patientId" value={patientId} />
      <input type="hidden" name="planId" value={planId} />
      <FormMessage error={state.error} success={state.success} />
      <Button type="submit" variant="destructive" disabled={pending} className="h-10 self-start text-sm">
        {pending ? de.common.loading : t.archive}
      </Button>
    </form>
  );
}

export function ExercisePlanBuilder({
  patientId,
  data,
}: {
  patientId: string;
  data: PlanEditorData;
}) {
  const [state, action, pending] = useActionState<PlanActionState, FormData>(
    publishExercisePlanAction,
    {}
  );
  const [items, setItems] = useState<DraftItem[]>(
    () => data.plan?.items.map(draftFromCurrent) ?? []
  );
  const [selectedExerciseId, setSelectedExerciseId] = useState("");

  const availableExercises = useMemo(
    () => data.exercises.filter((exercise) => !items.some((item) => item.exerciseId === exercise.id)),
    [data.exercises, items]
  );

  function updateItem(index: number, update: Partial<DraftItem>) {
    setItems((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...update } : item))
    );
  }

  function updateSchedule(index: number, schedule: PlanSchedule) {
    updateItem(index, { schedule });
  }

  function addExercise() {
    const exercise = data.exercises.find((candidate) => candidate.id === selectedExerciseId);
    if (!exercise || items.some((item) => item.exerciseId === exercise.id)) return;
    setItems((current) => [...current, draftFromExercise(exercise)]);
    setSelectedExerciseId("");
  }

  function moveItem(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    setItems((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  return (
    <section aria-labelledby="plan-builder-heading" className="flex flex-col gap-4">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="plan-builder-heading" className="text-xl font-bold">{t.heading}</h2>
          {data.plan ? <Badge variant="secondary">{t.currentVersion(data.plan.versionNumber)}</Badge> : null}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{t.intro}</p>
      </div>

      <form action={action} className="flex flex-col gap-5">
        <input type="hidden" name="patientId" value={patientId} />
        <input
          type="hidden"
          name="items"
          value={JSON.stringify(items.map(serializableItem))}
        />
        <FormMessage error={state.error} success={state.success} />

        <Card>
          <CardContent className="grid gap-4 p-5 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <div className="flex flex-col gap-2 md:col-span-3">
              <Label htmlFor="plan-title">{t.titleLabel}</Label>
              <Input
                id="plan-title"
                name="title"
                required
                minLength={2}
                maxLength={200}
                defaultValue={data.plan?.title ?? ""}
                placeholder={t.titlePlaceholder}
                className="h-11 text-base"
              />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="plan-library">{t.libraryLabel}</Label>
              <select
                id="plan-library"
                value={selectedExerciseId}
                onChange={(event) => setSelectedExerciseId(event.target.value)}
                className="h-11 rounded-md border bg-background px-3 text-base"
              >
                <option value="">{t.selectExercise}</option>
                {availableExercises.map((exercise) => (
                  <option key={exercise.id} value={exercise.id}>
                    {exercise.title}{exercise.category ? ` · ${exercise.category}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <Button
              type="button"
              onClick={addExercise}
              disabled={!selectedExerciseId}
              className="h-11 text-sm"
            >
              {t.addExercise}
            </Button>
            {availableExercises.length === 0 ? (
              <p className="text-sm text-muted-foreground md:col-span-3">{t.noExercises}</p>
            ) : null}
          </CardContent>
        </Card>

        {items.length === 0 ? (
          <Card><CardContent className="p-5 text-base text-muted-foreground">{t.emptyPlan}</CardContent></Card>
        ) : (
          <ol className="flex flex-col gap-4">
            {items.map((item, index) => (
              <li key={item.draftKey}>
                <Card>
                  <CardContent className="flex flex-col gap-5 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-lg font-bold">{index + 1}. {item.exerciseTitle}</h3>
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" onClick={() => moveItem(index, -1)} disabled={index === 0} className="h-9 text-sm">{t.moveUp}</Button>
                        <Button type="button" variant="outline" onClick={() => moveItem(index, 1)} disabled={index === items.length - 1} className="h-9 text-sm">{t.moveDown}</Button>
                        <Button type="button" variant="destructive" onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="h-9 text-sm">{t.remove}</Button>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor={`start-${item.draftKey}`}>{t.startDate}</Label>
                        <Input id={`start-${item.draftKey}`} type="date" value={item.startDate} onChange={(event) => updateItem(index, { startDate: event.target.value })} className="h-10 text-base" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor={`end-${item.draftKey}`}>{t.endDate}</Label>
                        <Input id={`end-${item.draftKey}`} type="date" value={item.endDate ?? ""} min={item.startDate} onChange={(event) => updateItem(index, { endDate: event.target.value || null })} className="h-10 text-base" />
                      </div>
                    </div>

                    <fieldset className="flex flex-col gap-4 rounded-lg border p-4">
                      <legend className="px-1 text-sm font-bold">{t.schedule}</legend>
                      <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
                        <label className="flex min-h-10 items-center gap-2 text-sm font-semibold">
                          <input
                            type="radio"
                            name={`schedule-mode-${item.draftKey}`}
                            checked={item.schedule.mode === "weekdays"}
                            onChange={() => updateSchedule(index, { mode: "weekdays", weekdays: allWeekdays, times_per_day: 1, preferred_times: [] })}
                            className="size-5"
                          />
                          {t.fixedDays}
                        </label>
                        <label className="flex min-h-10 items-center gap-2 text-sm font-semibold">
                          <input
                            type="radio"
                            name={`schedule-mode-${item.draftKey}`}
                            checked={item.schedule.mode === "times_per_week"}
                            onChange={() => updateSchedule(index, { mode: "times_per_week", times_per_week: 3, times_per_day: 1, preferred_times: [] })}
                            className="size-5"
                          />
                          {t.flexibleWeek}
                        </label>
                      </div>

                      {item.schedule.mode === "weekdays" ? (
                        <>
                          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                            {t.weekdays.map((day, dayIndex) => {
                              const weekday = dayIndex + 1;
                              const checked = item.schedule.mode === "weekdays" && item.schedule.weekdays.includes(weekday);
                              return (
                                <label key={day} className="flex min-h-10 items-center gap-2 rounded-md border px-3 text-sm">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(event) => {
                                      if (item.schedule.mode !== "weekdays") return;
                                      const weekdays = event.target.checked
                                        ? [...item.schedule.weekdays, weekday].sort()
                                        : item.schedule.weekdays.filter((value) => value !== weekday);
                                      updateSchedule(index, { ...item.schedule, weekdays });
                                    }}
                                    className="size-5"
                                  />
                                  {day}
                                </label>
                              );
                            })}
                          </div>
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="flex flex-col gap-2">
                              <Label htmlFor={`times-day-${item.draftKey}`}>{t.timesPerDay}</Label>
                              <Input
                                id={`times-day-${item.draftKey}`}
                                type="number"
                                min={1}
                                max={6}
                                value={item.schedule.times_per_day}
                                onChange={(event) => {
                                  if (item.schedule.mode !== "weekdays") return;
                                  const times = Math.max(1, Math.min(6, Number(event.target.value)));
                                  updateSchedule(index, { ...item.schedule, times_per_day: times, preferred_times: item.schedule.preferred_times.slice(0, times) });
                                }}
                                className="h-10 text-base"
                              />
                            </div>
                            <div className="flex flex-col gap-2">
                              <span className="text-sm font-semibold">{t.preferredTimes}</span>
                              <div className="grid gap-2 sm:grid-cols-2">
                                {Array.from({ length: item.schedule.times_per_day }, (_, timeIndex) => (
                                  <div key={timeIndex} className="flex flex-col gap-1">
                                    <Label htmlFor={`time-${item.draftKey}-${timeIndex}`}>{t.preferredTime(timeIndex + 1)}</Label>
                                    <Input
                                      id={`time-${item.draftKey}-${timeIndex}`}
                                      type="time"
                                      value={item.schedule.mode === "weekdays" ? item.schedule.preferred_times[timeIndex] ?? "" : ""}
                                      onChange={(event) => {
                                        if (item.schedule.mode !== "weekdays") return;
                                        const preferredTimes = [...item.schedule.preferred_times];
                                        preferredTimes[timeIndex] = event.target.value;
                                        updateSchedule(index, { ...item.schedule, preferred_times: preferredTimes.filter(Boolean) });
                                      }}
                                      className="h-10 text-base"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="flex flex-col gap-2">
                            <Label htmlFor={`times-week-${item.draftKey}`}>{t.timesPerWeek}</Label>
                            <Input
                              id={`times-week-${item.draftKey}`}
                              type="number"
                              min={1}
                              max={7}
                              value={item.schedule.times_per_week}
                              onChange={(event) => {
                                if (item.schedule.mode !== "times_per_week") return;
                                updateSchedule(index, { ...item.schedule, times_per_week: Math.max(1, Math.min(7, Number(event.target.value))) });
                              }}
                              className="h-10 text-base"
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <Label htmlFor={`weekly-time-${item.draftKey}`}>{t.preferredTimes}</Label>
                            <Input
                              id={`weekly-time-${item.draftKey}`}
                              type="time"
                              value={item.schedule.preferred_times[0] ?? ""}
                              onChange={(event) => {
                                if (item.schedule.mode !== "times_per_week") return;
                                updateSchedule(index, { ...item.schedule, preferred_times: event.target.value ? [event.target.value] : [] });
                              }}
                              className="h-10 text-base"
                            />
                          </div>
                        </div>
                      )}
                    </fieldset>

                    <fieldset className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-5">
                      <legend className="px-1 text-sm font-bold">{t.dosage}</legend>
                      <NumberField id={`sets-${item.draftKey}`} label={t.sets} value={item.sets} min={1} max={20} onChange={(sets) => updateItem(index, { sets })} />
                      <NumberField id={`repetitions-${item.draftKey}`} label={t.repetitions} value={item.repetitions} min={1} max={100} onChange={(repetitions) => updateItem(index, { repetitions })} />
                      <NumberField id={`hold-${item.draftKey}`} label={t.holdSeconds} value={item.holdSeconds} min={1} max={600} onChange={(holdSeconds) => updateItem(index, { holdSeconds })} />
                      <NumberField id={`duration-${item.draftKey}`} label={t.totalDurationSeconds} value={item.totalDurationSeconds} min={1} max={3600} onChange={(totalDurationSeconds) => updateItem(index, { totalDurationSeconds })} />
                      <NumberField id={`rest-${item.draftKey}`} label={t.restSeconds} value={item.restSeconds} min={0} max={600} onChange={(restSeconds) => updateItem(index, { restSeconds })} />
                    </fieldset>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor={`note-${item.draftKey}`}>{t.note}</Label>
                      <Textarea id={`note-${item.draftKey}`} value={item.note} maxLength={1000} rows={2} onChange={(event) => updateItem(index, { note: event.target.value })} />
                    </div>
                    <div className="rounded-lg bg-primary/10 p-4 text-sm">
                      <span className="font-bold">{t.preview}: </span>{scheduleSummary(item.schedule)}
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ol>
        )}

        <div className="flex flex-col gap-2">
          <Label htmlFor="plan-change-note">{t.changeNote}</Label>
          <Textarea id="plan-change-note" name="changeNote" maxLength={500} rows={2} placeholder={t.changeNotePlaceholder} />
        </div>
        <Button type="submit" disabled={pending || items.length === 0} className="h-12 text-base">
          {pending ? de.common.loading : t.publish}
        </Button>
      </form>

      {data.versions.length > 0 ? (
        <Card>
          <CardContent className="flex flex-col gap-3 p-5">
            <h3 className="text-base font-bold">{t.history}</h3>
            <ol className="flex flex-col gap-2">
              {data.versions.map((version) => (
                <li key={version.id} className="flex flex-wrap justify-between gap-2 border-b pb-2 text-sm last:border-0 last:pb-0">
                  <span><strong>{t.version(version.versionNumber)}</strong> · {version.changeNote || t.initialVersion}</span>
                  <span className="text-muted-foreground">{formatDateShort(new Date(version.createdAt), branding.defaultTimeZone)}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      ) : null}

      {data.plan ? <ArchivePlanForm patientId={patientId} planId={data.plan.id} /> : null}
    </section>
  );
}
