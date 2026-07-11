/**
 * Feste, barrierefreie Farbpalette für Praxismitglieder im Kalender.
 * Farben sind nie das einzige Unterscheidungsmerkmal: Name/Text steht
 * immer daneben (WCAG 1.4.1). Die Schlüssel entsprechen dem
 * CHECK-Constraint auf practice_members.calendar_color.
 */

export const CALENDAR_COLORS = [
  "teal",
  "indigo",
  "amber",
  "rose",
  "emerald",
  "violet",
  "cyan",
  "slate",
] as const;

export type CalendarColor = (typeof CALENDAR_COLORS)[number];

export function isCalendarColor(value: string): value is CalendarColor {
  return (CALENDAR_COLORS as readonly string[]).includes(value);
}

/** Tailwind-Klassen müssen als vollständige Literale vorliegen (JIT). */
export const calendarColorStyles: Record<
  CalendarColor,
  { label: string; dot: string; chip: string; swatch: string }
> = {
  teal: {
    label: "Petrol",
    dot: "bg-teal-600",
    chip: "border-l-4 border-l-teal-600",
    swatch: "bg-teal-600",
  },
  indigo: {
    label: "Indigo",
    dot: "bg-indigo-600",
    chip: "border-l-4 border-l-indigo-600",
    swatch: "bg-indigo-600",
  },
  amber: {
    label: "Bernstein",
    dot: "bg-amber-500",
    chip: "border-l-4 border-l-amber-500",
    swatch: "bg-amber-500",
  },
  rose: {
    label: "Rosé",
    dot: "bg-rose-600",
    chip: "border-l-4 border-l-rose-600",
    swatch: "bg-rose-600",
  },
  emerald: {
    label: "Smaragd",
    dot: "bg-emerald-600",
    chip: "border-l-4 border-l-emerald-600",
    swatch: "bg-emerald-600",
  },
  violet: {
    label: "Violett",
    dot: "bg-violet-600",
    chip: "border-l-4 border-l-violet-600",
    swatch: "bg-violet-600",
  },
  cyan: {
    label: "Cyan",
    dot: "bg-cyan-600",
    chip: "border-l-4 border-l-cyan-600",
    swatch: "bg-cyan-600",
  },
  slate: {
    label: "Grau",
    dot: "bg-slate-500",
    chip: "border-l-4 border-l-slate-500",
    swatch: "bg-slate-500",
  },
};

/** Sicherer Zugriff: unbekannte Werte fallen auf „teal" zurück. */
export function colorStyle(value: string | null | undefined) {
  return calendarColorStyles[value && isCalendarColor(value) ? value : "teal"];
}
