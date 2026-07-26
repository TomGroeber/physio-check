"use server";

import { revalidatePath } from "next/cache";
import { getSessionContext } from "@/server/services/session";
import {
  markPatientConversationRead,
  markPracticeConversationRead,
  sendPatientMessage,
  sendPracticeReply,
} from "@/server/services/messages";
import { messageBodySchema } from "@/lib/validation/messages";

export type MessageActionState = { error?: string };

export async function sendPatientMessageAction(
  _previousState: MessageActionState,
  formData: FormData
): Promise<MessageActionState> {
  const session = await getSessionContext();
  if (!session?.patientLink) return { error: "Sie sind aktuell mit keiner Praxis verbunden." };

  const parsed = messageBodySchema.safeParse(formData.get("body"));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Nachricht." };

  const result = await sendPatientMessage(parsed.data);
  if ("error" in result) return { error: result.error };

  revalidatePath("/messages");
  return {};
}

export async function markPatientConversationReadAction(): Promise<void> {
  const session = await getSessionContext();
  if (!session?.patientLink) return;
  await markPatientConversationRead();
  revalidatePath("/messages");
}

export async function sendPracticeReplyAction(
  conversationId: string,
  _previousState: MessageActionState,
  formData: FormData
): Promise<MessageActionState> {
  const session = await getSessionContext();
  if (!session || session.memberships.length === 0) return { error: "Nicht berechtigt." };

  const parsed = messageBodySchema.safeParse(formData.get("body"));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Nachricht." };

  const result = await sendPracticeReply(conversationId, parsed.data);
  if ("error" in result) return { error: result.error };

  revalidatePath(`/practice/messages/${conversationId}`);
  revalidatePath("/practice/messages");
  return {};
}

export async function markPracticeConversationReadAction(conversationId: string): Promise<void> {
  const session = await getSessionContext();
  if (!session || session.memberships.length === 0) return;
  await markPracticeConversationRead(conversationId);
  revalidatePath("/practice/messages");
}
