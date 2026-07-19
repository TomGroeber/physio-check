import { Redirect, useLocalSearchParams } from "expo-router";

/** Deep-Link physiocheck://invite/<code> → Code-Screen mit Vorbefüllung. */
export default function InviteDeepLink() {
  const { code } = useLocalSearchParams<{ code: string }>();
  return (
    <Redirect
      href={{ pathname: "/(auth)/invite-code", params: { code: code ?? "" } }}
    />
  );
}
