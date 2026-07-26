import type { Metadata } from "next";
import { getSessionContext } from "@/server/services/session";
import { getPractice, listPracticeMembers } from "@/server/services/practice";
import { listStaffInvites } from "@/server/services/staff-invites";
import { GlassPanel, GlassPanelHeader, GlassPanelTitle } from "@/components/ui/glass-panel";
import { de } from "@/messages/de";
import { MembersSection, ProfileForm, SettingsForm } from "./settings-forms";
import type { PracticeSettings } from "@/lib/validation/platform-admin";

export const metadata: Metadata = { title: de.practice.settings.title };

const t = de.practice.settings;

/**
 * Praxis-Einstellungen. Stammdaten/Mitarbeitende/Einstellungen sind
 * nur für Praxisadmins bearbeitbar (Phase E) - Therapeuten sehen
 * ausschließlich die Lesevariante, damit sie keine Mitglieder- oder
 * Betreiberrollen verwalten können.
 */
export default async function SettingsPage() {
  const session = (await getSessionContext())!;
  const membership = session.memberships[0];
  const isAdmin = session.memberships.some((m) => m.role === "admin");
  const practice = await getPractice(membership.practiceId);

  if (!isAdmin) {
    return (
      <div className="flex max-w-3xl flex-col gap-6">
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <GlassPanel>
          <GlassPanelHeader>
            <GlassPanelTitle>{t.practiceData}</GlassPanelTitle>
          </GlassPanelHeader>
          <div className="flex flex-col gap-1 text-base">
            <p className="font-semibold">{practice?.name}</p>
            <p>{practice?.address_street}</p>
            <p>
              {practice?.address_postal_code} {practice?.address_city}
            </p>
            {practice?.phone && <p>{practice.phone}</p>}
          </div>
        </GlassPanel>
        <p className="text-sm text-muted-foreground">{t.onlyAdminsCanManage}</p>
      </div>
    );
  }

  const [members, openInvites] = await Promise.all([
    listPracticeMembers(membership.practiceId),
    listStaffInvites(membership.practiceId),
  ]);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <h1 className="text-2xl font-bold">{t.title}</h1>
      {practice ? <ProfileForm practice={practice} /> : null}
      <SettingsForm settings={(practice?.settings as Partial<PracticeSettings>) ?? {}} />
      <MembersSection
        members={members}
        openInvites={openInvites.map((invite) => ({
          id: invite.id,
          email: invite.email,
          role: invite.role,
        }))}
      />
    </div>
  );
}
