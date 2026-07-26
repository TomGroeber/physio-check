import { useEffect, useRef, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { formatTime } from "@physio-check/shared";
import { TAB_BAR_CONTENT_HEIGHT } from "@/components/tab-bar";
import {
  AppButton,
  Banner,
  Body,
  ErrorView,
  LoadingView,
  Screen,
  Title,
  useTheme,
} from "@/components/ui";
import { branding, radius, spacing, touch, type } from "@/config/branding";
import { web } from "@/messages/de";
import { getConversation, markConversationRead, sendMessage } from "@/data/messages";
import { useSession } from "@/lib/session";
import { useLoad } from "@/lib/use-load";

const t = web.patient.messages;

/** Nachrichten mit der aktuell verbundenen Praxis, wie messages/page.tsx der Website. */
export default function Messages() {
  const theme = useTheme();
  const { session, link } = useSession();
  const userId = session?.user.id ?? "";
  const practiceId = link?.practiceId ?? "";
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  const state = useLoad(async () => getConversation(practiceId), [practiceId]);

  useEffect(() => {
    if (state.data) void markConversationRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.data?.id]);

  if (state.loading && !state.data)
    return (
      <Screen bottomInset={TAB_BAR_CONTENT_HEIGHT}>
        <LoadingView />
      </Screen>
    );
  if (!state.data)
    return (
      <Screen
        bottomInset={TAB_BAR_CONTENT_HEIGHT}
        refreshing={state.refreshing}
        onRefresh={state.refresh}
      >
        <ErrorView onRetry={state.reload} />
      </Screen>
    );

  const messages = state.data.messages;

  return (
    <Screen
      bottomInset={TAB_BAR_CONTENT_HEIGHT}
      refreshing={state.refreshing}
      onRefresh={state.refresh}
    >
      <Title>{t.title}</Title>
      <Body muted size="small">
        {link?.practiceName ?? ""}
      </Body>

      {messages.length === 0 ? (
        <Body muted>{t.emptyState}</Body>
      ) : (
        <View style={{ gap: spacing.sm }}>
          {messages.map((message) => {
            const own = message.senderProfileId === userId;
            return (
              <View
                key={message.id}
                style={{
                  alignSelf: own ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                  backgroundColor: own ? theme.primary : theme.secondary,
                  borderRadius: radius.xl,
                  paddingHorizontal: spacing.md - 4,
                  paddingVertical: spacing.sm,
                }}
              >
                <Text style={{ fontSize: type.base, color: own ? theme.primaryForeground : theme.foreground }}>
                  {message.body}
                </Text>
                <Text
                  style={{
                    fontSize: type.small - 2,
                    marginTop: spacing.xs,
                    color: own ? theme.primaryForeground : theme.mutedForeground,
                    opacity: own ? 0.75 : 1,
                  }}
                >
                  {t.sentAt(formatTime(new Date(message.createdAt), branding.defaultTimeZone))}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      <Body muted size="small">
        {t.safetyNotice}
      </Body>

      <View style={{ gap: spacing.sm }}>
        {sendError ? <Banner kind="error">{sendError}</Banner> : null}
        <TextInput
          ref={inputRef}
          value={draft}
          onChangeText={setDraft}
          placeholder={t.placeholder}
          placeholderTextColor={theme.mutedForeground}
          accessibilityLabel={t.placeholder}
          multiline
          maxLength={2000}
          style={{
            minHeight: touch.minHeight,
            maxHeight: 120,
            borderWidth: 1,
            borderColor: theme.input,
            borderRadius: radius.lg,
            paddingHorizontal: spacing.md - 4,
            paddingVertical: spacing.sm,
            fontSize: type.base,
            color: theme.foreground,
            backgroundColor: theme.card,
            textAlignVertical: "top",
          }}
        />
        <AppButton
          label={sending ? t.sending : t.send}
          disabled={sending || draft.trim().length === 0}
          onPress={async () => {
            const body = draft.trim();
            if (!body) return;
            setSending(true);
            setSendError(null);
            try {
              await sendMessage(body);
              setDraft("");
              inputRef.current?.blur();
              state.refresh();
            } catch {
              setSendError(t.sendError);
            } finally {
              setSending(false);
            }
          }}
        />
      </View>
    </Screen>
  );
}
