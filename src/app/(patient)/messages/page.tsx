import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionContext } from "@/server/services/session";
import { getPatientConversation } from "@/server/services/messages";
import { branding } from "@/config/branding";
import { MessageThread } from "./message-thread";
import { de } from "@/messages/de";

export const metadata: Metadata = { title: de.patient.messages.title };

const t = de.patient.messages;

/**
 * Nachrichten mit der aktuell verbundenen Praxis. Das Layout leitet
 * ohne Praxisverknüpfung bereits nach /connect weiter; Next rendert
 * Layout und Seite aber nebenläufig, daher hier zusätzlich eine eigene
 * Prüfung statt uns auf die reine Reihenfolge zu verlassen.
 */
export default async function MessagesPage() {
  const session = (await getSessionContext())!;
  if (!session.patientLink) redirect("/connect");
  const patientLink = session.patientLink;
  const conversation = await getPatientConversation(patientLink.practiceId, patientLink.practiceName);

  return (
    <div className="flex h-full flex-col gap-4">
      <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
      <p className="text-base text-muted-foreground">{patientLink.practiceName}</p>
      <MessageThread
        initialMessages={conversation?.messages ?? []}
        ownProfileId={session.userId}
        timeZone={conversation?.timeZone ?? branding.defaultTimeZone}
      />
    </div>
  );
}
