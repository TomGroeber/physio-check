import "server-only";

import { createSupabaseServerClient } from "@/server/db/server-client";
import { branding } from "@/config/branding";

export type MessageRow = {
  id: string;
  conversationId: string;
  senderProfileId: string;
  senderRole: "patient" | "practice";
  senderName: string | null;
  body: string;
  createdAt: string;
};

export type PatientConversation = {
  id: string;
  practiceName: string;
  patientLastReadAt: string | null;
  messages: MessageRow[];
  timeZone: string;
};

function toMessageRow(
  row: {
    id: string;
    conversation_id: string;
    sender_profile_id: string;
    sender_role: string;
    body: string;
    created_at: string;
  },
  staffNames?: Map<string, string>
): MessageRow {
  const senderRole = row.sender_role as "patient" | "practice";
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderProfileId: row.sender_profile_id,
    senderRole,
    senderName: senderRole === "practice" ? staffNames?.get(row.sender_profile_id) ?? null : null,
    body: row.body,
    createdAt: row.created_at,
  };
}

/**
 * Unterhaltung der Patientin/des Patienten mit der aktuell verbundenen
 * Praxis. Gibt `null` zurück, solange noch keine Nachricht gesendet
 * wurde (neutraler Leerzustand in der UI).
 */
export async function getPatientConversation(
  practiceId: string,
  practiceName: string
): Promise<PatientConversation | null> {
  const supabase = await createSupabaseServerClient();
  const [{ data: conversation }, { data: practice }] = await Promise.all([
    supabase
      .from("conversations")
      .select("id, patient_last_read_at")
      .eq("practice_id", practiceId)
      .maybeSingle(),
    supabase.from("practices").select("timezone").eq("id", practiceId).single(),
  ]);
  const timeZone = practice?.timezone ?? branding.defaultTimeZone;
  if (!conversation) return null;

  const { data: messages } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_profile_id, sender_role, body, created_at")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: true });

  return {
    id: conversation.id,
    practiceName,
    patientLastReadAt: conversation.patient_last_read_at,
    messages: (messages ?? []).map((m) => toMessageRow(m)),
    timeZone,
  };
}

/** Ungelesene Antworten der Praxis aus Patientensicht (für Badges). */
export async function hasUnreadPracticeReply(practiceId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data: conversation } = await supabase
    .from("conversations")
    .select("last_message_at, patient_last_read_at")
    .eq("practice_id", practiceId)
    .maybeSingle();
  if (!conversation) return false;
  if (!conversation.patient_last_read_at) return true;
  return new Date(conversation.last_message_at) > new Date(conversation.patient_last_read_at);
}

export type SendResult = { error: string } | { conversationId: string; messageId: string };

export async function sendPatientMessage(body: string): Promise<SendResult> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("send_patient_message", { p_body: body });
  if (error || !data?.[0]) return { error: mapMessageRpcError(error?.message) };
  return { conversationId: data[0].out_conversation_id, messageId: data[0].out_message_id };
}

export async function markPatientConversationRead(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.rpc("mark_conversation_read_as_patient");
}

export type PracticeConversationSummary = {
  id: string;
  patientProfileId: string;
  patientName: string;
  lastMessageAt: string;
  lastMessagePreview: string;
  lastMessageSenderRole: "patient" | "practice" | null;
  unread: boolean;
};

export type ConversationFilter = "all" | "unread" | "open" | "answered";

/**
 * Unterhaltungen der Praxis mit aktuell verbundenen Patient:innen.
 * "unread": neue Patientennachricht seit dem letzten Praxis-Lesen.
 * "open": letzte Nachricht kam von der Patientin/dem Patienten (noch
 * keine Antwort). "answered": letzte Nachricht kam von der Praxis.
 */
export async function listPracticeConversations(
  practiceId: string,
  filter: ConversationFilter,
  search: string
): Promise<PracticeConversationSummary[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("conversations")
    .select(
      "id, patient_profile_id, last_message_at, practice_last_read_at, patient:profiles!conversations_patient_profile_id_fkey(full_name)"
    )
    .eq("practice_id", practiceId)
    .order("last_message_at", { ascending: false });

  const conversations = data ?? [];
  if (conversations.length === 0) return [];

  const { data: lastMessages } = await supabase
    .from("messages")
    .select("conversation_id, sender_role, body, created_at")
    .in(
      "conversation_id",
      conversations.map((c) => c.id)
    )
    .order("created_at", { ascending: false });

  const lastByConversation = new Map<string, { senderRole: "patient" | "practice"; body: string }>();
  for (const m of lastMessages ?? []) {
    if (!lastByConversation.has(m.conversation_id)) {
      lastByConversation.set(m.conversation_id, {
        senderRole: m.sender_role as "patient" | "practice",
        body: m.body,
      });
    }
  }

  const summaries: PracticeConversationSummary[] = conversations.map((c) => {
    const last = lastByConversation.get(c.id);
    const unread = Boolean(
      last?.senderRole === "patient" &&
        (!c.practice_last_read_at || new Date(c.last_message_at) > new Date(c.practice_last_read_at))
    );
    return {
      id: c.id,
      patientProfileId: c.patient_profile_id,
      patientName: c.patient?.full_name || "Patient:in",
      lastMessageAt: c.last_message_at,
      lastMessagePreview: last?.body ?? "",
      lastMessageSenderRole: last?.senderRole ?? null,
      unread,
    };
  });

  const searchLower = search.trim().toLowerCase();
  return summaries.filter((s) => {
    if (searchLower && !s.patientName.toLowerCase().includes(searchLower)) return false;
    if (filter === "unread") return s.unread;
    if (filter === "open") return s.lastMessageSenderRole === "patient";
    if (filter === "answered") return s.lastMessageSenderRole === "practice";
    return true;
  });
}

/** Anzahl Unterhaltungen mit ungelesener Patientennachricht (Nav-Badge). */
export async function countUnreadPracticeConversations(practiceId: string): Promise<number> {
  const conversations = await listPracticeConversations(practiceId, "unread", "");
  return conversations.length;
}

export type PracticeConversationDetail = {
  id: string;
  practiceId: string;
  patientProfileId: string;
  patientName: string;
  messages: MessageRow[];
};

/** Für den Sprung vom Patientenprofil zur Unterhaltung (falls vorhanden). */
export async function findConversationId(practiceId: string, patientProfileId: string): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("conversations")
    .select("id")
    .eq("practice_id", practiceId)
    .eq("patient_profile_id", patientProfileId)
    .maybeSingle();
  return data?.id ?? null;
}

export async function getPracticeConversation(
  conversationId: string
): Promise<PracticeConversationDetail | null> {
  const supabase = await createSupabaseServerClient();
  const { data: conversation } = await supabase
    .from("conversations")
    .select(
      "id, practice_id, patient_profile_id, patient:profiles!conversations_patient_profile_id_fkey(full_name)"
    )
    .eq("id", conversationId)
    .maybeSingle();
  if (!conversation) return null;

  const [{ data: messages }, { data: members }] = await Promise.all([
    supabase
      .from("messages")
      .select("id, conversation_id, sender_profile_id, sender_role, body, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true }),
    supabase
      .from("practice_members")
      .select("profile_id, profiles(full_name)")
      .eq("practice_id", conversation.practice_id),
  ]);

  const staffNames = new Map((members ?? []).map((m) => [m.profile_id, m.profiles?.full_name ?? ""]));

  return {
    id: conversation.id,
    practiceId: conversation.practice_id,
    patientProfileId: conversation.patient_profile_id,
    patientName: conversation.patient?.full_name || "Patient:in",
    messages: (messages ?? []).map((m) => toMessageRow(m, staffNames)),
  };
}

export async function sendPracticeReply(conversationId: string, body: string): Promise<SendResult> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("send_practice_reply", {
    p_conversation_id: conversationId,
    p_body: body,
  });
  if (error || !data?.[0]) return { error: mapMessageRpcError(error?.message) };
  return { conversationId, messageId: data[0].out_message_id };
}

export async function markPracticeConversationRead(conversationId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.rpc("mark_conversation_read_as_practice", { p_conversation_id: conversationId });
}

function mapMessageRpcError(message?: string): string {
  switch (message) {
    case "invalid_message":
      return "Die Nachricht ist ungültig (leer oder zu lang).";
    case "rate_limited":
      return "Zu viele Nachrichten in kurzer Zeit. Bitte warten Sie einen Moment.";
    case "no_active_practice_link":
      return "Sie sind aktuell mit keiner Praxis verbunden.";
    case "patient_not_currently_linked":
      return "Diese Person ist nicht mehr mit Ihrer Praxis verbunden. Eine Antwort ist nicht mehr möglich.";
    case "conversation_not_found":
      return "Diese Unterhaltung wurde nicht gefunden.";
    default:
      return "Die Nachricht konnte nicht gesendet werden. Bitte versuchen Sie es erneut.";
  }
}
