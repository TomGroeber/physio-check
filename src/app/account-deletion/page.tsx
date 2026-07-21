import type { Metadata } from "next";
import Link from "next/link";
import { branding } from "@/config/branding";
import { de } from "@/messages/de";

export const metadata: Metadata = { title: de.patient.profile.deleteAccount.heading };

/**
 * Öffentlich erreichbare Info-Seite zur Kontolöschung (Master-Prompt
 * Phase 4/6: App Store und Google Play verlangen eine öffentlich
 * erreichbare Lösch-URL, auch ohne installierte App). Die tatsächliche
 * Löschung verlangt bewusst eine Anmeldung – das ist eine
 * Sicherheitsanforderung (nur die Kontoinhaberin darf ihr eigenes
 * Konto löschen), keine Einschränkung, die diese Seite umgehen soll.
 */
export default function AccountDeletionInfoPage() {
  const t = de.patient.profile.deleteAccount;
  return (
    <main className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-10 text-lg">
      <h1 className="text-3xl font-bold tracking-tight">{t.heading}</h1>
      <p>{t.body}</p>
      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-bold">So beantragen Sie die Löschung</h2>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            Melden Sie sich in der {branding.appName}-App oder{" "}
            <Link href="/login" className="font-semibold text-primary underline">
              auf der Website
            </Link>{" "}
            mit Ihrem bestehenden Konto an.
          </li>
          <li>
            Öffnen Sie &bdquo;Profil&ldquo; und dort den Bereich &bdquo;{t.heading}&ldquo;.
          </li>
          <li>
            Bestätigen Sie den Hinweis und geben Sie zur Sicherheit Ihr aktuelles
            Passwort erneut ein.
          </li>
        </ol>
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-bold">Was passiert dabei?</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Ihr Zugang wird sofort gesperrt.</li>
          <li>Ihr Profilbild, Ihre Telefonnummer und Ihre Erinnerungseinstellungen werden sofort gelöscht.</li>
          <li>
            Praxisbezogene Behandlungsdaten (Termine, Übungspläne, Selbstauskünfte,
            Verordnungen) bleiben gespeichert, bis die gesetzliche
            Aufbewahrungsfrist rechtlich abschließend geklärt ist. Das ist eine
            offene Rechtsfrage, keine erfundene Ausnahme.
          </li>
        </ul>
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-bold">Kein Zugang mehr zu Ihrem Konto?</h2>
        <p>
          Wenn Sie sich nicht mehr anmelden können, schreiben Sie uns an{" "}
          <a href={`mailto:${branding.supportEmail}`} className="font-semibold text-primary underline">
            {branding.supportEmail}
          </a>
          . Wir prüfen Ihre Identität und bearbeiten Ihre Anfrage manuell.
        </p>
      </section>
    </main>
  );
}
