"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  DashboardSquare01Icon,
  UserGroupIcon,
  Dumbbell01Icon,
  Calendar03Icon,
  Clock01Icon,
  Message01Icon,
  Settings01Icon,
  HelpCircleIcon,
} from "@hugeicons/core-free-icons";
import { searchWorkspaceAction, type WorkspaceSearchResult } from "@/server/actions/search";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { de } from "@/messages/de";

const t = de.practice.search;

const quickLinks = [
  { href: "/practice", label: de.practice.nav.dashboard, icon: DashboardSquare01Icon },
  { href: "/practice/patients", label: de.practice.nav.patients, icon: UserGroupIcon },
  { href: "/practice/exercises", label: de.practice.nav.exercises, icon: Dumbbell01Icon },
  { href: "/practice/calendar", label: de.practice.nav.calendar, icon: Calendar03Icon },
  { href: "/practice/waitlist", label: de.practice.nav.waitlist, icon: Clock01Icon },
  { href: "/practice/messages", label: de.practice.nav.messages, icon: Message01Icon },
  { href: "/practice/settings", label: de.practice.nav.settings, icon: Settings01Icon },
  { href: "/practice/help", label: de.practice.nav.help, icon: HelpCircleIcon },
] as const;

type FlatItem = { key: string; label: string; sublabel?: string; href: string };

/**
 * Praxisweite Schnellsuche (Strg/Cmd+K): springt zu Patienten, Übungen
 * oder einem Bereich, ohne den Umweg über die Seitenleiste. Erste
 * interaktive, tastaturgesteuerte Suche in der App – bewusst mit
 * eigener kleiner Listbox statt einer neuen Abhängigkeit (`cmdk`).
 */
export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [results, setResults] = useState<WorkspaceSearchResult>({ patients: [], exercises: [] });
  const [pending, startTransition] = useTransition();
  const debouncedQuery = useDebouncedValue(query, 250);

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

  useEffect(() => {
    if (!open) return;
    const trimmed = debouncedQuery.trim();
    if (trimmed.length < 2) return;
    startTransition(async () => {
      const result = await searchWorkspaceAction(trimmed);
      setResults(result);
    });
  }, [debouncedQuery, open]);

  const filteredQuickLinks = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return quickLinks;
    return quickLinks.filter((link) => link.label.toLowerCase().includes(trimmed));
  }, [query]);

  // Ergebnisse aus dem letzten Suchlauf erst zeigen, wenn die aktuelle
  // (entprellte) Eingabe wieder lang genug ist – vermeidet veraltete
  // Treffer beim schnellen Löschen der Eingabe, ohne setState im Effekt.
  const visibleResults = useMemo(
    () => (debouncedQuery.trim().length < 2 ? { patients: [], exercises: [] } : results),
    [debouncedQuery, results]
  );

  const flatItems = useMemo<FlatItem[]>(
    () => [
      ...filteredQuickLinks.map((link) => ({
        key: `link-${link.href}`,
        label: link.label,
        sublabel: t.sectionQuickLinks,
        href: link.href,
      })),
      ...visibleResults.patients.map((hit) => ({
        key: `patient-${hit.id}`,
        label: hit.label,
        sublabel: t.sectionPatients,
        href: hit.href,
      })),
      ...visibleResults.exercises.map((hit) => ({
        key: `exercise-${hit.id}`,
        label: hit.label,
        sublabel: t.sectionExercises,
        href: hit.href,
      })),
    ],
    [filteredQuickLinks, visibleResults]
  );

  const activate = useCallback(
    (item: FlatItem) => {
      setOpen(false);
      router.push(item.href);
    },
    [router]
  );

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) return;
    setQuery("");
    setActiveIndex(0);
    setResults({ patients: [], exercises: [] });
  }

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, flatItems.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const item = flatItems[activeIndex];
      if (item) activate(item);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-3 rounded-lg border border-sidebar-border/60 px-3 py-2 text-left text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground focus-visible:outline-2 focus-visible:outline-sidebar-ring"
      >
        <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="size-5 shrink-0" aria-hidden />
        <span className="flex-1">{t.triggerLabel}</span>
        <kbd className="hidden rounded border border-sidebar-border/60 px-1.5 py-0.5 text-[0.625rem] sm:inline">
          {t.shortcutHint}
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="top-[20%] max-w-lg translate-y-0 gap-3 sm:max-w-lg" showCloseButton={false}>
          <DialogHeader className="sr-only">
            <DialogTitle>{t.dialogTitle}</DialogTitle>
            <DialogDescription>{t.dialogDescription}</DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={onInputKeyDown}
            placeholder={t.placeholder}
            role="combobox"
            aria-expanded={flatItems.length > 0}
            aria-controls="global-search-listbox"
            aria-activedescendant={flatItems[activeIndex]?.key}
          />
          <ul id="global-search-listbox" role="listbox" className="flex max-h-80 flex-col gap-0.5 overflow-y-auto">
            {query.trim().length === 1 ? (
              <li className="px-2 py-3 text-center text-muted-foreground">{t.minChars}</li>
            ) : flatItems.length === 0 ? (
              <li className="px-2 py-3 text-center text-muted-foreground">{t.noResults}</li>
            ) : (
              flatItems.map((item, index) => (
                <li key={item.key}>
                  <button
                    id={item.key}
                    type="button"
                    role="option"
                    aria-selected={index === activeIndex}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => activate(item)}
                    className={
                      "flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left " +
                      (index === activeIndex ? "bg-muted text-foreground" : "text-foreground/80")
                    }
                  >
                    <span>{item.label}</span>
                    {item.sublabel ? (
                      <span className="text-muted-foreground">{item.sublabel}</span>
                    ) : null}
                  </button>
                </li>
              ))
            )}
            {pending ? <li className="px-2 py-1 text-center text-muted-foreground">…</li> : null}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}
