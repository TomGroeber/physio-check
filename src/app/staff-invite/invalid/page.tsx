import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { de } from "@/messages/de";

export const metadata: Metadata = { title: de.admin.staffInvite.invalidHeading };

const t = de.admin.staffInvite;

export default async function StaffInviteInvalidPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;

  return (
    <div className="mx-auto flex max-w-md flex-col gap-5 py-10">
      <GlassPanel strong className="flex flex-col gap-4">
        <h1 className="text-xl font-bold">{t.invalidHeading}</h1>
        <p className="text-muted-foreground">
          {reason === "email_mismatch" ? t.emailMismatchBody : t.invalidBody}
        </p>
        <Button asChild className="self-start">
          <Link href="/login">{t.loginCta}</Link>
        </Button>
      </GlassPanel>
    </div>
  );
}
