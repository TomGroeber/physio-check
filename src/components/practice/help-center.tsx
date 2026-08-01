"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { de } from "@/messages/de";

const t = de.practice.help;

function normalize(value: string) {
  return value.toLowerCase();
}

/**
 * Hilfecenter für Praxismitarbeitende: statische, im Code gepflegte
 * Inhalte (packages/shared/src/messages-de.ts) mit clientseitigem
 * Filter – kein Server-Roundtrip nötig, da es keine Nutzer- oder
 * Praxisdaten enthält.
 */
export function HelpCenter() {
  const [query, setQuery] = useState("");
  const needle = normalize(query.trim());

  const filteredSections = useMemo(() => {
    if (!needle) return t.sections;
    return t.sections
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) => normalize(item.q).includes(needle) || normalize(item.a).includes(needle)
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [needle]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <p className="text-muted-foreground">{t.intro}</p>
      </div>

      <div className="flex max-w-md flex-col gap-2">
        <Label htmlFor="help-search">{t.searchLabel}</Label>
        <Input
          id="help-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t.searchPlaceholder}
        />
      </div>

      {filteredSections.length === 0 ? (
        <p className="text-muted-foreground">{t.noResults}</p>
      ) : (
        <div className="flex flex-col gap-8">
          {filteredSections.map((section) => (
            <section key={section.id} aria-labelledby={`help-${section.id}`} className="flex flex-col gap-3">
              <h2 id={`help-${section.id}`} className="text-xl font-bold">
                {section.title}
              </h2>
              <div className="flex flex-col gap-2">
                {section.items.map((item) => (
                  <details key={item.q} open={Boolean(needle)} className="rounded-lg border p-4">
                    <summary className="cursor-pointer font-semibold">{item.q}</summary>
                    <p className="mt-2 text-muted-foreground">{item.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <p className="text-sm text-muted-foreground">{t.contactHint}</p>
    </div>
  );
}
