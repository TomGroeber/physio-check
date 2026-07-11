import type { Metadata } from "next";
import { getSessionContext } from "@/server/services/session";
import { getPractice } from "@/server/services/practice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { de } from "@/messages/de";

export const metadata: Metadata = { title: de.practice.settings.title };

const t = de.practice.settings;

/**
 * Praxis-Einstellungen (im MVP bewusst klein: Anzeige der Praxisdaten;
 * Bearbeitung folgt mit der Admin-Rolle in einer späteren Phase).
 */
export default async function SettingsPage() {
  const session = (await getSessionContext())!;
  const practice = await getPractice(session.memberships[0].practiceId);

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
    </div>
  );
}
