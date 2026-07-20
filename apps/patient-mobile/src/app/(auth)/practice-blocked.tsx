import { useRouter } from "expo-router";
import { useEffect } from "react";
import { AppButton, Body, Screen, Title } from "@/components/ui";
import { app } from "@/messages/de";
import { useSession } from "@/lib/session";

/**
 * Praxisrollen-Aussperrung: Es gibt bewusst keinen mobilen
 * Praxisbereich. Das Konto wird abgemeldet, der Hinweis erklärt den Weg
 * zur Website.
 */
export default function PracticeBlocked() {
  const router = useRouter();
  const { signOut } = useSession();

  useEffect(() => {
    signOut();
  }, [signOut]);

  return (
    <Screen>
      <Title>{app.practiceBlocked.title}</Title>
      <Body>{app.practiceBlocked.body}</Body>
      <AppButton
        label={app.practiceBlocked.ok}
        onPress={() => router.replace("/(auth)/welcome")}
      />
    </Screen>
  );
}
