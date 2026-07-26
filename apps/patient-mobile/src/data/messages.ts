import { supabase } from "@/lib/supabase";

export type MessageView = {
  id: string;
  senderProfileId: string;
  senderRole: "patient" | "practice";
  body: string;
  createdAt: string;
};

export type ConversationView = {
  id: string | null;
  messages: MessageView[];
};

/** Unterhaltung mit der aktuell verbundenen Praxis (wie messages/page.tsx). */
export async function getConversation(practiceId: string): Promise<ConversationView> {
  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .select("id")
    .eq("practice_id", practiceId)
    .maybeSingle();
  if (conversationError) throw new Error(conversationError.message);
  if (!conversation) return { id: null, messages: [] };

  const { data: messages, error: messagesError } = await supabase
    .from("messages")
    .select("id, sender_profile_id, sender_role, body, created_at")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: true });
  if (messagesError) throw new Error(messagesError.message);

  return {
    id: conversation.id,
    messages: (messages ?? []).map((m) => ({
      id: m.id,
      senderProfileId: m.sender_profile_id,
      senderRole: m.sender_role as "patient" | "practice",
      body: m.body,
      createdAt: m.created_at,
    })),
  };
}

export async function sendMessage(body: string): Promise<void> {
  const { error } = await supabase.rpc("send_patient_message", { p_body: body });
  if (error) throw new Error(error.message);
}

export async function markConversationRead(): Promise<void> {
  await supabase.rpc("mark_conversation_read_as_patient");
}

/** Ungelesene Antwort der Praxis vorhanden? (Tab-Badge). */
export async function hasUnreadReply(practiceId: string): Promise<boolean> {
  const { data } = await supabase
    .from("conversations")
    .select("last_message_at, patient_last_read_at")
    .eq("practice_id", practiceId)
    .maybeSingle();
  if (!data) return false;
  if (!data.patient_last_read_at) return true;
  return new Date(data.last_message_at) > new Date(data.patient_last_read_at);
}
