import Link from "next/link";
import { de } from "@/messages/de";

const pages = [
  { href: "/privacy", label: de.legal.nav.privacyPolicy },
  { href: "/impressum", label: de.legal.nav.imprint },
  { href: "/agb", label: de.legal.nav.termsOfUse },
  { href: "/cookies", label: de.legal.nav.cookiePolicy },
] as const;

/**
 * Querverweise zwischen den rechtlichen Pflichtseiten, damit jede von
 * ihnen aus jeder anderen erreichbar ist (nicht nur von der Startseite).
 */
export function LegalLinks({ current }: { current?: (typeof pages)[number]["href"] }) {
  const others = pages.filter((page) => page.href !== current);
  return (
    <nav aria-label="Weitere rechtliche Seiten" className="flex flex-wrap gap-x-4 gap-y-2 text-base">
      {others.map((page) => (
        <Link key={page.href} href={page.href} className="font-semibold text-primary underline underline-offset-4">
          {page.label}
        </Link>
      ))}
    </nav>
  );
}
