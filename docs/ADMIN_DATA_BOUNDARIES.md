# PhysioCheck – Was der Plattform-Admin sehen darf (und was nie)

> Stand 01.08.2026. Vollständige Codeprüfung aller Admin-Abfragen (`src/server/services/platform-admin.ts`, `src/server/actions/platform-admin.ts`). Ergänzt `docs/PLATFORM_ADMIN_SECURITY.md` um die konkrete Datenliste.

## Erlaubt: betriebliche Daten

| Sichtbar für den Admin | Quelle |
|---|---|
| Praxisname, Status, Adresse (Stadt), Erstellungsdatum, Testphasenende | `practices` |
| Praxis-internes Notizfeld (vom Betreiber selbst gepflegt, nicht klinisch) | `practices.internal_note` |
| Mitarbeiterliste: Name, Rolle, aktiv/inaktiv | `practice_members` + `profiles.full_name` |
| Anzahl verbundener Patient:innen (nur Zählung, keine Namen) | `patient_practice_links` (count) |
| Einladungsstatus für Mitarbeitende | `staff_invites` |
| Strukturierte Prüfereignisse (Ereignistyp, Praxisname, Zeitpunkt) | `audit_events` |
| Globale Produkteinstellungen | `platform_config` |

## Nie sichtbar: alles mit Patientenbezug

Vollständige Codesuche bestätigt: **keine** Admin-Abfrage berührt `messages`, `conversations`, `patient_documents` (Inhalte oder mit Patientenname versehene Dateinamen), Übungsplan-Notizen, Schmerzwerte, Diagnosen, oder Durchführungsprotokoll-Notizen. Die einzige patientenbezogene Zahl, die der Admin sieht, ist eine reine **Anzahl** verbundener Patient:innen pro Praxis – kein einziger Name, keine einzige Krankheitsangabe.

## Die „Letzte Ereignisse"-Übersicht im Betreiberportal – genauer betrachtet

Diese Liste zeigt Einträge wie „Nachricht-Zugangs-Wiederherstellung erzeugt · Demo-Praxis Sonnenbrücke" oder „Patient-Einladung eingelöst · Demo-Praxis Sonnenbrücke" – **immer nur** Ereignistyp + Praxisname + Zeitstempel. Geprüft: kein Eintrag enthält einen Patientennamen, einen Nachrichtentext oder einen Dateinamen.

## Zusammenfassung in einem Satz

Der Plattform-Admin sieht **wie viele** Patient:innen eine Praxis hat, nie **wer** sie sind oder **was** über sie dokumentiert wurde.
