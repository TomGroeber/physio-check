import { useRouter } from "expo-router";
import { useState } from "react";
import { AppButton, Banner, Field, Screen } from "@/components/ui";
import { de } from "@/messages/de";
import { useSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const router = useRouter();
  const { refreshContext } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async () => {
    setPending(true);
    setError(null);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (authError) {
      setPending(false);
      setError(
        /confirm/i.test(authError.message)
          ? de.auth.emailNotConfirmed
          : de.auth.loginFailed
      );
      return;
    }
    await refreshContext();
    setPending(false);
    router.replace("/");
  };

  return (
    <Screen>
      {error ? <Banner kind="error">{error}</Banner> : null}
      <Field
        label={de.auth.emailLabel}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
      />
      <Field
        label={de.auth.passwordLabel}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        textContentType="password"
      />
      <AppButton
        label={pending ? de.common.loading : de.auth.login}
        onPress={submit}
        disabled={pending || !email || !password}
      />
      <AppButton
        label={de.auth.forgotPassword}
        variant="secondary"
        onPress={() => router.push("/(auth)/forgot-password")}
      />
    </Screen>
  );
}
