import { openStaffInviteAction } from "@/server/actions/staff-invites";

/**
 * Öffentlicher Einstiegspunkt eines Mitarbeiter-Einladungslinks.
 * Speichert die Sitzung (siehe staff-invites.ts) und leitet direkt
 * weiter - kein eigener Inhalt, analog zum Aufbau von `/invite`.
 */
export default async function StaffInviteTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  await openStaffInviteAction(token);
  return null;
}
