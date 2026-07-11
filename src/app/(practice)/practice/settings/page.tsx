import type { Metadata } from "next";
import { getSessionContext } from "@/server/services/session";
import { getPractice } from "@/server/services/practice";
import { getOwnCalendarColor } from "@/server/services/profile";
import { isCalendarColor } from "@/lib/calendar-colors";
import { CalendarColorPicker } from "@/components/practice/calendar-color-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { de } from "@/messages/de";

export const metadata: Metadata = { title: de.practice.settings.title };

const t = de.practice.settings;

/**
 * Praxis-Einstellungen (im MVP bewusst klein: Anzeige der Praxisdaten
 * und persönliche Kalenderfarbe; mehr folgt mit der Admin-Rolle).
 */
export default async function SettingsPage() {
  const session = (await getSessionContext())!;
  const membership = session.memberships[0];
  const [practice, color] = await Promise.all([
    getPractice(membership.practiceId),
    getOwnCalendarColor(membership.memberId),
  ]);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <h1 className="text-2xl font-bold">{t.title}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t.practiceData}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-base">
          <p className="font-semibold">{practice?.name}</p>
          <p>{practice?.address_street}</p>
          <p>
            {practice?.address_postal_code} {practice?.address_city}
          </p>
          {practice?.phone && <p>{practice.phone}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t.calendarColorTitle}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">{t.calendarColorHint}</p>
          <CalendarColorPicker currentColor={isCalendarColor(color) ? color : "teal"} />
        </CardContent>
      </Card>
    </div>
  );
}
