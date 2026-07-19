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
  Subtitle,
} from "@/components/ui";
import { de } from "@/messages/de";
import { checkInviteCode, redeemInvite, type InviteCheckResult } from "@/data/invite";
import { useSession } from "@/lib/session";

/**
 * Code-Einstieg (Teil H). Drei Situationen auf einem Screen:
 * 1. Besucher ohne Konto: Code prüfen → Konto erstellen oder anmelden.
 * 2. Angemeldet ohne Praxis: Code prüfen → direkt verbinden.
 * 3. Angemeldet mit Praxis: Code prüfen → Praxiswechsel mit Warnung.
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
      setError(result.reason === "expired" ? de.invite.expired : de.invite.invalid);
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
      setError(de.invite.invalid);
      setChecked(null);
    } finally {
      setPending(false);
    }
  };

  return (
    <Screen>
      <Body muted>{session ? de.connect.body : de.invite.hint}</Body>
      {error ? <Banner kind="error">{error}</Banner> : null}
      <Field
        label={de.invite.codeLabel}
        value={code}
        onChangeText={(value) => {
          setCode(value);
          setChecked(null);
        }}
        autoCapitalize="characters"
        autoCorrect={false}
        placeholder="ABCD-EFGH-JK23"
      />
      {!checked ? (
        <AppButton
          label={pending ? de.common.loading : de.invite.check}
          onPress={check}
          disabled={pending || code.trim().length === 0}
        />
      ) : (
        <Card>
          <Subtitle>{de.invite.confirmTitle}</Subtitle>
          <Body>{de.invite.confirmBody(checked.practiceName)}</Body>
          <Body muted>
            {de.invite.validUntil(
              formatDateLong(new Date(checked.expiresAt), "Europe/Luxembourg")
            )}
          </Body>
          {session ? (
            <>
              {link ? <Banner kind="warning">{de.invite.switchWarning}</Banner> : null}
              <AppButton
                label={pending ? de.common.loading : de.invite.connect}
                onPress={connect}
                disabled={pending}
              />
            </>
          ) : (
            <>
              <AppButton
                label={de.invite.createAccount}
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
                label={de.invite.useExisting}
                variant="secondary"
                onPress={() => router.push("/(auth)/login")}
              />
            </>
          )}
        </Card>
      )}
    </Screen>
  );
}
