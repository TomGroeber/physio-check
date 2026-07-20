import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { formatDateLong, formatInviteCode } from "@physio-check/shared";
import {
  AppButton,
  Banner,
  Body,
  Card,
  Field,
  Screen,
  SectionHeading,
} from "@/components/ui";
import { app, web } from "@/messages/de";
import { checkInviteCode, redeemInvite, type InviteCheckResult } from "@/data/invite";
import { useSession } from "@/lib/session";

const t = web.connect;

/**
 * Code-Einstieg wie der Web-Verbindungsbereich (/connect): Code prüfen
 * → Praxis bestätigen → Konto erstellen/anmelden bzw. direkt verbinden;
 * Praxiswechsel mit Warnhinweis.
 */
export default function InviteCode() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string }>();
  const { session, link, refreshContext } = useSession();
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
      <SectionHeading>{t.title}</SectionHeading>
      <Body muted>{t.intro}</Body>
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
              {link ? <Banner kind="warning">{app.invite.switchWarning}</Banner> : null}
              <AppButton
                label={pending ? app.common.loading : t.submit}
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
    </Screen>
  );
}
