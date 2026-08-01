# PhysioCheck – API-Architektur

> Stand 01.08.2026. Technische Übersicht: welche Endpunkte/Zugriffswege es gibt, welche Funktionen direkt über Supabase laufen, welche über eigene Server-Endpunkte, wie Sitzungen funktionieren. Für die Erklärung „warum funktioniert das so" s. `docs/DATA_FLOW.md`.

## Grundprinzip

Es gibt **kein** eigenständiges, klassisches REST/GraphQL-Backend. Stattdessen:

1. **Website:** Next.js Server Actions und Route Handler sind die „API" – sie laufen serverseitig, nie im Browser sichtbar, und sind der einzige Weg, wie die Website mit Supabase spricht.
2. **Native App:** spricht für die meisten Vorgänge direkt mit der Supabase-eigenen REST-Schnittstelle (PostgREST, automatisch von Supabase bereitgestellt) – abgesichert durch Row Level Security (RLS) und Datenbankfunktionen. Für eine kleine Gruppe heikler Vorgänge ruft sie zusätzlich Next.js-Route-Handler der Website auf (siehe unten).

## Website: Server Actions (der Regelfall)

Fast jede schreibende Handlung auf der Website ist eine Server Action (`"use server"`-Funktion), aufgerufen direkt aus einem Formular oder Knopf – kein manuelles `fetch` nötig, Next.js kümmert sich um die Übertragung. Beispiele (nicht vollständig):

| Bereich | Datei | Beispielfunktion |
|---|---|---|
| Termine | `src/server/actions/appointments.ts` | `createAppointmentAction`, `cancelAppointmentAction` |
| Übungen | `src/server/actions/exercise-logs.ts`, `exercises.ts` | `logCompletionAction` |
| Nachrichten | `src/server/actions/messages.ts` | `sendPatientMessageAction` |
| Betreiberportal | `src/server/actions/platform-admin.ts` | `onboardPracticeAction` |
| Profil | `src/server/actions/profile.ts` | Profildaten ändern |

Jede Server Action folgt demselben Muster: Zod validiert die Eingabe → Sitzung/Berechtigung wird geprüft (`getSessionContext()` bzw. `assertPlatformAdmin()`) → Fachlogik in `src/server/services/*.ts` → Datenbankzugriff.

## Website: Route Handler (`src/app/api/**`)

Für Fälle, die kein Formular-Absenden sind (native App, Datei-Downloads, Auth-Rückrufe), gibt es klassische Route Handler unter `src/app/api/`:

- `src/app/api/mobile/*` – von der nativen App genutzt (Details unten)
- `src/app/auth/confirm/route.ts` – E-Mail-Bestätigungslink

## `/api/mobile/*` – die Schnittstelle für die native App

Das ist der einzige Ort, an dem die native App die Website wie eine „richtige" API anspricht. Bewusst klein gehalten (nur Vorgänge, die die App nicht direkt selbst mit ihrer eigenen Berechtigung ausführen darf):

| Route | Zweck |
|---|---|
| `GET /api/mobile/exercise-media` | kurzlebige, signierte Video-/Bild-Adresse für eine Übung |
| `POST /api/mobile/avatar/start` | Upload-Adresse für ein neues Profilbild anfordern |
| `POST /api/mobile/avatar/finalize` | Hochgeladenes Profilbild prüfen (Typ/Größe/Signatur/Virenscan) und übernehmen |
| `DELETE /api/mobile/avatar` | Profilbild entfernen |
| `POST /api/mobile/invite/check` | Einladungscode prüfen, bevor ein Konto existiert |
| `POST /api/mobile/account-deletion` | Konto endgültig löschen |

Jeder Aufruf trägt das Supabase-Zugangs-Token der Person im `Authorization`-Header (`Bearer <token>`); der Route Handler prüft es serverseitig und leitet erst danach an den mit vollen Rechten ausgestatteten Service-Client weiter.

## Native App: Direktzugriff auf Supabase

Für alles andere (fast alles Lesen, sowie Schreiben über Datenbankfunktionen) spricht die App direkt mit Supabase, genau wie es Supabase für RLS-abgesicherte Apps vorsieht:

- **Lesen:** normale Tabellenabfragen (z. B. `exercise_plans`, `completion_logs`, `appointments`) – RLS lässt jede Person ausschließlich ihre eigenen Zeilen sehen, unabhängig von der Abfrage.
- **Schreiben:** über Datenbankfunktionen (`supabase.rpc(...)`), nicht über offene Tabellen-Schreibrechte, z. B. `record_exercise_occurrence` (Übung dokumentieren), `mark_notification_read`. Diese Funktionen prüfen selbst noch einmal, wer angemeldet ist und ob die angefragte Zeile wirklich der eigenen, aktiven Verknüpfung gehört – unabhängig davon, was die App als Parameter mitschickt.

## Authentifizierung im Detail

**Website:** `@supabase/ssr`, Sitzung im Cookie. `src/proxy.ts` (Next.js 16s Nachfolger von „Middleware") prüft und erneuert bei jedem Seitenaufruf den Zugangstoken serverseitig.

**App:** `@supabase/supabase-js`, Sitzung in sicherem Gerätespeicher (verschlüsselt, nicht in einfachen Einstellungen). Automatische Token-Erneuerung, die pausiert, sobald die App in den Hintergrund geht (spart Akku/Daten).

**Gemeinsam:** dieselbe Supabase-Auth-Instanz, dieselben Zugangsdaten – aber zwei unabhängige Sitzungen. Ein Login auf der Website meldet die App nicht an und umgekehrt (erwartetes Verhalten getrennter Apps).

## Sicherheitsprinzip: nie einer Client-Angabe vertrauen

Egal ob Website oder App: **welche Praxis** eine Person betrifft, wird nie aus einem vom Client geschickten Feld übernommen, sondern immer serverseitig aus der eigenen, angemeldeten Mitgliedschaft/Verknüpfung nachgeschlagen (`practice_members`/`patient_practice_links`, gefiltert auf die eigene Nutzer-ID). Bei der Recherche für dieses Dokument wurde keine Stelle gefunden, an der eine vom Client mitgeschickte Praxis- oder Patienten-ID ungeprüft übernommen wird.

## Audit: greift die App unnötig direkt auf heikle Tabellen zu?

Kurze Antwort: **Nein, das aktuelle Muster ist absichtlich und angemessen.** RLS ist genau dafür gemacht, direkten Client-Zugriff sicher zu machen – das ist kein Notbehelf, sondern Supabases empfohlener Weg. Schreibvorgänge mit echtem Missbrauchspotenzial (Übung als erledigt eintragen, Benachrichtigung als gelesen markieren) laufen bereits über geprüfte Datenbankfunktionen, nicht über offene Tabellen-Schreibrechte. Die einzigen Vorgänge, die zusätzlich über die Website-API laufen, sind genau die, die einen Service-Role-Schlüssel brauchen (Malware-Scan, Kontolöschung u. Ä.) – das kann und darf nicht auf dem Gerät passieren. Es wurde kein Fall gefunden, der verschoben werden müsste.
