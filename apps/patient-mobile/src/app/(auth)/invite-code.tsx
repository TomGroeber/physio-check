import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";
import { formatDateLong, formatInviteCode } from "@physio-check/shared";
import {
  AppButton,
  Banner,
  Body,
  Card,
  Field,
  Screen,
  Section,
  SectionHeading,
  TextLink,
} from "@/components/ui";
import { app, web } from "@/messages/de";
import { checkInviteCode, redeemInvite, type InviteCheckResult } from "@/data/invite";
import { useSession } from "@/lib/session";

const t = web.connect;

/**
 * Code-Einstieg. Deckt beide Web-Seiten desselben Ablaufs ab:
 * - ohne Session: öffentliche Code-Eingabe (/invite)
 * - mit Session, noch unverbunden oder Praxiswechsel: geschützter
 *   Verbindungsbereich (/connect) inkl. Kontoabschnitt mit Abmeldung
 *   und rechtlichem Hinweis – genau diese Sektion fehlte zuvor nativ.
 */
export default function InviteCode() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string }>();
  const { session, link, fullName, refreshContext, signOut } = useSession();
  const [code, setCode] = useState(params.code ?? "");
  const [checked, setChecked] = useState<Extract<InviteCheckResult, { ok: true }> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const check = async () => {
    setPending(true);
    setError(null);
    setChecked(null);
    const result = await checkInviteCode(code);
    setPending(false);
    if (!result.ok) {
      setError(result.reason === "expired" ? app.invite.expired : t.errorInvalid);
      return;
    }
    setChecked(result);
  };

  const connect = async () => {
    if (!checked) return;
    setPending(true);
    setError(null);
    try {
      await redeemInvite(checked.inviteId, code);
      await refreshContext();
      router.replace("/(tabs)/today");
    } catch {
      setError(t.errorInvalid);
      setChecked(null);
    } finally {
      setPending(false);
    }
  };

  return (
    <Screen>
      <SectionHeading>{session ? t.hubTitle : t.title}</SectionHeading>
      <Body muted>
        {session
          ? link
            ? t.hubIntroConnected(link.practiceName)
            : t.hubIntro
          : t.intro}
      </Body>
      {error ? <Banner kind="error">{error}</Banner> : null}
      <Field
        label={t.codeLabel}
        value={code}
        onChangeText={(value) => {
          setCode(value);
          setChecked(null);
        }}
        autoCapitalize="characters"
        autoCorrect={false}
        placeholder={t.codePlaceholder}
      />
      {!checked ? (
        <AppButton
          label={pending ? app.common.loading : app.invite.checkCode}
          onPress={check}
          disabled={pending || code.trim().length === 0}
        />
      ) : (
        <Card>
          <SectionHeading>{t.continueTitle}</SectionHeading>
          <Body>{t.fromPractice(checked.practiceName)}</Body>
          <Body muted size="small">
            {t.invitationValidUntil(
              formatDateLong(new Date(checked.expiresAt), "Europe/Luxembourg")
            )}
          </Body>
          {session ? (
            <>
              {link ? (
                <Banner kind="warning">{t.changeWarning(link.practiceName)}</Banner>
              ) : null}
              <AppButton
                label={pending ? app.common.loading : t.accept}
                onPress={connect}
                disabled={pending}
              />
            </>
          ) : (
            <>
              <Body muted size="small">{t.continueHint}</Body>
              <AppButton
                label={t.createAccount}
                onPress={() =>
                  router.push({
                    pathname: "/(auth)/register",
                    params: {
                      inviteId: checked.inviteId,
                      code: formatInviteCode(code),
                      practiceName: checked.practiceName,
                    },
                  })
                }
              />
              <AppButton
                label={t.useExistingAccount}
                variant="outline"
                onPress={() => router.push("/(auth)/login")}
              />
            </>
          )}
        </Card>
      )}

      {!session ? (
        <TextLink label={web.landing.signIn} onPress={() => router.push("/(auth)/login")} />
      ) : (
        <Section heading={t.accountHeading}>
          <Card>
            <Body bold>{fullName || "–"}</Body>
            <Body muted size="small">{session.user.email ?? "–"}</Body>
            <AppButton
              label={web.common.signOut}
              variant="outline"
              onPress={() =>
                Alert.alert(t.signOutHint, undefined, [
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
          </Card>
          <Body muted size="small">{t.legalHint}</Body>
        </Section>
      )}
    </Screen>
  );
}
