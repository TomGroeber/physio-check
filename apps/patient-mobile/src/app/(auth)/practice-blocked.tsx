import { useRouter } from "expo-router";
import { useEffect } from "react";
import { AppButton, Body, Screen, Title } from "@/components/ui";
import { de } from "@/messages/de";
import { useSession } from "@/lib/session";

/**
 * Praxisrollen-Aussperrung (Teil H/F): Es gibt bewusst keinen mobilen
 * Praxisbereich. Das Konto wird abgemeldet, der Hinweis erklärt den Weg
 * zur Website.
 */
export default function PracticeBlocked() {
  const router = useRouter();
  const { signOut } = useSession();

  useEffect(() => {
    // Abmelden passiert sofort – der Hinweis bleibt lesbar stehen.
    signOut();
  }, [signOut]);

  return (
    <Screen>
      <Title>{de.practiceBlocked.title}</Title>
      <Body>{de.practiceBlocked.body}</Body>
      <AppButton
        label={de.practiceBlocked.ok}
        onPress={() => router.replace("/(auth)/welcome")}
      />
    </Screen>
  );
}
