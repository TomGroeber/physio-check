import type { Session } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "./supabase";

export type PracticeLink = {
  practiceId: string;
  practiceName: string;
  practicePhone: string;
  timezone: string;
};

export type SessionState = {
  initializing: boolean;
  session: Session | null;
  /** true, wenn das Konto ein Praxis-Mitglied ist (App sperrt aus). */
  isPracticeMember: boolean;
  /** Aktive Praxisverbindung des Patienten, sonst null. */
  link: PracticeLink | null;
  fullName: string;
  /** Kurzlebige signierte URL des eigenen Profilbilds (oder null). */
  avatarUrl: string | null;
  /** Kontext (Rolle + Verbindung) neu laden, z. B. nach Code-Einlösung. */
  refreshContext: () => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionState | null>(null);

/**
 * Rollen-/Verbindungsprüfung: beides sind reine RLS-Abfragen mit den
 * Rechten des angemeldeten Kontos – ein Patient sieht 0 Mitglieds-
 * zeilen, ein unverbundenes Konto 0 aktive Links. Keine Prüfung ist
 * NUR im Client: Ohne RLS-Recht liefern die Tabellen schlicht nichts.
 */
async function loadContext(userId: string): Promise<{
  isPracticeMember: boolean;
  link: PracticeLink | null;
  fullName: string;
  avatarUrl: string | null;
}> {
  const [memberResult, linkResult, profileResult] = await Promise.all([
    supabase
      .from("practice_members")
      .select("id")
      .eq("profile_id", userId)
      .eq("is_active", true)
      .limit(1),
    supabase
      .from("patient_practice_links")
      .select("practice_id, practices ( name, phone, timezone )")
      .eq("patient_profile_id", userId)
      .eq("status", "active")
      .limit(1)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("full_name, avatar_path")
      .eq("id", userId)
      .maybeSingle(),
  ]);

  // Eigene Avatar-Anzeige: die Storage-Policy erlaubt dem Patienten das
  // eigene Objekt, die signierte URL entsteht direkt (D-059).
  const avatarPath = profileResult.data?.avatar_path as string | null | undefined;
  let avatarUrl: string | null = null;
  if (avatarPath) {
    const { data: signed } = await supabase.storage
      .from("patient-avatars")
      .createSignedUrl(avatarPath, 600);
    avatarUrl = signed?.signedUrl ?? null;
  }

  const practices = linkResult.data?.practices as
    | { name: string; phone: string; timezone: string }
    | null
    | undefined;

  return {
    isPracticeMember: (memberResult.data ?? []).length > 0,
    link: linkResult.data
      ? {
          practiceId: linkResult.data.practice_id,
          practiceName: practices?.name ?? "Ihre Praxis",
          practicePhone: practices?.phone ?? "",
          timezone: practices?.timezone ?? "Europe/Luxembourg",
        }
      : null,
    fullName: profileResult.data?.full_name ?? "",
    avatarUrl,
  };
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [initializing, setInitializing] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [isPracticeMember, setIsPracticeMember] = useState(false);
  const [link, setLink] = useState<PracticeLink | null>(null);
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const refreshContext = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const current = data.session;
    setSession(current);
    if (current) {
      const context = await loadContext(current.user.id);
      setIsPracticeMember(context.isPracticeMember);
      setLink(context.link);
      setFullName(context.fullName);
      setAvatarUrl(context.avatarUrl);
    } else {
      setIsPracticeMember(false);
      setLink(null);
      setFullName("");
      setAvatarUrl(null);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const apply = async (next: Session | null) => {
      if (!active) return;
      setSession(next);
      if (next) {
        const context = await loadContext(next.user.id);
        if (!active) return;
        setIsPracticeMember(context.isPracticeMember);
        setLink(context.link);
        setFullName(context.fullName);
        setAvatarUrl(context.avatarUrl);
      } else {
        setIsPracticeMember(false);
        setLink(null);
        setFullName("");
        setAvatarUrl(null);
      }
      setInitializing(false);
    };
    supabase.auth.getSession().then(({ data }) => apply(data.session));
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, next) => {
        void apply(next);
      }
    );
    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({
      initializing,
      session,
      isPracticeMember,
      link,
      fullName,
      avatarUrl,
      refreshContext,
      signOut,
    }),
    [initializing, session, isPracticeMember, link, fullName, avatarUrl, refreshContext, signOut]
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionState {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession außerhalb des SessionProviders");
  return context;
}
