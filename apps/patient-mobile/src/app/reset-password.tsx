import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { AppButton, Banner, Body, Field, Screen } from "@/components/ui";
import { app, web } from "@/messages/de";
import { supabase } from "@/lib/supabase";

/**
 * Deep-Link-Ziel physiocheck://reset-password (Recovery-E-Mail):
 * Tokens aus dem Link übernehmen, dann neues Passwort setzen.
 */
export default function ResetPassword() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    access_token?: string;
    refresh_token?: string;
    token_hash?: string;
  }>();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        if (params.access_token && params.refresh_token) {
          await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });
        } else if (params.token_hash) {
          await supabase.auth.verifyOtp({
            token_hash: params.token_hash,
            type: "recovery",
          });
        }
      } finally {
        setReady(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async () => {
    setPending(true);
    setError(null);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setPending(false);
    if (updateError) {
      setError(web.common.error);
      return;
    }
    await supabase.auth.signOut();
    router.replace({ pathname: "/(auth)/login" });
  };

  return (
    <Screen>
      <Body muted>{app.auth.newPasswordTitle}</Body>
      {error ? <Banner kind="error">{error}</Banner> : null}
      <Field
        label={app.auth.newPasswordLabel}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        textContentType="newPassword"
        editable={ready}
      />
      <Body muted>{app.auth.passwordHint}</Body>
      <AppButton
        label={pending ? app.common.loading : web.common.save}
        onPress={submit}
        disabled={pending || !ready || password.length < 10}
      />
    </Screen>
  );
}
