import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { AppButton, Banner, LoadingView, Screen } from "@/components/ui";
import { de } from "@/messages/de";
import { useSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";

/**
 * Deep-Link-Ziel physiocheck://auth/confirm (E-Mail-Bestätigung).
 * Supabase hängt die Tokens als Query- oder Fragment-Parameter an;
 * expo-router liefert beide über die Suchparameter.
 */
export default function AuthConfirm() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    access_token?: string;
    refresh_token?: string;
    token_hash?: string;
    type?: string;
  }>();
  const { refreshContext } = useSession();
  const [state, setState] = useState<"working" | "done" | "failed">("working");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (params.access_token && params.refresh_token) {
          const { error } = await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });
          if (error) throw error;
        } else if (params.token_hash) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: params.token_hash,
            type: (params.type as "email") ?? "email",
          });
          if (error) throw error;
        }
        await refreshContext();
        if (active) setState("done");
        router.replace("/");
      } catch {
        if (active) setState("failed");
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Screen>
      {state === "working" ? <LoadingView /> : null}
      {state === "failed" ? (
        <>
          <Banner kind="error">{de.common.error}</Banner>
          <AppButton label={de.common.back} onPress={() => router.replace("/")} />
        </>
      ) : null}
    </Screen>
  );
}
