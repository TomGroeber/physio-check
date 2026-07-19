# PhysioCheck – Mobile-Architektur (Patienten-App)

> Stand: 2026-07-19 · Branch `claude-patient-mobile-20260719` (Basis: `28ee792` auf `claude-patient-calendar-colors-20260719`) · Verbindliche Entscheidungen: `DECISIONS.md` D-058 ff.

## Zielbild

| Komponente | Rolle |
|---|---|
| `src/` (Next.js, Repo-Wurzel) | Website der Praxis (Therapeuten-Dashboard) – unverändert; zusätzlich wenige abgesicherte `/api/mobile/*`-Route-Handler für privilegierte Vorgänge |
| `apps/patient-mobile/` | Expo-/React-Native-App (iOS + Android), ausschließlich für Patienten |
| `packages/shared/` | Plattformunabhängige Typen, Zod-Schemas und reine Logik (Schedule, Dosierung, Statusdefinitionen) |
| Supabase (`supabase/`) | Gemeinsames Backend: Auth, PostgreSQL + RLS, RPCs, privater Storage – EINE Datenbank, EIN Migrationsstrang |

App und Website kommunizieren nie direkt miteinander; beide lesen und schreiben über das gemeinsame Supabase-Backend. Die App nutzt die Next-Route-Handler nur als „verlängerten Arm“ des Backends für Vorgänge, die den Service-Key erfordern.

## Datenzugriff der App (drei Stufen)

1. **Direkt über Supabase mit Publishable Key + RLS** (Standardweg): Heute-Liste, Pläne/Plan-Items, eigene Selbstauskünfte, Termine, Angebote, Verordnungsstand, Profil, Erinnerungseinstellungen, Benachrichtigungen. Die bestehenden RLS-Policies erlauben Patienten exakt die eigenen Daten – dieselben Policies, die `pnpm test:rls` mit 94 Proben absichert.
2. **Bestehende SECURITY-DEFINER-RPCs** für kritische atomare Aktionen (identisch zur Website): `redeem_patient_invite`, `record_exercise_occurrence`, `request_appointment_cancellation`, `accept_appointment_offer`, `decline_appointment_offer`, `mark_notification_read`, `primary_authorization_for_patient`, `authorization_remaining`.
3. **Abgesicherte Route-Handler `/api/mobile/*`** (Bearer-JWT, serverseitige Prüfung) NUR wo der Service-Key nötig ist:
   - signierte Übungsmedien-URLs (Video/Poster/Untertitel/Alternativbild): Storage-Policy erlaubt Patienten bewusst keinen Direktzugriff; der Server prüft `patient_can_view_exercise`/Plan-Zugehörigkeit und signiert kurzlebig (10 min) – identische Logik wie die Website.
   - Profilbild-Upload/-Ersetzen/-Entfernen nach dem Ticket-Muster (Magic-Byte-Prüfung, Audit): direkter Client-Upload in den Bucket ist gesperrt (RLS-Probe belegt das).
   - Kontolöschungsantrag (Audit + kontrollierter Ablauf, kein Service-Key im Client).
   - **Ausnahme Profilbild-ANZEIGE:** Die Lese-Policy des Buckets `patient-avatars` erlaubt dem Patienten das eigene Bild direkt – die App darf dafür selbst eine signierte URL erzeugen (kein Serverpfad nötig).

Jeder `/api/mobile/*`-Handler: authentifiziert über `Authorization: Bearer <access_token>` (Supabase `auth.getUser`), autorisiert serverseitig (aktive Patientenverbindung, nie Praxis-ID aus dem Request), nutzt die bestehenden `src/server/services/*`, liefert strukturierte Fehler (`{ error: { code, message } }`), unterliegt dem bestehenden persistenten Rate-Limiting-Muster und wird getestet.

## Auth-Ablauf

- **Sessions:** `@supabase/supabase-js` im nativen Client; Access-/Refresh-Token liegen in **expo-secure-store** (iOS Keychain / Android Keystore), niemals in einfachem AsyncStorage (D-061). Auto-Refresh aktiv, `detectSessionInUrl` aus.
- **Neuer Patient mit Code:** Code eingeben/Deep Link → serverseitige Vorprüfung (bestehender Prüfweg zeigt Praxisname + Ablauf) → Konto mit Name/E-Mail/Passwort (`auth.signUp`) → E-Mail-Bestätigung (Deep Link `physiocheck://auth/confirm`) → `redeem_patient_invite` (atomar, Code gehasht/einmalig/widerruflich) → Heute-Ansicht.
- **Bestehendes Konto:** Login → Code prüfen → Praxis(-wechsel) bestätigen → `redeem_patient_invite` → Daten neu laden. Genau eine aktive Verbindung; historische Praxisdaten wandern nie mit (bestehende RLS-Semantik).
- **Praxisrollen:** Nach Login prüft die App die Rolle über die bestehende Sicht auf `practice_members`. Praxismitglieder sehen einen freundlichen Hinweis („Diese App ist für Patienten – als Praxis nutzen Sie bitte die Website“) und werden abgemeldet – es gibt keinen mobilen Praxisbereich.
- **Passwort-Reset / E-Mail-Änderung:** per E-Mail-Link mit Deep Link `physiocheck://reset-password` bzw. Bestätigungsfluss wie Web; Änderungen laufen über Supabase Auth, nie über eigene Endpunkte.

## Deep Links

Schema `physiocheck://` (Development und v1):

- `physiocheck://invite/<code>` – Einladung öffnen
- `physiocheck://auth/confirm` – E-Mail-Bestätigung
- `physiocheck://reset-password` – Passwort-Recovery
- `physiocheck://today`, `physiocheck://appointments` – Navigationsziele (z. B. aus Push)

Universal Links (iOS) / App Links (Android) benötigen eine echte, per `apple-app-site-association`/`assetlinks.json` verifizierte Domain. **Blocker:** Es existiert noch keine produktive Domain – dokumentiert in `docs/APP_STORE_CHECKLIST.md`; bis dahin ausschließlich das App-Schema. Redirect-Ziele werden gegen eine Allowlist geprüft (keine offenen Redirects); `supabase/config.toml` erhält die zusätzlichen Redirect-URLs.

## Synchronisierung und Offline (v1 bewusst einfach)

- Laden beim Öffnen des Screens, Neuladen nach jeder Mutation, Aktualisieren beim App-Foreground (AppState-Listener), Pull-to-refresh überall.
- Kein lokaler Persistenz-Cache für Gesundheitsdaten: Daten leben im Speicher der Session; ohne Netz zeigt die App einen verständlichen Offline-Zustand statt veralteter oder „erfundener“ Synchronisierung (D-060). Es wird nie so getan, als wäre etwas synchronisiert, was es nicht ist.
- Realtime wird in v1 nicht eingesetzt (kein nachgewiesener Nutzen gegenüber Refresh-Strategie; Kanäle ließen sich später gezielt ergänzen).

## Push-Strategie (vorbereitet, nicht aktiviert)

Konzept: Expo Notifications mit Gerätetokens in einer eigenen Tabelle (RLS: nur eigene Tokens), Versand serverseitig bei neuen `notifications`-Zeilen (bestehende datensparsame Inhalte – nie Diagnosen, Schmerzwerte oder Übungsdetails im Sperrbildschirm). Auslöser: neuer/geänderter Plan, Terminänderung/-absage, Terminangebot, freiwillige Übungserinnerung (aus bestehenden Erinnerungseinstellungen). **Blocker:** APNs-/FCM-/Expo-Push-Zugangsdaten und ein Versand-Runtime (Edge Function/Cron) existieren nicht – nur Infrastrukturvorbereitung und Doku, keine erfundenen Credentials.

## Store-Release (Vorschlag, nichts wird eingereicht)

- iOS Bundle ID: `test.physiocheck.patient` (Vorschlag; endgültig erst mit echtem Namen/Konto)
- Android Application ID: `test.physiocheck.patient`
- EAS-Profile: `development` (Dev-Client, lokale Supabase), `preview` (interne Verteilung), `production` (Store) – in `eas.json`, ohne Zugangsdaten.
- Vollständige Checklisten (Privacy, Data Safety, Testkonten, TestFlight, Kontolöschung, Screenshots, Domain, Malware-Scan): `docs/APP_STORE_CHECKLIST.md`.

## Sicherheitsmodell (Zusammenfassung)

- Publishable Key ist der einzige Schlüssel in der App; Service-Key existiert nur serverseitig (Next-Server). Keine Sicherheitsprüfung nur im Client – alles hängt an RLS, RPC-Prüfungen und serverseitiger Autorisierung der Route-Handler.
- Mandantentrennung unverändert durch die bestehenden Policies (Fremdpraxis/Fremdpatient/ehemalige Praxis: 94 RLS-Proben).
- Tokens im sicheren Gerätespeicher; Logout löscht sie. Keine Gesundheitsdaten in Logs oder Push-Texten.
- Kontolöschung: in-App-Antrag über abgesicherten Serverpfad mit Audit; die rechtliche Aufbewahrungsfrage für Praxisdaten in Luxemburg ist OFFEN und dokumentiert – es wird keine rechtliche Sicherheit erfunden (D-062).

## Gemeinsamer Code (`packages/shared`)

Geteilt wird nur, was plattformneutral ist: TypeScript-Typen der Fachdomäne, Zod-Schemas (Validierungen ohne Next-Bezug), Schedule-/Occurrence-Berechnung, Dosierungs-/Statusformatierung, Einladungscode-Format-Validierung, sichere Redirect-/Deep-Link-Helfer, Datumslogik ohne Browser-/Server-Abhängigkeiten.

**Bewusst NICHT geteilt:** Server Actions, React Server Components, Cookie-Session-Logik, `src/server/*` (Services/DB-Clients, `server-only`), UI-Komponenten (Web: shadcn/Tailwind, App: native Komponenten – unterschiedliche Interaktionsmuster und Barrierefreiheits-APIs), `src/messages/de.ts` der Website (die App führt eigene, mobile-taugliche Texte gleicher Sprachhygiene).

Migration bestehender Web-Module in `packages/shared` erfolgt schrittweise und nur mit unveränderten Tests (zuerst: Kopie-frei per Re-Export aus dem Paket, Website importiert weiter über ihre bisherigen Pfade).

## Teststrategie

- Unit-/Komponententests der App: Jest + `@testing-library/react-native` (`pnpm mobile:test`).
- Geteilte Logik: bestehende Vitest-Tests laufen weiter im Root; neue Tests für `packages/shared` dort, wo die Logik liegt.
- Kritische Zugriffsregeln werden NIE gegen Mocks „bewiesen“: RLS-/RPC-Verhalten prüft weiterhin `pnpm test:rls` gegen die lokale Supabase; mobile Integrationsproben nutzen dieselbe lokale Instanz.
- Mindestens ein vollständiger Patientenablauf (Login → Heute → Übung dokumentieren → Termin ansehen) gegen die lokale Supabase.
