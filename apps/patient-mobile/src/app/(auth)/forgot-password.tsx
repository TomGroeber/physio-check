import { useState } from "react";
import { AppButton, Banner, Body, Field, Screen } from "@/components/ui";
import { de } from "@/messages/de";
import { supabase } from "@/lib/supabase";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  const submit = async () => {
    setPending(true);
    // Bewusst keine Unterscheidung, ob das Konto existiert (kein
    // Konto-Enumerationsleck) – dieselbe Regel wie im Web.
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: "physiocheck://reset-password",
    });
    setPending(false);
    setSent(true);
  };

  return (
    <Screen>
      <Body muted>{de.profile.passwordResetInfo}</Body>
      {sent ? <Banner kind="success">{de.auth.resetSent}</Banner> : null}
      <Field
        label={de.auth.emailLabel}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <AppButton
        label={pending ? de.common.loading : de.auth.resetSend}
        onPress={submit}
        disabled={pending || !email}
      />
    </Screen>
  );
}
