import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSessionContext, homeRouteFor } from "@/server/services/session";
import { de } from "@/messages/de";
import { RegisterForm } from "./register-form";
import { getPendingInvite } from "@/server/services/invites";

export const metadata: Metadata = { title: de.auth.register.title };

/**
 * Registrierung ist ohne Einladung möglich und erzeugt ein
 * unverbundenes Patientenkonto. Liegt eine geprüfte Einladung vor
 * (Einladungslink), wird deren Kontext angezeigt und der Name vorbelegt.
 */
export default async function RegisterPage() {
  const session = await getSessionContext();
  if (session) redirect(homeRouteFor(session));

  const invite = await getPendingInvite();

  return (
    <RegisterForm
      practiceName={invite?.practiceName ?? null}
      patientDisplayName={invite?.patientDisplayName ?? null}
    />
  );
}
