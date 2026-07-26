"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  markPatientConversationReadAction,
  sendPatientMessageAction,
  type MessageActionState,
} from "@/server/actions/messages";
import { GlassPanel } from "@/components/ui/glass-panel";
import { FormMessage } from "@/components/auth/form-message";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/datetime";
import { de } from "@/messages/de";
import { cn } from "@/lib/utils";

const t = de.patient.messages;
const POLL_INTERVAL_MS = 8000;

type Message = {
  id: string;
  senderProfileId: string;
  senderRole: "patient" | "practice";
  body: string;
  createdAt: string;
};

export function MessageThread({
  initialMessages,
  ownProfileId,
  timeZone,
}: {
  initialMessages: Message[];
  ownProfileId: string;
  timeZone: string;
}) {
  const router = useRouter();
  const listRef = useRef<HTMLDivElement>(null);
  const [state, formAction, pending] = useActionState<MessageActionState, FormData>(
    sendPatientMessageAction,
    {}
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    void markPatientConversationReadAction();
  }, []);

  useEffect(() => {
    if (!pending && !state.error) formRef.current?.reset();
  }, [pending, state.error]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [initialMessages.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="flex flex-1 flex-col gap-3">
      <GlassPanel className="flex-1 overflow-y-auto p-4" ref={listRef}>
        {initialMessages.length === 0 ? (
          <p className="py-8 text-center text-base text-muted-foreground">{t.emptyState}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {initialMessages.map((message) => {
              const own = message.senderProfileId === ownProfileId;
              return (
                <li key={message.id} className={cn("flex", own ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3 text-lg",
                      own
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{message.body}</p>
                    <p
                      className={cn(
                        "mt-1 text-sm",
                        own ? "text-primary-foreground/75" : "text-muted-foreground"
                      )}
                    >
                      {t.sentAt(formatTime(new Date(message.createdAt), timeZone))}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </GlassPanel>

      <p className="text-sm text-muted-foreground">{t.safetyNotice}</p>

      <GlassPanel strong className="p-3">
        <form ref={formRef} action={formAction} className="flex flex-col gap-2">
          <FormMessage error={state.error} />
          <div className="flex items-end gap-2">
            <textarea
              name="body"
              required
              maxLength={2000}
              rows={2}
              placeholder={t.placeholder}
              aria-label={t.placeholder}
              className="min-h-18 flex-1 resize-none rounded-xl border border-input bg-background px-4 py-3 text-lg focus-visible:outline-2 focus-visible:outline-ring"
            />
            <Button type="submit" disabled={pending} className="h-12 min-w-24 text-base">
              {pending ? t.sending : t.send}
            </Button>
          </div>
        </form>
      </GlassPanel>
    </div>
  );
}
