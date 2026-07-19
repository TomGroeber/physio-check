import { Redirect } from "expo-router";
import { View } from "react-native";
import { LoadingView, useTheme } from "@/components/ui";
import { useSession } from "@/lib/session";

/**
 * Einstieg: leitet je nach Kontozustand weiter. Die eigentliche
 * Zugriffskontrolle liegt in RLS – hier geht es nur um die passende
 * Oberfläche (Teil H: Praxisrollen erhalten keinen mobilen Bereich).
 */
export default function Index() {
  const { initializing, session, isPracticeMember, link } = useSession();
  const theme = useTheme();

  if (initializing)
    return (
      <View
        style={{ flex: 1, justifyContent: "center", backgroundColor: theme.background }}
      >
        <LoadingView />
      </View>
    );

  if (!session) return <Redirect href="/(auth)/welcome" />;
  if (isPracticeMember) return <Redirect href="/(auth)/practice-blocked" />;
  if (!link) return <Redirect href="/(auth)/invite-code" />;
  return <Redirect href="/(tabs)/today" />;
}
