import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSessionContext, homeRouteFor } from "@/server/services/session";
import { de } from "@/messages/de";
import { RegisterForm } from "./register-form";
import { getPendingInvite } from "@/server/services/invites";
import { getPendingStaffInviteFromSession } from "@/server/services/staff-invites";

export const metadata: Metadata = { title: de.auth.register.title };

/**
 * Registrierung ist ohne Einladung möglich und erzeugt ein
 * unverbundenes Patientenkonto. Liegt eine geprüfte Einladung vor
 * (Einladungslink), wird deren Kontext angezeigt und der Name/die
 * E-Mail-Adresse vorbelegt. Die vorbelegte E-Mail ist reine UX - die
 * eigentliche Sicherheitsprüfung (E-Mail muss zur Einladung passen)
 * läuft unabhängig davon serverseitig in accept_staff_invite.
 */
export default async function RegisterPage() {
  const session = await getSessionContext();
  if (session) redirect(homeRouteFor(session));

  const invite = await getPendingInvite();
  const staffInvite = await getPendingStaffInviteFromSession();

  return (
    <RegisterForm
      practiceName={invite?.practiceName ?? staffInvite?.practiceName ?? null}
      patientDisplayName={invite?.patientDisplayName ?? null}
      lockedEmail={staffInvite?.email ?? null}
    />
  );
}
