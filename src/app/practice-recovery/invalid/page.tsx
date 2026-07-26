import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { de } from "@/messages/de";

export const metadata: Metadata = { title: de.admin.practiceRecovery.invalidHeading };

const t = de.admin.practiceRecovery;

export default function PracticeRecoveryInvalidPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-5 py-10">
      <GlassPanel strong className="flex flex-col gap-4">
        <h1 className="text-xl font-bold">{t.invalidHeading}</h1>
        <p className="text-muted-foreground">{t.invalidBody}</p>
        <Button asChild className="self-start">
          <Link href="/login">{t.loginCta}</Link>
        </Button>
      </GlassPanel>
    </div>
  );
}
