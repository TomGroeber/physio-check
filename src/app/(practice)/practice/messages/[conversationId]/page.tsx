import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { getSessionContext } from "@/server/services/session";
import { getPracticeConversation } from "@/server/services/messages";
import { branding } from "@/config/branding";
import { PracticeMessageThread } from "./practice-message-thread";
import { de } from "@/messages/de";

export const metadata: Metadata = { title: de.practice.messages.title };

const t = de.practice.messages;

export default async function PracticeConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const session = await getSessionContext();
  if (!session?.memberships[0]) redirect("/login");
  const { conversationId } = await params;

  const conversation = await getPracticeConversation(conversationId);
  if (!conversation || conversation.practiceId !== session.memberships[0].practiceId) notFound();

  return (
    <div className="flex h-[calc(100dvh-4rem)] max-w-3xl flex-col gap-4 md:h-[calc(100dvh-6rem)]">
      <div className="flex items-center justify-between gap-3">
        <Link href="/practice/messages" className="flex items-center gap-2 text-base font-semibold text-primary">
          <HugeiconsIcon icon={ArrowLeft02Icon} strokeWidth={2} className="size-5" aria-hidden />
          {t.backToList}
        </Link>
        <Link
          href={`/practice/patients/${conversation.patientProfileId}`}
          className="text-base font-semibold text-primary underline"
        >
          {t.openPatientDetail}
        </Link>
      </div>
      <h1 className="text-2xl font-bold">{conversation.patientName}</h1>
      <PracticeMessageThread
        conversationId={conversation.id}
        initialMessages={conversation.messages}
        timeZone={branding.defaultTimeZone}
      />
    </div>
  );
}
