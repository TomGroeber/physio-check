import { createClient } from "@supabase/supabase-js";
import { AppState } from "react-native";
import { SecureSessionStorage } from "./secure-session-storage";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!url || !key) {
  throw new Error(
    "EXPO_PUBLIC_SUPABASE_URL und EXPO_PUBLIC_SUPABASE_KEY fehlen – siehe apps/patient-mobile/.env.example"
  );
}

/**
 * Einziger Supabase-Zugang der App: Publishable Key + RLS (D-059).
 * Es gibt bewusst keinen weiteren Schlüssel im Client.
 */
export const supabase = createClient(url, key, {
  auth: {
    storage: new SecureSessionStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Token-Refresh nur, solange die App im Vordergrund ist (Supabase-Muster).
AppState.addEventListener("change", (state) => {
  if (state === "active") supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});

/** Basis-URL des Website-Servers für die wenigen /api/mobile-Endpunkte. */
export const apiBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
