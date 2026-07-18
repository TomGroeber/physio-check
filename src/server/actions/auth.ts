"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/server/db/server-client";
import { getSessionContext, homeRouteFor } from "@/server/services/session";
import {
  changeEmailSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validation/auth";
import { de } from "@/messages/de";
import { getPendingInvite } from "@/server/services/invites";

export type AuthFormState = {
  error?: string;
  success?: string;
};

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function confirmationRedirect(next: string): string {
  return `${appUrl()}/auth/confirm?next=${encodeURIComponent(next)}`;
}

/** Supabase-Fehlercodes in verständliche deutsche Texte übersetzen. */
function loginErrorMessage(code: string | undefined): string {
  switch (code) {
    case "invalid_credentials":
      return de.auth.login.errorInvalidCredentials;
    case "email_not_confirmed":
      return de.auth.login.errorEmailNotConfirmed;
    default:
      return de.common.error;
  }
}

export async function loginAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { error: loginErrorMessage(error.code) };
  }

  revalidatePath("/", "layout");
  if (await getPendingInvite()) {
    // Angemeldete Benutzer bestätigen eine geprüfte Einladung im
    // geschützten Verbindungsbereich.
    redirect("/connect");
  }
  const session = await getSessionContext();
  redirect(session ? homeRouteFor(session) : "/login");
}

export async function registerAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // Registrierung ist ohne Einladung möglich. Sie erzeugt ausschließlich
  // ein unverbundenes Patientenkonto ohne jede Praxis- oder Mitarbeiterrolle;
  // die Praxisverbindung entsteht erst später über einen geprüften Code.
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName, locale: "de" },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/auth/confirm?next=/connect`,
    },
  });

  if (error) {
    if (error.code === "user_already_exists") {
      return { error: de.auth.register.errorEmailTaken };
    }
    if (error.code === "weak_password") {
      return { error: de.auth.register.errorWeakPassword };
    }
    return { error: de.common.error };
  }

  return { success: de.auth.register.success };
}

export async function forgotPasswordAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createSupabaseServerClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: confirmationRedirect("/reset-password"),
  });

  // Bewusst immer dieselbe Antwort – verrät nicht, ob ein Konto existiert.
  return { success: de.auth.forgotPassword.success };
}

export async function resetPasswordAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    return { error: de.auth.resetPassword.errorExpired };
  }

  return { success: de.auth.resetPassword.success };
}

/**
 * E-Mail-Adresse des AKTUELL angemeldeten Kontos ändern.
 * Identität kommt ausschließlich aus der Server-Session – keine Benutzer-ID
 * oder alte Adresse aus dem Client. Supabase verschickt wegen
 * `double_confirm_changes = true` Bestätigungslinks an die bisherige UND die
 * neue Adresse; erst nach beiden Bestätigungen gilt die neue Adresse.
 * Kein Service-Role-Key, keine eigene Token-Logik.
 */
export async function changeEmailAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const session = await getSessionContext();
  if (!session) redirect("/login");
  if (!session.patientLink || session.memberships.length > 0) {
    return { error: de.common.error };
  }
  const parsed = changeEmailSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (parsed.data.email === session.email?.toLowerCase()) {
    return { error: de.patient.profile.security.emailSame };
  }

  const { error } = await supabase.auth.updateUser(
    { email: parsed.data.email },
    {
      emailRedirectTo: confirmationRedirect("/profile?email_confirmed=1"),
    }
  );
  if (error) {
    if (error.code === "over_email_send_rate_limit") {
      return { error: de.patient.profile.security.rateLimited };
    }
    if (error.code === "email_exists") {
      // Neutrale Meldung – verrät nicht, ob ein fremdes Konto existiert.
      return { error: de.patient.profile.security.emailUnavailable };
    }
    return { error: de.common.error };
  }

  revalidatePath("/profile");
  return { success: de.patient.profile.security.changeEmailRequested };
}

/**
 * Passwortänderung für das angemeldete Konto anstoßen: Die E-Mail-Adresse
 * wird IMMER serverseitig aus der Session gelesen (kein editierbares Feld).
 * Wiederverwendet den bestehenden sicheren Reset-Ablauf
 * (resetPasswordForEmail → /reset-password); Supabase begrenzt die Frequenz.
 */
// Bewusst ohne Parameter: useActionState übergibt (state, formData),
// aber diese Aktion braucht keinerlei Client-Eingaben.
export async function requestPasswordChangeAction(
  _prevState: AuthFormState,
  _formData: FormData
): Promise<AuthFormState> {
  void _prevState;
  void _formData;
  const session = await getSessionContext();
  if (!session) redirect("/login");
  if (!session.patientLink || session.memberships.length > 0 || !session.email) {
    return { error: de.common.error };
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(session.email, {
    redirectTo: confirmationRedirect("/reset-password"),
  });
  if (error?.code === "over_email_send_rate_limit") {
    return { error: de.patient.profile.security.rateLimited };
  }
  if (error) return { error: de.patient.profile.security.requestError };
  return { success: de.patient.profile.security.passwordMailSent };
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
