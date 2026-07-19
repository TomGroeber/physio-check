import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { AppButton, Banner, Body, Field, Screen } from "@/components/ui";
import { de } from "@/messages/de";
import { supabase } from "@/lib/supabase";

/**
 * Kontoerstellung nach geprüftem Code (Teil H): Das Konto gehört dem
 * Patienten (eigene E-Mail + Passwort); der vorbereitete Datensatz der
 * Praxis ist KEIN Konto. Nach der E-Mail-Bestätigung meldet sich die
 * Person an und löst den Code ein (der Code bleibt bis zur endgültigen
 * Verbindung gültig – identisch zum Web-Fluss).
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
          ? de.auth.passwordHint
          : de.common.error
      );
      return;
    }
    setDone(true);
  };

  return (
    <Screen>
      {params.practiceName ? (
        <Body muted>{de.invite.confirmBody(params.practiceName)}</Body>
      ) : null}
      <Body muted>{de.invite.registerHint}</Body>
      {error ? <Banner kind="error">{error}</Banner> : null}
      {done ? (
        <Banner kind="success">{de.invite.registerDone}</Banner>
      ) : (
        <>
          <Field
            label={de.auth.nameLabel}
            value={fullName}
            onChangeText={setFullName}
            autoComplete="name"
          />
          <Field
            label={de.auth.emailLabel}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <Field
            label={de.auth.passwordLabel}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="newPassword"
          />
          <Body muted>{de.auth.passwordHint}</Body>
          <AppButton
            label={pending ? de.common.loading : de.invite.createAccount}
            onPress={submit}
            disabled={pending || !fullName || !email || password.length < 10}
          />
        </>
      )}
    </Screen>
  );
}
