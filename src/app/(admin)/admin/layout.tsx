import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Logout03Icon } from "@hugeicons/core-free-icons";
import { getPlatformAdminSession } from "@/server/services/platform-admin-auth";
import { signOutAction } from "@/server/actions/auth";
import { AdminNav } from "@/components/admin/admin-nav";
import { branding } from "@/config/branding";
import { de } from "@/messages/de";

/**
 * Betreiberportal: eigene, klar getrennte Oberfläche unter `/admin`.
 * Zugriff ausschließlich für Plattformadmins - NIEMALS über
 * practice_members/Praxis-Mitgliedschaft (siehe DECISIONS.md).
 * `getPlatformAdminSession()` prüft serverseitig über die
 * SECURITY-DEFINER-Funktion `is_platform_admin()`; RLS auf
 * `platform_admins` selbst lässt ohnehin keinen Client-Zugriff zu.
 */
export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getPlatformAdminSession();
  if (!session) redirect("/login");

  return (
    <div className="relative flex min-h-dvh flex-col bg-background md:flex-row">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-primary/12 via-transparent to-accent/20"
      />
      <aside className="flex flex-col gap-4 p-4 md:min-h-dvh md:w-64 md:shrink-0">
        <div className="glass-panel flex flex-1 flex-col gap-4 p-4">
          <Link
            href="/admin"
            className="flex items-center gap-3 rounded-md px-1 focus-visible:outline-2 focus-visible:outline-ring"
          >
            <Image src={branding.logoPath} alt="" width={28} height={28} />
            <span className="text-base font-bold">{branding.appName}</span>
          </Link>
          <p className="px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Betreiberportal
          </p>
          <AdminNav />
          <div className="mt-auto flex flex-col gap-2 border-t border-glass-border pt-3">
            <p className="truncate px-1 text-sm text-muted-foreground">{session.email}</p>
            <form action={signOutAction}>
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-base text-foreground/80 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-ring"
              >
                <HugeiconsIcon icon={Logout03Icon} strokeWidth={2} className="size-5" aria-hidden />
                {de.common.signOut}
              </button>
            </form>
          </div>
        </div>
      </aside>
      <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
    </div>
  );
}
