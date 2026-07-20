import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Switch, Text, View } from "react-native";
import { TAB_BAR_CONTENT_HEIGHT } from "@/components/tab-bar";
import {
  AppButton,
  Banner,
  Body,
  Card,
  ErrorView,
  Field,
  LoadingView,
  RadioRow,
  Screen,
  Section,
  Title,
  useTheme,
} from "@/components/ui";
import { spacing, touch, type } from "@/config/branding";
import { app, web } from "@/messages/de";
import {
  getAvatarUrl,
  getProfile,
  getReminderPreferences,
  removeAvatar,
  requestEmailChange,
  savePhone,
  saveReminderPreferences,
  uploadAvatar,
} from "@/data/profile";
import { useSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { useThemeSetting } from "@/lib/theme";
import { useLoad } from "@/lib/use-load";

const t = web.patient.profile;
const MAX_AVATAR_MB = 5;
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

function LabeledValue({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Body muted size="small">{label}</Body>
      <Body bold>{value}</Body>
    </View>
  );
}

/** Profil wie profile/page.tsx der Website (gleiche Sektionen und Abläufe). */
export default function Profile() {
  const router = useRouter();
  const theme = useTheme();
  const { session, link, fullName, signOut, refreshContext } = useSession();
  const { theme: themeSetting, setTheme } = useThemeSetting();
  const userId = session?.user.id ?? "";
  const currentEmail = session?.user.email ?? "–";
  const pendingEmail = (session?.user as { new_email?: string } | undefined)
    ?.new_email;

  const state = useLoad(async () => {
    const [profile, reminders] = await Promise.all([
      getProfile(userId),
      getReminderPreferences(userId),
    ]);
    const avatarUrl = profile.avatarPath ? await getAvatarUrl(profile.avatarPath) : null;
    return { profile, reminders, avatarUrl };
  }, [userId]);

  const [phone, setPhone] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [reminderDraft, setReminderDraft] = useState<{
    exerciseRemindersEnabled: boolean;
    planUpdatesEnabled: boolean;
    quietStart: string;
    quietEnd: string;
  } | null>(null);
  const [message, setMessage] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  if (state.loading && !state.data)
    return (
      <Screen bottomInset={TAB_BAR_CONTENT_HEIGHT}>
        <LoadingView />
      </Screen>
    );
  const data = state.data;
  if (!data)
    return (
      <Screen
        bottomInset={TAB_BAR_CONTENT_HEIGHT}
        refreshing={state.refreshing}
        onRefresh={state.refresh}
      >
        <ErrorView onRetry={state.reload} />
      </Screen>
    );

  const initials = fullName
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const reminders = reminderDraft ?? data.reminders;

  const pickAndUpload = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const mimeType = asset.mimeType ?? "image/jpeg";
    if (!ALLOWED_AVATAR_TYPES.includes(mimeType)) {
      setMessage({ kind: "error", text: t.avatar.unsupportedType });
      return;
    }
    if ((asset.fileSize ?? 0) > MAX_AVATAR_MB * 1024 * 1024) {
      setMessage({ kind: "error", text: t.avatar.tooLarge(MAX_AVATAR_MB) });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      await uploadAvatar(asset.uri, mimeType, asset.fileSize ?? 0);
      setMessage({ kind: "success", text: web.common.saved });
      await refreshContext();
      state.refresh();
    } catch {
      setMessage({ kind: "error", text: t.avatar.uploadFailed });
    } finally {
      setBusy(false);
    }
  };

  const confirmRemoveAvatar = () => {
    Alert.alert(t.avatar.heading, t.avatar.removeConfirm, [
      { text: web.common.cancel, style: "cancel" },
      {
        text: t.avatar.remove,
        style: "destructive",
        onPress: async () => {
          setBusy(true);
          try {
            await removeAvatar();
            setMessage({ kind: "success", text: web.common.saved });
            await refreshContext();
            state.refresh();
          } catch {
            setMessage({ kind: "error", text: web.common.error });
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  return (
    <Screen
      bottomInset={TAB_BAR_CONTENT_HEIGHT}
      refreshing={state.refreshing}
      onRefresh={state.refresh}
    >
      <Title>{t.title}</Title>
      {message ? <Banner kind={message.kind}>{message.text}</Banner> : null}

      <Section heading={t.personalHeading}>
        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
            {data.avatarUrl ? (
              <Image
                source={{ uri: data.avatarUrl }}
                alt={web.common.avatarAlt(fullName)}
                accessibilityLabel={web.common.avatarAlt(fullName)}
                style={{ width: 96, height: 96, borderRadius: 48 }}
              />
            ) : (
              <View
                accessible
                accessibilityLabel={web.common.avatarAlt(fullName)}
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 48,
                  backgroundColor: theme.accent,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{ fontSize: type.xl, fontWeight: "700", color: theme.accentForeground }}
                >
                  {initials || "?"}
                </Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Body muted size="small">{t.avatar.hint(MAX_AVATAR_MB)}</Body>
            </View>
          </View>
          <AppButton
            label={
              busy
                ? web.common.loading
                : data.avatarUrl
                  ? t.avatar.replace
                  : t.avatar.choose
            }
            variant="outline"
            onPress={pickAndUpload}
            disabled={busy}
          />
          {data.avatarUrl ? (
            <AppButton
              label={t.avatar.remove}
              variant="danger"
              onPress={confirmRemoveAvatar}
              disabled={busy}
            />
          ) : null}
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: theme.border,
              paddingTop: spacing.md,
              gap: spacing.md,
            }}
          >
            <LabeledValue label={t.name} value={fullName || "–"} />
            <LabeledValue label={t.email} value={currentEmail} />
            <Field
              label={t.phone}
              hint={t.phoneHint}
              value={phone ?? data.profile.phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder={t.phonePlaceholder}
            />
            <AppButton
              label={t.phoneSave}
              variant="outline"
              onPress={async () => {
                try {
                  await savePhone(userId, phone ?? data.profile.phone);
                  setMessage({ kind: "success", text: web.common.saved });
                } catch {
                  setMessage({ kind: "error", text: web.common.error });
                }
              }}
            />
          </View>
        </Card>
      </Section>

      <Section heading={t.securityHeading}>
        <Card>
          <Body bold size="lg">{t.security.changeEmailTitle}</Body>
          {pendingEmail ? (
            <Banner kind="warning">{t.security.pendingChange(pendingEmail)}</Banner>
          ) : null}
          <Body muted size="small">{t.security.changeEmailHint}</Body>
          <Field
            label={t.security.newEmailLabel}
            value={newEmail}
            onChangeText={setNewEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <AppButton
            label={t.security.changeEmailSubmit}
            variant="outline"
            disabled={!newEmail.includes("@")}
            onPress={async () => {
              try {
                await requestEmailChange(newEmail);
                setNewEmail("");
                setMessage({ kind: "success", text: t.security.changeEmailRequested });
              } catch {
                setMessage({ kind: "error", text: t.security.requestError });
              }
            }}
          />
        </Card>
        <Card>
          <Body bold size="lg">{t.security.changePasswordTitle}</Body>
          <Body muted size="small">{t.security.changePasswordHint}</Body>
          <AppButton
            label={t.security.changePasswordSubmit}
            variant="outline"
            onPress={async () => {
              const email = session?.user.email;
              if (!email) return;
              await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: "physiocheck://reset-password",
              });
              setMessage({ kind: "success", text: t.security.passwordMailSent });
            }}
          />
        </Card>
      </Section>

      <Section heading={t.appearance.heading}>
        <Card>
          <Body bold size="small">{t.appearance.label}</Body>
          <RadioRow
            label={t.appearance.light}
            selected={themeSetting === "light"}
            onPress={() => setTheme("light")}
          />
          <RadioRow
            label={t.appearance.dark}
            selected={themeSetting === "dark"}
            onPress={() => setTheme("dark")}
          />
          <Body muted size="small">{t.appearance.hint}</Body>
        </Card>
      </Section>

      <Section heading={t.remindersHeading}>
        <Card>
          <Body muted size="small">{web.patient.reminders.intro}</Body>
          <ReminderSwitch
            title={web.patient.reminders.exerciseTitle}
            hint={web.patient.reminders.exerciseHint}
            value={reminders.exerciseRemindersEnabled}
            onChange={(value) =>
              setReminderDraft({ ...reminders, exerciseRemindersEnabled: value })
            }
          />
          <ReminderSwitch
            title={web.patient.reminders.planUpdatesTitle}
            hint={web.patient.reminders.planUpdatesHint}
            value={reminders.planUpdatesEnabled}
            onChange={(value) =>
              setReminderDraft({ ...reminders, planUpdatesEnabled: value })
            }
          />
          <Body bold size="small">{web.patient.reminders.quietHours}</Body>
          <Body muted size="small">{web.patient.reminders.quietHoursHint}</Body>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Field
                label={web.patient.reminders.quietStart}
                value={reminders.quietStart}
                onChangeText={(value) =>
                  setReminderDraft({ ...reminders, quietStart: value })
                }
                placeholder="20:00"
                autoCapitalize="none"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label={web.patient.reminders.quietEnd}
                value={reminders.quietEnd}
                onChangeText={(value) =>
                  setReminderDraft({ ...reminders, quietEnd: value })
                }
                placeholder="08:00"
                autoCapitalize="none"
              />
            </View>
          </View>
          <AppButton
            label={web.patient.reminders.save}
            variant="outline"
            onPress={async () => {
              const pattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
              if (!pattern.test(reminders.quietStart) || !pattern.test(reminders.quietEnd)) {
                setMessage({ kind: "error", text: web.patient.reminders.saveError });
                return;
              }
              try {
                await saveReminderPreferences(userId, reminders);
                setReminderDraft(null);
                setMessage({ kind: "success", text: web.patient.reminders.saved });
                state.refresh();
              } catch {
                setMessage({ kind: "error", text: web.patient.reminders.saveError });
              }
            }}
          />
        </Card>
      </Section>

      <Section heading={t.practiceHeading}>
        <Card>
          <Body bold>{link?.practiceName ?? t.noPractice}</Body>
          <AppButton
            label={t.changePractice}
            variant="outline"
            onPress={() => router.push("/(auth)/invite-code")}
          />
        </Card>
      </Section>

      <AppButton
        label={web.common.signOut}
        variant="outline"
        onPress={() =>
          Alert.alert(web.common.signOut, app.auth.logoutConfirm, [
            { text: web.common.cancel, style: "cancel" },
            {
              text: web.common.signOut,
              style: "destructive",
              onPress: async () => {
                await signOut();
                router.replace("/(auth)/welcome");
              },
            },
          ])
        }
      />

      <AppButton
        label={app.deleteAccount.title}
        variant="danger"
        onPress={() => router.push("/delete-account")}
      />
    </Screen>
  );
}

function ReminderSwitch({
  title,
  hint,
  value,
  onChange,
}: {
  title: string;
  hint: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        minHeight: touch.minHeight,
      }}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Body bold size="small">{title}</Body>
        <Body muted size="small">{hint}</Body>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        accessibilityLabel={title}
        trackColor={{ true: theme.primary, false: theme.border }}
      />
    </View>
  );
}
