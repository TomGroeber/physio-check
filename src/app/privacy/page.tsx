import type { Metadata } from "next";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { branding } from "@/config/branding";
import { de } from "@/messages/de";

export const metadata: Metadata = { title: de.legal.privacyPolicy.heading };

/**
 * Öffentlich erreichbare Datenschutzerklärung (Store-Pflicht für App
 * Privacy/Data Safety, siehe docs/RELEASE_READINESS.md A6). Der Text
 * ist ein ehrlicher technischer Entwurf (Basis: docs/PRIVACY_SECURITY.md),
 * KEINE rechtlich geprüfte Fassung – das macht `draftNotice` explizit,
 * statt Rechtskonformität zu behaupten (CLAUDE.md-Regel).
 */
export default function PrivacyPolicyPage() {
  const t = de.legal.privacyPolicy;
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10 text-lg">
      <h1 className="text-3xl font-bold tracking-tight">{t.heading}</h1>
      <p className="text-sm text-muted-foreground">
        {t.lastUpdated}: 22. Juli 2026
      </p>
      <Alert className="border-warning bg-warning/15 px-4 py-3">
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
        <p>
          Informationen zur Kontolöschung finden Sie{" "}
          <Link href="/account-deletion" className="font-semibold text-primary underline">
            hier
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
