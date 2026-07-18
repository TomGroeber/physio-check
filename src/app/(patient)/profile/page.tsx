import type { Metadata } from "next";
import Link from "next/link";
import { getSessionContext } from "@/server/services/session";
import { getOwnAccountEmails, getOwnProfile } from "@/server/services/profile";
import { getPatientReminderPreferences } from "@/server/services/reminders";
import { signOutAction } from "@/server/actions/auth";
import { PhoneForm } from "@/components/patient/phone-form";
import { ReminderPreferencesForm } from "@/components/patient/reminder-preferences-form";
import { EmailChangeForm } from "@/components/patient/email-change-form";
import { PasswordChangeForm } from "@/components/patient/password-change-form";
import { FormMessage } from "@/components/auth/form-message";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { de } from "@/messages/de";

export const metadata: Metadata = { title: de.patient.profile.title };

const t = de.patient.profile;

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ email_confirmed?: string }>;
}) {
  const session = (await getSessionContext())!;
  const [profile, reminderPreferences, accountEmails, query] = await Promise.all([
    getOwnProfile(session.userId),
    getPatientReminderPreferences(session.userId),
    getOwnAccountEmails(),
    searchParams,
  ]);
  const currentEmail = accountEmails.email ?? session.email ?? "–";

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>

      {query.email_confirmed ? (
        <FormMessage success={t.security.emailConfirmed} />
      ) : null}

      <section aria-labelledby="personal-heading" className="flex flex-col gap-3">
        <h2 id="personal-heading" className="text-2xl font-bold">
          {t.personalHeading}
        </h2>
        <Card>
          <CardContent className="flex flex-col gap-4 p-5">
            <div>
              <p className="text-base text-muted-foreground">{t.name}</p>
              <p className="text-lg font-bold">{session.fullName || "–"}</p>
            </div>
            <div>
              <p className="text-base text-muted-foreground">{t.email}</p>
              <p className="text-lg font-bold break-all">{currentEmail}</p>
            </div>
            <PhoneForm initialPhone={profile?.phone ?? ""} />
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="security-heading" className="flex flex-col gap-3">
        <h2 id="security-heading" className="text-2xl font-bold">
          {t.securityHeading}
        </h2>
        <Card>
          <CardContent className="p-5">
            <EmailChangeForm
              currentEmail={currentEmail}
              pendingEmail={accountEmails.pendingEmail}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <PasswordChangeForm />
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="reminders-heading" className="flex flex-col gap-3">
        <h2 id="reminders-heading" className="text-2xl font-bold">
          {t.remindersHeading}
        </h2>
        <Card>
          <CardContent className="p-5">
            <ReminderPreferencesForm preferences={reminderPreferences} />
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="practice-heading" className="flex flex-col gap-3">
        <h2 id="practice-heading" className="text-2xl font-bold">
          {t.practiceHeading}
        </h2>
        <Card>
          <CardContent className="flex flex-col gap-4 p-5">
            <p className="text-lg font-bold">
              {session.patientLink?.practiceName ?? t.noPractice}
            </p>
            <Button asChild variant="outline" className="min-h-14 w-full text-lg">
              <Link href="/connect">{t.changePractice}</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section aria-label={t.signOutHeading}>
        <form action={signOutAction}>
          <Button type="submit" variant="outline" className="min-h-14 w-full text-lg">
            {de.common.signOut}
          </Button>
        </form>
      </section>
    </div>
  );
}
