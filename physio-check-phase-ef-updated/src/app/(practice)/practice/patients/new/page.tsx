import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSessionContext } from "@/server/services/session";
import { getOpenPatientInvite } from "@/server/services/practice";
import { PatientInviteForm } from "@/components/practice/patient-invite-form";
import { de } from "@/messages/de";

export const metadata: Metadata = { title: de.practice.patients.newTitle };

export default async function NewPatientInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ replace?: string }>;
}) {
  const session = (await getSessionContext())!;
  const { replace } = await searchParams;
  const practiceId = session.memberships[0].practiceId;
  const existing = replace
    ? await getOpenPatientInvite(practiceId, replace)
    : null;
  if (replace && !existing) notFound();

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <h1 className="text-2xl font-bold">{de.practice.patients.newTitle}</h1>
      <PatientInviteForm
        defaultName={existing?.patient_display_name}
        replaceInviteId={existing?.id}
      />
    </div>
  );
}

