import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionContext } from "@/server/services/session";
import { signOutAction } from "@/server/actions/auth";
import { branding } from "@/config/branding";
import { SidebarNav } from "@/components/practice/sidebar-nav";
import { HugeiconsIcon } from "@hugeicons/react";
import { Logout03Icon } from "@hugeicons/core-free-icons";
import { de } from "@/messages/de";

/**
 * Layout des Praxisbereichs (Desktop/Tablet-optimiert).
 * Zugriff nur für aktive Praxis-Mitglieder; die Datenbank schützt
 * zusätzlich per RLS.
 */
export default async function PracticeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSessionContext();
  if (!session) redirect("/login");
  if (session.memberships.length === 0) {
    redirect(session.patientLink ? "/today" : "/connect");
  }

  const practiceName = session.memberships[0].practiceName;

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <aside className="flex flex-col gap-4 bg-sidebar p-4 text-sidebar-foreground md:min-h-dvh md:w-64 md:shrink-0">
        <Link
          href="/practice"
          className="flex items-center gap-3 rounded-md px-1 focus-visible:outline-2 focus-visible:outline-sidebar-ring"
        >
          <Image src={branding.logoPath} alt="" width={32} height={32} />
          <span className="text-lg font-bold">{branding.appName}</span>
        </Link>
        <p className="px-1 text-sm text-sidebar-foreground/70">{practiceName}</p>
        <SidebarNav />
        <div className="mt-auto flex flex-col gap-2 border-t border-sidebar-border pt-3">
          <p className="truncate px-1 text-sm text-sidebar-foreground/70">
            {session.fullName}
          </p>
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-base text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground focus-visible:outline-2 focus-visible:outline-sidebar-ring"
            >
              <HugeiconsIcon icon={Logout03Icon} strokeWidth={2} className="size-5" aria-hidden />
              {de.common.signOut}
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
    </div>
  );
}
