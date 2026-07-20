import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { AppButton, Banner, Body, Field, Screen, SectionHeading } from "@/components/ui";
import { app, web } from "@/messages/de";
import { supabase } from "@/lib/supabase";

/**
 * Kontoerstellung nach geprüftem Code: Das Konto gehört dem Patienten
 * (eigene E-Mail + Passwort); der Code bleibt bis zur endgültigen
 * Verbindung gültig – identisch zum Web-Fluss.
 */
export default function Register() {
  const params = useLocalSearchParams<{
    inviteId?: string;
    code?: string;
    practiceName?: string;
  }>();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  const submit = async () => {
    setPending(true);
    setError(null);
    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: "physiocheck://auth/confirm",
        data: { full_name: fullName.trim(), locale: "de" },
      },
    });
    setPending(false);
    if (signUpError) {
      setError(
        /password/i.test(signUpError.message)
          ? app.auth.passwordHint
          : web.common.error
      );
      return;
    }
    setDone(true);
  };

  return (
    <Screen>
      <SectionHeading>{web.connect.createAccount}</SectionHeading>
      {params.practiceName ? (
        <Body muted>{web.connect.fromPractice(params.practiceName)}</Body>
      ) : null}
      {error ? <Banner kind="error">{error}</Banner> : null}
      {done ? (
        <Banner kind="success">{app.invite.registerDone}</Banner>
      ) : (
        <>
          <Field
            label={app.auth.nameLabel}
            value={fullName}
            onChangeText={setFullName}
            autoComplete="name"
          />
          <Field
            label={app.auth.emailLabel}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <Field
            label={app.auth.passwordLabel}
            hint={app.auth.passwordHint}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="newPassword"
          />
          <AppButton
            label={pending ? app.common.loading : web.connect.createAccount}
            onPress={submit}
            disabled={pending || !fullName || !email || password.length < 10}
          />
        </>
      )}
    </Screen>
  );
}
