# PhysioCheck – Architektur

## Ergänzung Phase D/E: Plan-Builder und Veröffentlichung

Der Client hält nur den Entwurf. Die Server Action validiert den vollständigen Plan mit Zod und leitet die Praxis-ID ausschließlich aus der verifizierten Mitgliedschaft ab. `publish_exercise_plan` prüft den aktiven Patientenlink sowie jede aktive, nicht archivierte Übung erneut und veröffentlicht Version, Items, aktuellen Zeiger, datensparsame Notification und Audit atomar. Direkte Tabellenmutationen sind nicht freigegeben. Leser normalisieren historische Schedule-Formate zentral in `src/lib/plan-schedule.ts`.

## Phase-C-Erweiterung 2026-07-13: Übungsmedien

Große Übungsmedien werden ticket-basiert hochgeladen: Server Action prüft aktive Praxis-Mitgliedschaft und die Übung, der Service erzeugt einen zufälligen Pfad `<practice_id>/<exercise_id>/<uuid>.<ext>` und eine eng begrenzte signierte Upload-URL. Der Browser lädt direkt mit echtem Fortschritt in den privaten Bucket. Eine zweite Server Action finalisiert erst nach Prüfung von Pfad, Bucket-Information, Größenlimit und Magic Bytes. Pro Übung existiert durch einen eindeutigen Index höchstens ein Medium je Art; Austausch und Entfernen löschen auch das vorherige Storage-Objekt und schreiben ein datensparsames Audit-Ereignis.

Patienten greifen niemals direkt auf Storage zu. `getExerciseDetailForPatient` weist zuerst nach, dass das Plan-Item zum eigenen aktuellen Plan gehört, und erzeugt danach kurzlebige URLs für Video, Poster, Alternativbild und WebVTT-Untertitel. Direkte Storage-Lesezugriffe bleiben per Policy Praxismitgliedern vorbehalten.

## Phase-C-Erweiterung: freie Registrierung und Übungsdokumentation

Die Registrierung erzeugt nur noch ein unverbundenes Patientenkonto; `homeRouteFor` leitet Konten ohne Rolle und ohne Praxis-Link in den geschützten Verbindungsbereich `/connect` (Codeeingabe, Basiskonto, Abmeldung). Die Praxisverbindung läuft unverändert über die geprüfte Einladung und `redeem_patient_invite`.

Übungsdokumentation: Die Übungsdetailseite und die Dokumentations-Action prüfen serverseitig, dass das Plan-Item zum **aktuellen** aktiven Plan des angemeldeten Patienten gehört (`src/server/services/exercise-log.ts`); erst danach erzeugt der Service-Client eine kurzlebige signierte Video-URL aus dem privaten Bucket. Der Insert des Protokolls läuft mit den Rechten des Patienten – die RLS-Insert-Policy ist die zweite Verteidigungslinie. `prescription_snapshot` friert die Vorgaben ein; Doppelerfassungen pro Kalendertag (Praxiszeitzone) werden abgewiesen. Eine Migration begrenzt das Lesen von Protokollen auf Mitglieder der Praxis, zu deren Plan das Item gehört (Mandantentrennung nach Praxiswechsel, D-019).

## Phase-B-Erweiterung: Einladung und Praxiswechsel

Der öffentliche Code wird ausschließlich in einer Server Action geprüft. Bei Erfolg entsteht eine 30 Minuten gültige, HMAC-signierte HttpOnly-Einladungssitzung. Registrierung und Annahme lesen diese Sitzung erneut und prüfen den Datensatz gegen die Datenbank.

Die Einlösung läuft über `redeem_patient_invite`: Einladung sperren → Gültigkeit prüfen → bisherige aktive Verbindung beenden → neue Verbindung anlegen → Einladung als benutzt markieren → Audit-Ereignis schreiben. Sämtliche Schritte bilden eine Transaktion.

Öffentliche Fehlversuche werden in `invite_redemption_attempts` pro pseudonymisiertem HMAC-Fingerabdruck und Zeitfenster begrenzt. Die Tabelle besitzt keine Client-Policies und ist nur für den serverseitigen Service-Client zugänglich.

> Stand: 2026-07-11 · Status: Phase 0 beschlossen, Umsetzung ab Phase 1. Versionsangaben werden bei der Projekterstellung exakt gepinnt und im README dokumentiert.

## 1. Stack-Entscheidung (geprüft am 2026-07-11)

| Baustein | Wahl | Begründung |
|---|---|---|
| Framework | **Next.js 16** (App Router, TypeScript strict, Turbopack) | Aktuelles Stable (16.2.x), Server Components + Server Actions für serverseitige Logik, PWA-fähig. |
| Styling | **Tailwind CSS v4** | Aktuelles Stable; Design-Tokens per CSS-Variablen im `@theme`-Block → Branding zentral änderbar. |
| Komponenten | **shadcn/ui** (Tailwind v4 + React 19 kompatibel) | Zugängliche Radix-Primitives; Optik wird über eigene Tokens angepasst, nicht blind übernommen. |
| Backend | **Supabase**: PostgreSQL, Auth, Storage | Default laut Vorgabe; RLS, private Buckets mit signierten URLs, EU-Region wählbar. |
| Auth-Anbindung | **`@supabase/ssr`** | Offiziell empfohlener Weg für App Router (Cookie-Sessions, Browser- + Server-Client, Middleware-Refresh). Die alten `auth-helpers` sind deprecated. |
| Validierung | **Zod** | Serverseitige Validierung aller Schreibvorgänge, geteilte Schemas. |
| Formulare | **React Hook Form** + Zod-Resolver | |
| Tests | **Vitest + Testing Library**, **Playwright** (E2E) | |
| Paketmanager | **pnpm** | Muss lokal noch installiert werden (Phase 1). |

**Bewusst weggelassen im MVP:** i18n-Bibliothek (stattdessen zentrales deutsches Text-Modul, so strukturiert, dass später `next-intl` o. ä. übernehmen kann), State-Management-Bibliothek (Server Components + gezielte Client-Islands genügen), E-Mail-/Push-Dienste (Benachrichtigungen zunächst nur In-App).

## 2. Schichtenmodell – Supabase ist gekapselt

Das Frontend spricht **nie direkt** mit Supabase-Tabellen. Aufbau:

```
UI (Server/Client Components)
  → Server Actions / Route Handlers   (Zod-Validierung, Auth-/Rollenprüfung)
    → Service-Schicht  src/server/services/   (Geschäftslogik, Audit-Events)
      → Datenzugriff   src/server/db/         (einziger Ort mit Supabase-Queries)
        → PostgreSQL mit RLS               (zweite, unabhängige Verteidigungslinie)
```

- `src/server/**` ist mit `server-only` markiert – kann nicht in den Browser gelangen.
- Der **Service-Role-Key** existiert nur in Server-Umgebungsvariablen und wird nur für eng begrenzte Operationen benutzt (z. B. Code-Einlösung, Seeds). Niemals im Browser.
- RLS gilt auf **jeder** patientenbezogenen Tabelle, auch wenn die Service-Schicht bereits prüft („Defense in Depth"). Versteckte Buttons sind keine Zugriffskontrolle.

## 3. Projektstruktur (geplant)

```
src/
  app/
    (auth)/        Einladung, Login, eingeladene Registrierung, Passwort-Reset
    (patient)/     Heute, Übung durchführen, Termine, Profil
    (practice)/    Dashboard, Patienten, Übungsbibliothek, Termine, Einstellungen
    api/           Route Handler (nur wo Server Actions nicht reichen)
  components/      Wiederverwendbare UI (ui/ = shadcn-Basis, angepasst)
  config/
    branding.ts    App-Name, Logo-Pfad, Praxis-Defaults – EINZIGE Stelle für Branding
  lib/             Geteilte Utilities (Datum/Zeitzone zentral!), Zod-Schemas
  messages/de.ts   Alle deutschen Oberflächentexte (später fr.ts, lb.ts)
  server/
    services/      Geschäftslogik (invites, plans, appointments, logs, …)
    db/            Supabase-Client-Fabriken + Queries
supabase/
  migrations/      Reproduzierbare SQL-Migrationen inkl. RLS-Policies
  seed.sql         Eindeutig fiktive Demo-Daten
docs/              Produkt-, Architektur-, Datenmodell-, Datenschutz-Doku
e2e/               Playwright-Tests
```

## 4. Sicherheitsentscheidungen

1. **Rollen liegen in der Datenbank, nicht im Client.** `practice_members` (Rolle `therapist`/`admin` je Praxis) wird nur serverseitig geschrieben. Kein Registrierungsweg erzeugt privilegierte Rollen; Therapeuten entstehen im MVP über Seed-/Admin-Prozess.
2. **Einladungscodes:** serverseitig erzeugt aus Alphabet ohne verwechselbare Zeichen (`ABCDEFGHJKMNPQRSTUVWXYZ23456789`, ≥ 10 Zeichen, gruppiert angezeigt). Gespeichert wird nur ein Hash. Einlösung läuft über eine Server Action mit Rate Limiting (Versuchszähler + Zeitfenster) und konstanter Fehlermeldung („Code ungültig oder abgelaufen") ohne Orakel-Effekt.
3. **Videos:** privater Storage-Bucket, Zugriff ausschließlich über kurzlebige signierte URLs, die eine serverseitige Berechtigungsprüfung voraussetzen. Upload validiert MIME-Typ und Größe serverseitig.
4. **RLS-Testpflicht:** Für jede Tabelle existieren Tests, die Fremdzugriff (anderer Patient, fremde Praxis) nachweislich verhindern (Phase 2/4).
5. **Audit-Events** für sicherheits- und therapieplanrelevante Änderungen (Code erzeugt/widerrufen/eingelöst, Plan geändert, Termin storniert, Rollenänderung) – ohne unnötige Gesundheitsdetails.
6. **Keine Secrets im Repo**; vollständige `.env.example`. Fehlerüberwachung (falls später) ohne Patientendaten.
7. **CSRF/XSS:** Server Actions mit Origin-Prüfung (Next-Standard), keine `dangerouslySetInnerHTML` mit Nutzerdaten, strikte Content-Security-Policy in Phase 4.
8. **EU-/EWR-Hosting** ist Deployment-Anforderung (Supabase-Region z. B. Frankfurt, Hosting mit EU-Region). Details in `docs/PRIVACY_SECURITY.md`.

## 5. Zeit und Zeitzonen

Alle Zeitpunkte als `timestamptz` (UTC) in der Datenbank; Termine speichern zusätzlich die IANA-Zeitzone der Praxis (z. B. `Europe/Luxembourg`). Formatierung ausschließlich über ein zentrales Datumsmodul (`src/lib/datetime.ts`) mit `Intl`-APIs – testbar, sommerzeitsicher. „Heute geplante Übungen" werden in der Zeitzone des Patienten/der Praxis berechnet, nie in UTC-Naivität.

## 6. PWA

Web-App-Manifest + Service Worker (App-Shell-Caching, Offline-Hinweisseite). Keine Offline-Dokumentation von Übungen im MVP (Konfliktvermeidung) – als Roadmap-Punkt notiert.

## 7. Meilensteine

| Phase | Ziel |
|---|---|
| **1 – Grundgerüst** | pnpm/Supabase-CLI-Setup, Projekt, Design-Tokens, Navigation, Auth-Struktur, Migrationen + RLS-Basis, Seeds, Layouts Patient/Therapeut. Lokal startbar und getestet. |
| **2 – Vertikaler Kernablauf** | Therapeut legt Patient an → Code → Registrierung → Einlösung → Übung zuweisen → Patient dokumentiert → Therapeut sieht Eintrag. End-to-End real funktionierend. |
| **3 – Termine & Absagen** | Terminverwaltung, nächster Termin, Standort, Absageanfrage + Bearbeitung, Benachrichtigungsstatus. |
| **4 – Härtung** | Barrierefreiheit, Tests, Fehlerfälle, Security-Review, Videoverwaltung komplett, `CUSTOMIZATION_GUIDE.md`, Pilot-Checkliste. |
