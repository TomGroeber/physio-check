import type { Metadata } from "next";
import Link from "next/link";
import { getSessionContext } from "@/server/services/session";
import { signOutAction } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { de } from "@/messages/de";

export const metadata: Metadata = { title: de.patient.profile.title };

const t = de.patient.profile;

export default async function ProfilePage() {
  const session = (await getSessionContext())!;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t.title}</h1>

      <Card>
        <CardContent className="flex flex-col gap-4 p-5">
          <div>
            <p className="text-base text-muted-foreground">{t.name}</p>
            <p className="text-lg font-bold">{session.fullName || "–"}</p>
          </div>
          <div>
            <p className="text-base text-muted-foreground">{t.email}</p>
            <p className="text-lg font-bold break-all">{session.email ?? "–"}</p>
          </div>
          <div>
            <p className="text-base text-muted-foreground">{t.practice}</p>
            <p className="text-lg font-bold">
              {session.patientLink?.practiceName ?? t.noPractice}
            </p>
          </div>
        </CardContent>
      </Card>

      <Button asChild variant="outline" className="h-12 w-full text-lg">
        <Link href="/invite">{t.changePractice}</Link>
      </Button>

      <form action={signOutAction}>
        <Button type="submit" variant="outline" className="h-12 w-full text-lg">
          {de.common.signOut}
        </Button>
      </form>
    </div>
  );
}
