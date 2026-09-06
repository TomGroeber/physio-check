import type { Metadata } from "next";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LegalLinks } from "@/components/legal-links";
import { branding } from "@/config/branding";
import { legalDocuments } from "@/config/legal";
import { formatIsoDateLongDe } from "@/lib/datetime";
import { de } from "@/messages/de";

export const metadata: Metadata = { title: de.legal.imprint.heading };

/**
 * ACHTUNG: Reiner Entwurf mit Platzhaltern statt echter Firmendaten
 * (siehe draftNotice). Darf nicht live gehen, bevor Tom die
 * eckigen Klammern durch echte Angaben ersetzt hat UND eine
 * rechtliche Prüfung stattgefunden hat (CLAUDE.md-Regel: keine
 * Rechtskonformität behaupten, die nicht bestätigt wurde).
 */
export default function ImprintPage() {
  const t = de.legal.imprint;
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10 text-lg">
      <h1 className="text-3xl font-bold tracking-tight">{t.heading}</h1>
      <p className="text-sm text-muted-foreground">
        {t.lastUpdated}: {formatIsoDateLongDe(legalDocuments.imprint.version)}
      </p>
      <Alert className="border-destructive bg-destructive/10 px-4 py-3">
        <AlertDescription className="text-base text-foreground">
          {t.draftNotice}
        </AlertDescription>
      </Alert>
      {t.sections.map((section) => (
        <section key={section.title} className="flex flex-col gap-2">
          <h2 className="text-xl font-bold">{section.title}</h2>
          <p>{section.body}</p>
        </section>
      ))}
      <section className="flex flex-col gap-2">
        <p>
          Kontakt:{" "}
          <a
            href={`mailto:${branding.supportEmail}`}
            className="font-semibold text-primary underline"
          >
            {branding.supportEmail}
          </a>
        </p>
      </section>
      <LegalLinks current="/impressum" />
    </main>
  );
}
