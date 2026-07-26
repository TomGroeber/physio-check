import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionContext } from "@/server/services/session";
import { getPendingStaffInviteFromSession } from "@/server/services/staff-invites";
import { acceptStaffInviteAction, discardStaffInviteAction } from "@/server/actions/staff-invites";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { de } from "@/messages/de";

export const metadata: Metadata = { title: de.admin.staffInvite.title };

const t = de.admin.staffInvite;

export default async function StaffInviteConfirmPage() {
  const invite = await getPendingStaffInviteFromSession();
  if (!invite) redirect("/staff-invite/invalid");

  const session = await getSessionContext();
  const roleLabel = invite.role === "admin" ? de.admin.detail.roleAdmin : de.admin.detail.roleTherapist;

  return (
    <div className="mx-auto flex max-w-md flex-col gap-5 py-10">
      <GlassPanel strong className="flex flex-col gap-4">
        <h1 className="text-xl font-bold">{t.title}</h1>
        <p className="text-sm text-muted-foreground">
          {t.practiceLabel}: <span className="font-semibold text-foreground">{invite.practiceName}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          {t.roleLabel}: <span className="font-semibold text-foreground">{roleLabel}</span>
        </p>

        {session ? (
          <>
            <p>{t.confirmBody.replace("{role}", roleLabel)}</p>
            <div className="flex gap-3">
              <form action={acceptStaffInviteAction}>
                <Button type="submit">{t.confirmCta}</Button>
              </form>
              <form action={discardStaffInviteAction}>
                <Button type="submit" variant="outline">
                  {t.cancelCta}
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">{t.loginPrompt}</p>
            <Button asChild>
              <Link href="/login">{t.loginCta}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/register">{t.registerCta}</Link>
            </Button>
          </div>
        )}
      </GlassPanel>
    </div>
  );
}
