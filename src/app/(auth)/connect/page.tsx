import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSessionContext } from "@/server/services/session";
import { de } from "@/messages/de";

export const metadata: Metadata = { title: de.connect.title };

/** Rückwärtskompatible Route für alte Links aus Phase 1. */
export default async function ConnectPage() {
  const session = await getSessionContext();
  if (!session) redirect("/login");
  if (session.memberships.length > 0) redirect("/practice");
  redirect(session.patientLink ? "/today" : "/invite");
}
