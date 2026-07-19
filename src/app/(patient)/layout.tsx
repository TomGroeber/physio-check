import Image from "next/image";
import { redirect } from "next/navigation";
import { getSessionContext } from "@/server/services/session";
import { getOwnAvatarUrl } from "@/server/services/patient-avatar";
import { branding } from "@/config/branding";
import { BottomNav } from "@/components/patient/bottom-nav";
import { PatientAvatar } from "@/components/patient-avatar";

/**
 * Layout der Patientenoberfläche (mobile-first).
 * Zugriff nur für angemeldete Patienten mit aktiver Praxisverknüpfung –
 * ohne Verknüpfung geht es zur Einladungseingabe. Die Datenbank schützt
 * zusätzlich per RLS, dieses Layout steuert nur die Navigation.
 */
export default async function PatientLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSessionContext();
  if (!session) redirect("/login");
  if (session.memberships.length > 0) redirect("/practice");
  if (!session.patientLink) redirect("/connect");
  const avatarUrl = await getOwnAvatarUrl(session.userId);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-lg items-center gap-3 px-4">
          <Image src={branding.logoPath} alt="" width={32} height={32} />
          <span className="text-xl font-bold">{branding.appName}</span>
          <span className="ml-auto">
            <PatientAvatar url={avatarUrl} name={session.fullName} size="sm" />
          </span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6 pb-28 text-lg">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
