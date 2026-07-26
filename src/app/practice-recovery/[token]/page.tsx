import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { inspectPracticeMemberRecoveryToken } from "@/server/services/practice-member-recovery";
import { GlassPanel } from "@/components/ui/glass-panel";
import { de } from "@/messages/de";
import { RecoveryForm } from "./recovery-form";

export const metadata: Metadata = { title: de.admin.practiceRecovery.title };

const t = de.admin.practiceRecovery;
const tDetail = de.admin.detail;

export default async function PracticeRecoveryPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const pending = await inspectPracticeMemberRecoveryToken(token);
  if (!pending) redirect("/practice-recovery/invalid");

  const roleLabel = pending.role === "admin" ? tDetail.roleAdmin : tDetail.roleTherapist;

  return (
    <div className="mx-auto flex max-w-md flex-col gap-5 py-10">
      <GlassPanel strong className="flex flex-col gap-4">
        <h1 className="text-xl font-bold">{t.title}</h1>
        <p className="text-sm text-muted-foreground">
          {t.practiceLabel}: <span className="font-semibold text-foreground">{pending.practiceName}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          {t.roleLabel}: <span className="font-semibold text-foreground">{roleLabel}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          {t.newEmailLabel}: <span className="font-semibold text-foreground">{pending.newEmail}</span>
        </p>
        <RecoveryForm token={token} />
      </GlassPanel>
    </div>
  );
}
