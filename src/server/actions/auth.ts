"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/server/db/server-client";
import { getSessionContext, homeRouteFor } from "@/server/services/session";
import {
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
    redirect("/invite/continue");
  }
  const session = await getSessionContext();
  redirect(session ? homeRouteFor(session) : "/login");
}

export async function registerAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const invite = await getPendingInvite();
  if (!invite) return { error: de.connect.sessionExpired };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: invite.patientDisplayName, locale: "de" },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/auth/confirm?next=/invite/continue`,
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
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/reset-password`,
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

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
