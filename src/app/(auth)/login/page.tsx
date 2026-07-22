import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSessionContext, homeRouteFor } from "@/server/services/session";
import { de } from "@/messages/de";
import { LoginForm } from "./login-form";
import { getPendingInvite } from "@/server/services/invites";

export const metadata: Metadata = { title: de.auth.login.title };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ account_deleted?: string }>;
}) {
  const session = await getSessionContext();
  if (session) redirect(homeRouteFor(session));
  const query = await searchParams;

  return (
    <LoginForm
      hasPendingInvite={Boolean(await getPendingInvite())}
      accountDeleted={Boolean(query.account_deleted)}
    />
  );
}
