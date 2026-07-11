import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getSessionContext, homeRouteFor } from "@/server/services/session";
import { branding } from "@/config/branding";
import { Button } from "@/components/ui/button";
import { de } from "@/messages/de";

/**
 * Öffentliche, bewusst einfache Startseite. Angemeldete Benutzer
 * werden weiterhin direkt in ihren passenden Bereich geleitet.
 */
export default async function RootPage() {
  const session = await getSessionContext();
  if (session) redirect(homeRouteFor(session));

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="flex w-full max-w-lg flex-col items-center gap-7 text-center">
        <div className="flex items-center gap-3">
          <Image src={branding.logoPath} alt="" width={52} height={52} priority />
          <span className="text-3xl font-bold">{branding.appName}</span>
        </div>
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{de.landing.title}</h1>
          <p className="text-lg text-muted-foreground">{de.landing.intro}</p>
        </div>
        <div className="flex w-full flex-col gap-3">
          <Button asChild className="h-14 text-lg">
            <Link href="/invite">{de.landing.haveCode}</Link>
          </Button>
          <Button asChild variant="outline" className="h-14 text-lg">
            <Link href="/login">{de.landing.signIn}</Link>
          </Button>
        </div>
        <p className="text-base text-muted-foreground">{de.landing.noInvite}</p>
      </div>
    </main>
  );
}
