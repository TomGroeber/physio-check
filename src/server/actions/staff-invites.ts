"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionContext } from "@/server/services/session";
import {
  acceptPendingStaffInvite,
  clearStaffInviteSession,
  createStaffInviteAsPracticeAdmin,
  inspectStaffInviteToken,
  isInviteCreationRateLimited,
  renewStaffInvite,
  revokeStaffInvite,
  storeStaffInviteSession,
} from "@/server/services/staff-invites";
import { setPracticeMemberStatus } from "@/server/services/platform-admin";
import { staffInviteSchema } from "@/lib/validation/platform-admin";
import { de } from "@/messages/de";

export type StaffInviteFormState = {
  error?: string;
  inviteLink?: string;
  email?: string;
};

/** Praxisadmin lädt eine:n Mitarbeiter:in der eigenen Praxis ein. */
export async function createStaffInviteAction(
  _previousState: StaffInviteFormState,
  formData: FormData
): Promise<StaffInviteFormState> {
  const session = await getSessionContext();
  const membership = session?.memberships.find((m) => m.role === "admin");
  if (!session || !membership) return { error: de.errors.forbiddenBody };

  const parsed = staffInviteSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };

  const rateLimited = await isInviteCreationRateLimited(membership.practiceId, 60, 20);
  if (rateLimited) {
    return { error: "Zu viele Einladungen in kurzer Zeit. Bitte versuchen Sie es später erneut." };
  }

  const result = await createStaffInviteAsPracticeAdmin(membership.practiceId, membership.memberId, parsed.data);
  if ("error" in result) {
    return {
      error:
        result.error === "duplicate_pending"
          ? "Für diese E-Mail-Adresse gibt es bereits eine offene Einladung."
          : "Die Einladung konnte nicht erstellt werden.",
    };
  }

  revalidatePath("/practice/settings");
  return { inviteLink: result.link, email: result.email };
}

export async function revokeStaffInviteAction(formData: FormData): Promise<void> {
  const inviteId = formData.get("inviteId");
  const session = await getSessionContext();
  const membership = session?.memberships.find((m) => m.role === "admin");
  if (!membership || typeof inviteId !== "string") return;

  await revokeStaffInvite(membership.practiceId, inviteId);
  revalidatePath("/practice/settings");
}

export async function renewStaffInviteAction(
  _previousState: StaffInviteFormState,
  formData: FormData
): Promise<StaffInviteFormState> {
  const inviteId = formData.get("inviteId");
  const session = await getSessionContext();
  const membership = session?.memberships.find((m) => m.role === "admin");
  if (!membership || typeof inviteId !== "string") return { error: de.errors.forbiddenBody };

  const result = await renewStaffInvite(membership.practiceId, inviteId);
  if ("error" in result) return { error: "Die Einladung konnte nicht erneuert werden." };
  revalidatePath("/practice/settings");
  return { inviteLink: result.link, email: result.email };
}

export async function setPracticeMemberStatusAction(formData: FormData): Promise<void> {
  const memberId = formData.get("memberId");
  const role = formData.get("role");
  const isActive = formData.get("isActive") === "true";
  const session = await getSessionContext();
  const membership = session?.memberships.find((m) => m.role === "admin");
  if (!membership || typeof memberId !== "string" || (role !== "admin" && role !== "therapist")) return;

  await setPracticeMemberStatus(memberId, role, isActive);
  revalidatePath("/practice/settings");
}

/**
 * Öffentlicher Einstiegspunkt eines Einladungslinks. Speichert nur die
 * Sitzung; die eigentliche Annahme prüft `accept_staff_invite`
 * atomar gegen den angemeldeten Nutzer (E-Mail-Abgleich).
 */
export async function openStaffInviteAction(token: string): Promise<void> {
  const invite = await inspectStaffInviteToken(token);
  if (!invite) redirect("/staff-invite/invalid");
  await storeStaffInviteSession(token);

  const session = await getSessionContext();
  if (session) {
    redirect("/staff-invite/confirm");
  }
  redirect(`/staff-invite/confirm?email=${encodeURIComponent(invite.email)}`);
}

export async function acceptStaffInviteAction(): Promise<void> {
  const session = await getSessionContext();
  if (!session) redirect("/login?staffInvite=1");

  const result = await acceptPendingStaffInvite();
  await clearStaffInviteSession();
  if (!result.ok) {
    redirect(`/staff-invite/invalid?reason=${result.reason}`);
  }

  revalidatePath("/", "layout");
  redirect("/practice?joined=1");
}

export async function discardStaffInviteAction(): Promise<void> {
  await clearStaffInviteSession();
  redirect("/login");
}
