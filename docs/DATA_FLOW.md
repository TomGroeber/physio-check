# PhysioCheck – Datenfluss

> Stand 01.08.2026. Beschreibt den **tatsächlichen** Datenfluss im Code (verifiziert, nicht angenommen) – Website, native App, Backend, Datenbank, Speicher, Auth. Für den Hosting-Vergleich s. `docs/HOSTING_OPTIONS.md`, für die reine API-Auflistung s. `docs/API_ARCHITECTURE.md`, für die Synchronisation zwischen Website und App s. `docs/WEB_MOBILE_SYNC.md`.

## Überblick in einem Bild

```
                    ┌─────────────────────────┐
                    │   Supabase-Projekt        │
                    │  (eine Instanz für alles)  │
                    │                            │
                    │  ┌──────────────────────┐  │
                    │  │ PostgreSQL + RLS      │  │
                    │  └──────────────────────┘  │
                    │  ┌──────────────────────┐  │
                    │  │ Auth (Nutzerkonten)   │  │
                    │  └──────────────────────┘  │
                    │  ┌──────────────────────┐  │
                    │  │ Storage (Dateien)     │  │
                    │  └──────────────────────┘  │
                    └───────────▲────────────────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                                    │
   ┌──────────┴──────────┐            ┌────────────┴───────────┐
   │  Next.js-Website     │            │  Native Patienten-App   │
   │  (Praxis + Patient)  │            │  (Expo/React Native)    │
   │                       │            │                          │
   │  Server-seitig:       │            │  Läuft direkt auf dem    │
   │  Server Actions/      │            │  Gerät der Patientin:    │
   │  Route Handler →       │            │  spricht für Lesen und   │
   │  src/server/services   │            │  einfache Schreibvorgänge│
   │  → src/server/db       │            │  direkt mit Supabase      │
   │  → Supabase             │            │  (RLS schützt), für       │
   │                        │            │  heikle Vorgänge über      │
   │  (Cookie-Sitzung)       │            │  /api/mobile/*-Routen      │
   │                        │            │  der Website (Bearer-Token)│
   └────────────────────────┘            └──────────────────────────┘
```

**Kurz gesagt:** Es gibt EIN Backend – die Supabase-Instanz. Die Website spricht damit ausschließlich über eine eigene Server-Schicht (nie direkt aus dem Browser). Die native App spricht für die meisten Vorgänge direkt mit Supabase (die Datenbank-Zugriffsregeln – Row Level Security, RLS – schützen das), und nur für eine kleine, bewusst ausgewählte Gruppe heikler Vorgänge (siehe unten) über eigens dafür angelegte Website-Endpunkte.

## 1. Website → Backend

Jede Handlung auf der Website läuft über dieselbe Kette (verpflichtend laut `CLAUDE.md`, Regel „Kapselung"):

```
Oberfläche (Formular/Knopf)
   → Server Action ("use server") ODER Route Handler
   → Zod-Validierung der Eingabe
   → src/server/services/*.ts (Fachlogik)
   → src/server/db/server-client.ts (einziger Supabase-Zugriffspunkt)
   → Supabase (Datenbank/Storage/Auth)
```

Beispiel (Übung dokumentieren): `src/server/actions/exercise-logs.ts` (Server Action, validiert Eingabe) → `src/server/services/exercise-log.ts` (ruft `record_exercise_occurrence` per RPC auf) → `src/server/db/server-client.ts` (Supabase-Client, an Cookie-Sitzung gebunden).

**Geprüft:** Kein einziger Client-Baustein (`"use client"`-Datei) im gesamten Website-Code spricht direkt mit Supabase. Der Browser sieht Supabase nie – nur die eigene Website-Adresse.

## 2. Native App → Backend

Anders als die Website hat die native App **keine eigene Server-Zwischenschicht** – sie läuft direkt auf dem Gerät. Zwei Wege:

**a) Direktzugriff auf Supabase (Normalfall für Lesen, teils auch Schreiben)**

Beispiel Lesen: `apps/patient-mobile/src/data/today.ts` fragt `exercise_plans`, `completion_logs`, `appointments` direkt bei Supabase ab. Geschützt durch RLS: jede Tabelle hat Datenbankregeln, die dafür sorgen, dass eine Patientin ausschließlich ihre eigenen Zeilen sehen kann – unabhängig davon, was die App anfragt.

Beispiel Schreiben (über eine abgesicherte Funktion statt einer offenen Tabellen-Schreibberechtigung): `recordOccurrence()` (`apps/patient-mobile/src/data/exercise.ts`) ruft nicht direkt „schreibe in completion_logs", sondern die Datenbankfunktion `record_exercise_occurrence`. Diese Funktion läuft mit erhöhten Rechten, prüft aber INNEN selbst noch einmal, wer angemeldet ist, und lässt nur zu, dass jemand für den eigenen, aktiven Übungsplan einen Eintrag anlegt. Ein manipulierter Aufruf mit fremder Patienten-ID würde von der Funktion selbst abgelehnt, nicht nur durch die App-Oberfläche verhindert.

**b) Website-API für heikle Vorgänge (`/api/mobile/*`)**

Für eine bewusst kleine Gruppe von Vorgängen, die die App nicht direkt selbst dürfen soll, ruft die App stattdessen eine Route der Website auf (mit ihrem eigenen Supabase-Zugangs-Token im Header):

- `/api/mobile/exercise-media` – kurzlebige, signierte Video-Adresse holen (Übungsvideos liegen in einem für Patienten komplett gesperrten Speicherbereich)
- `/api/mobile/avatar/start`, `/api/mobile/avatar/finalize`, `/api/mobile/avatar` – Profilbild-Upload (inkl. Malware-Prüfung serverseitig)
- `/api/mobile/invite/check` – Einladungscode prüfen, bevor ein Konto überhaupt existiert
- `/api/mobile/account-deletion` – Kontolöschung

Diese Routen laufen serverseitig mit dem „Service-Role"-Schlüssel (voller Datenbankzugriff, niemals im Client enthalten) – genau die Art von Vorgang, die nicht direkt vom Gerät aus laufen darf.

## 3. Backend → PostgreSQL

Sämtlicher Datenbankzugriff läuft entweder über normale, RLS-gefilterte Tabellen-Abfragen oder über `SECURITY DEFINER`-Datenbankfunktionen (Postgres-Funktionen mit eigener, in der Funktion selbst geprüfter Berechtigung – etwa für mehrschrittige Vorgänge wie „Termin abschließen und Einheit anrechnen", die atomar sein müssen).

## 4. Backend → Storage

Drei private Speicherbereiche (Buckets), keiner davon öffentlich lesbar: Profilbilder, Übungsvideos/-bilder, Patientenakten. Zugriff ausschließlich über kurzlebige, signierte Adressen, serverseitig erzeugt:

| Inhalt | Gültigkeit der Adresse |
|---|---|
| Übungsvideo/-vorschau | 10 Minuten |
| Profilbild (Anzeige) | 5–10 Minuten |
| Patientenakte | 60 Sekunden |

Nach Ablauf ist die Adresse wertlos – wer sie sich merkt oder weiterschickt, kommt später nicht mehr an die Datei.

## 5. Backend → Auth

Beide Apps nutzen **dieselbe** Supabase-Auth-Instanz (dieselben Nutzerkonten, dasselbe Passwort funktioniert auf Website und App), aber **getrennte Sitzungen**: Die Website hält ihre Sitzung in einem Cookie (serverseitig verwaltet), die App hält ihre eigene Sitzung sicher auf dem Gerät (verschlüsselter Speicher, kein Cookie). Meldet man sich auf der Website ab, bleibt man in der App weiter angemeldet, und umgekehrt – das ist normales, erwartetes Verhalten zweier getrennter Anwendungen mit gemeinsamem Nutzerkonto, keine Ungenauigkeit.

## 6. Realtime-Nachrichten

**Ehrlich:** Es gibt aktuell **keine** echte Realtime-Funktion (kein Supabase-Realtime-Kanal im Code gefunden). Nachrichten aktualisieren sich stattdessen durch regelmäßiges Nachfragen:

- Website: alle 8 Sekunden, nur solange der Tab sichtbar ist (kein unnötiges Nachfragen im Hintergrund-Tab).
- App: beim Öffnen, wenn die App wieder in den Vordergrund kommt, und beim manuellen „Nach unten ziehen zum Aktualisieren".

Das bedeutet: eine neue Nachricht erscheint nicht sofort in derselben Sekunde, sondern binnen weniger Sekunden (Website) bzw. beim nächsten App-Wechsel/Ziehen (App). Für ein Nachrichtensystem, das ausdrücklich NICHT für Notfälle gedacht ist (das steht auch so in der App), ist das angemessen – für eine echte „Sofort"-Erfahrung wäre eine Umstellung auf Supabase-Realtime ein späterer, klar abgrenzbarer Ausbauschritt.

## 7. Uploads

Ablauf (Beispiel Profilbild, App): App fragt bei `/api/mobile/avatar/start` eine Upload-Adresse an → App lädt die Datei direkt zu Supabase Storage hoch → App meldet `/api/mobile/avatar/finalize`, das serverseitig Dateityp, Größe, echte Dateisignatur (nicht nur die Dateiendung) und bei aktivierter Prüfung einen Virenscan durchführt, bevor der neue Pfad in der Datenbank vermerkt wird. Schlägt die Prüfung fehl, bleibt die alte Datei unverändert bestehen – kein halb hochgeladener Zustand.

## 8. Was passiert, wenn ein Gerät offline ist?

**Ehrlich:** Es gibt aktuell **keine** Warteschlange für Vorgänge, die offline ausgelöst wurden, und keine automatische Wiederholung. Schlägt eine Anfrage wegen fehlender Verbindung fehl, zeigt die App eine Fehlermeldung; die Person kann per Ziehen-zum-Aktualisieren erneut versuchen, sobald wieder Verbindung besteht. Es geht dabei nichts heimlich verloren (nichts wird lokal "erledigt" angezeigt, was serverseitig nicht wirklich gespeichert wurde) – aber es ist auch kein komfortables Offline-Erlebnis. Für eine Reha-App, die überwiegend zuhause mit WLAN genutzt wird, ist das ein akzeptabler, aber dokumentierter Kompromiss – kein „das funktioniert schon irgendwie"-Blindpunkt.

## 9. Wie werden Konflikte verhindert?

Zwei Mechanismen, je nach Situation:

- **Datenbankebene:** Ausschlussregeln (z. B. kein Termin-Doppelbuchung derselben behandelnden Person im selben Zeitraum – ein Datenbankfehler `23P01`, den die Server Action in eine verständliche deutsche Meldung übersetzt).
- **Funktionsebene:** `SECURITY DEFINER`-Funktionen wie `record_exercise_occurrence` sperren sich selbst kurzzeitig pro Person/Übung/Tag (eine sogenannte Advisory-Sperre), damit zwei gleichzeitige Anfragen (z. B. Doppel-Tippen) nicht zu doppelten Einträgen führen.

Es gibt kein allgemeines „letzter Schreibvorgang gewinnt/verliert"-Problem, weil die meisten Schreibvorgänge entweder reine Einfügungen (neue Zeile, kein Konflikt möglich) oder durch genau diese Mechanismen abgesichert sind.
