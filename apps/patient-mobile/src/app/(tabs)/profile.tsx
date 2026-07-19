import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Image, Switch, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
  AppButton,
  Banner,
  Body,
  Card,
  ErrorView,
  Field,
  LoadingView,
  Screen,
  Subtitle,
  Title,
  useTheme,
} from "@/components/ui";
import { spacing, touch, type } from "@/config/branding";
import { de } from "@/messages/de";
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
import { useLoad } from "@/lib/use-load";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Profil (Teil I5): Daten, Bild, Praxis, Erinnerungen, Sicherheit. */
export default function Profile() {
  const router = useRouter();
  const theme = useTheme();
  const { session, link, signOut } = useSession();
  const userId = session?.user.id ?? "";

  const state = useLoad(async () => {
    const [profile, reminders] = await Promise.all([
      getProfile(userId),
      getReminderPreferences(userId),
    ]);
    const avatarUrl = profile.avatarPath
      ? await getAvatarUrl(profile.avatarPath)
      : null;
    return { profile, reminders, avatarUrl };
  }, [userId]);

  const [phone, setPhone] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [message, setMessage] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  if (state.loading && !state.data)
    return (
      <Screen>
        <LoadingView />
      </Screen>
    );
  const data = state.data;
  if (!data)
    return (
      <Screen refreshing={state.refreshing} onRefresh={state.refresh}>
        <ErrorView onRetry={state.reload} />
      </Screen>
    );

  const initials = data.profile.fullName
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

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
      setMessage({ kind: "error", text: de.profile.avatar.wrongType });
      return;
    }
    if ((asset.fileSize ?? 0) > MAX_AVATAR_BYTES) {
      setMessage({ kind: "error", text: de.profile.avatar.tooLarge });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      await uploadAvatar(asset.uri, mimeType, asset.fileSize ?? 0);
      setMessage({ kind: "success", text: de.profile.avatar.saved });
      state.refresh();
    } catch {
      setMessage({ kind: "error", text: de.common.error });
    } finally {
      setBusy(false);
    }
  };

  const confirmRemoveAvatar = () => {
    Alert.alert(de.profile.avatar.title, de.profile.avatar.removeConfirm, [
      { text: de.common.cancel, style: "cancel" },
      {
        text: de.profile.avatar.remove,
        style: "destructive",
        onPress: async () => {
          setBusy(true);
          try {
            await removeAvatar();
            setMessage({ kind: "success", text: de.profile.avatar.removed });
            state.refresh();
          } catch {
            setMessage({ kind: "error", text: de.common.error });
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  return (
    <Screen refreshing={state.refreshing} onRefresh={state.refresh}>
      <Title>{de.profile.title}</Title>
      {message ? <Banner kind={message.kind}>{message.text}</Banner> : null}

      <Card>
        <Subtitle>{de.profile.avatar.title}</Subtitle>
        <View style={{ alignItems: "center", gap: spacing.md }}>
          {data.avatarUrl ? (
            <Image
              source={{ uri: data.avatarUrl }}
              alt={de.profile.avatar.title}
              accessibilityLabel={de.profile.avatar.title}
              style={{ width: 112, height: 112, borderRadius: 56 }}
            />
          ) : (
            <View
              accessibilityLabel={de.profile.avatar.title}
              style={{
                width: 112,
                height: 112,
                borderRadius: 56,
                backgroundColor: theme.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontSize: type.title,
                  fontWeight: "700",
                  color: theme.primaryText,
                }}
              >
                {initials || "?"}
              </Text>
            </View>
          )}
        </View>
        <AppButton
          label={
            busy
              ? de.profile.avatar.uploading
              : data.avatarUrl
                ? de.profile.avatar.replace
                : de.profile.avatar.choose
          }
          onPress={pickAndUpload}
          disabled={busy}
        />
        {data.avatarUrl ? (
          <AppButton
            label={de.profile.avatar.remove}
            variant="danger"
            onPress={confirmRemoveAvatar}
            disabled={busy}
          />
        ) : null}
      </Card>

      <Card>
        <Subtitle>{de.profile.personal}</Subtitle>
        <Body muted>{de.profile.nameLabel}</Body>
        <Body>{data.profile.fullName}</Body>
        <Field
          label={de.profile.phoneLabel}
          value={phone ?? data.profile.phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        <AppButton
          label={de.common.save}
          variant="secondary"
          onPress={async () => {
            try {
              await savePhone(userId, phone ?? data.profile.phone);
              setMessage({ kind: "success", text: de.profile.phoneSaved });
            } catch {
              setMessage({ kind: "error", text: de.common.error });
            }
          }}
        />
      </Card>

      <Card>
        <Subtitle>{de.profile.practice}</Subtitle>
        <Body>{link ? link.practiceName : de.profile.noPractice}</Body>
        <AppButton
          label={de.profile.switchPractice}
          variant="secondary"
          onPress={() => router.push("/(auth)/invite-code")}
        />
      </Card>

      <Card>
        <Subtitle>{de.profile.reminders.title}</Subtitle>
        <ReminderRow
          label={de.profile.reminders.exercise}
          value={data.reminders.exerciseRemindersEnabled}
          onChange={async (value) => {
            await saveReminderPreferences(userId, {
              ...data.reminders,
              exerciseRemindersEnabled: value,
            });
            setMessage({ kind: "success", text: de.profile.reminders.saved });
            state.refresh();
          }}
        />
        <ReminderRow
          label={de.profile.reminders.plan}
          value={data.reminders.planUpdatesEnabled}
          onChange={async (value) => {
            await saveReminderPreferences(userId, {
              ...data.reminders,
              planUpdatesEnabled: value,
            });
            setMessage({ kind: "success", text: de.profile.reminders.saved });
            state.refresh();
          }}
        />
      </Card>

      <Card>
        <Subtitle>{de.profile.security}</Subtitle>
        <Field
          label={de.profile.newEmailLabel}
          value={newEmail}
          onChangeText={setNewEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <AppButton
          label={de.profile.changeEmail}
          variant="secondary"
          disabled={!newEmail.includes("@")}
          onPress={async () => {
            try {
              await requestEmailChange(newEmail);
              setNewEmail("");
              setMessage({ kind: "success", text: de.profile.emailChangeRequested });
            } catch {
              setMessage({ kind: "error", text: de.common.error });
            }
          }}
        />
        <Body muted>{de.profile.passwordResetInfo}</Body>
        <AppButton
          label={de.profile.changePassword}
          variant="secondary"
          onPress={async () => {
            const email = session?.user.email;
            if (!email) return;
            await supabase.auth.resetPasswordForEmail(email, {
              redirectTo: "physiocheck://reset-password",
            });
            setMessage({ kind: "success", text: de.auth.resetSent });
          }}
        />
      </Card>

      <AppButton
        label={de.auth.logout}
        variant="secondary"
        onPress={() =>
          Alert.alert(de.auth.logout, de.auth.logoutConfirm, [
            { text: de.common.cancel, style: "cancel" },
            {
              text: de.auth.logout,
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
        label={de.profile.deleteAccount.title}
        variant="danger"
        onPress={() => router.push("/delete-account")}
      />
    </Screen>
  );
}

function ReminderRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        minHeight: touch.minHeight,
        gap: spacing.md,
      }}
    >
      <Body>{label}</Body>
      <Switch
        value={value}
        onValueChange={onChange}
        accessibilityLabel={label}
        trackColor={{ true: theme.primary, false: theme.border }}
      />
    </View>
  );
}
