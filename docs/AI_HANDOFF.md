# PhysioCheck – AI Handoff

> Stand: 2026-07-12 · Arbeitszweig: `main` · GitHub-Remote: `TomGroeber/physio-check` (**privat**)

## Produkt und Stack

PhysioCheck verbindet Physiotherapiepraxen mit Patienten: Praxiscode, Heimübungen als Selbstauskunft, Termine, Verordnungen und interne Patientenakten. Stack: Next.js 16, React 19, TypeScript strict, Tailwind, shadcn/ui, Supabase Auth/PostgreSQL/Storage/RLS, pnpm, Vitest und Playwright.

## Wichtig: Konsolidierung am 2026-07-11

Die Phase-E/F-Implementierung lag zuvor als kompletter Parallelordner `physio-check-phase-ef-updated/` im Repo (Commit `40a1b02`). Sie wurde in den Projektstamm übernommen, der Ordner gelöscht (D-030). Dabei wurde die bis dahin **nie ausgeführte** Migration `20260711230000_authorizations_and_patient_documents.sql` repariert: `authorization` ist ein reserviertes PostgreSQL-Schlüsselwort und wurde als Tabellen-Alias durch `auth_rec` ersetzt. Außerdem war das GitHub-Repo versehentlich öffentlich und ist jetzt privat (D-031).

## Fertig (und am 2026-07-11 lokal verifiziert)

- Phase C: freie Registrierung, unverbundenes Konto auf `/connect` beschränkt, sichere einmalige Codes und Praxiswechsel. *(E2E grün)*
- Phase C: Übungsdetail und Dokumentation mit Status, Sätzen, Schmerz, Notiz und Snapshot; Praxisansicht 7/30 Tage. *(E2E grün)*
- Phase D: `/practice/calendar` mit Monat/Woche/Tag/Liste und Filtern; Termin anlegen/bearbeiten/stornieren/abschließen; GiST-Konfliktschutz; Absageanfrage + Notifications. *(Migration und Abschluss-Aktion lokal geprüft; kein E2E für Anlegen/Bearbeiten/Stornieren)*
- Phase E: Verordnungen (integer-Sitzungen), Adjustment-Historie mit Pflichtgrund, terminbezogene Usage (`appointment_id unique` = keine Doppelanrechnung), Patientenanzeige mit neutralem Kostenhinweis. *(UI-Durchlauf: anlegen 9 → −2 mit Grund → Terminabschluss rechnet genau 1 an → Patient sieht Stand)*
- Phase F: interne PDF/JPEG/PNG-Dokumente pro Patient, privater Bucket `patient-records`, Signatur-/Größenprüfung, kurzlebige signierte URL, Audit. *(UI-Durchlauf: PNG-Upload, Öffnen über signierte URL 200; Patient auf Dokumentroute/Praxisseite → Redirect, kein Zugriff)*
- Etappe 2: `profiles.phone` (Patient pflegt selbst; Praxis korrigiert via SECURITY-DEFINER `set_patient_phone`; Anzeige in Liste/Detail als tel-Link) und `practice_members.calendar_color` (8er-Palette, Spaltenrecht nur für die Farbspalte, Auswahl in den Einstellungen, Kalender mit Farbpunkt/-rand + Legende). Migration `20260711260000_phone_and_calendar_colors.sql`. *(UI-Durchlauf + API-Proben: Patient kann RPC nicht aufrufen, Mitglied kann Rolle nicht ändern, Patient kann fremde Profile nicht ändern)*
- Etappe 3: Behandlungskontingente strikt ganzzahlig mit append-only Ledger. `appointment_authorization_usages` bekommt `reversed_at`/`reversed_by` (nie löschen, nur markieren), `sessions_used = 1` erzwungen, partieller Unique-Index `appointment_usages_active_appointment_key` (höchstens eine aktive Anrechnung pro Termin, nach Rücknahme erneut anrechenbar). Neue DB-Funktionen: `reverse_appointment_completion` (Termin → „geplant", bucht genau 1 Einheit zurück; 23P01 bei inzwischen belegtem Zeitraum wird in der Action abgefangen) und `primary_authorization_for_patient` (gemeinsame Auswahlregel für Patientenanzeige und Anrechnung – Phase-E-Inkonsistenz behoben). `authorization_remaining` ignoriert stornierte Anrechnungen, nie negativ; manuelle Verringerung unter 0 lehnt der Server ab. UI: Ledger-Historie auf der Patientendetailseite (`src/lib/authorization-ledger.ts` + Tests), Formular „Abschluss zurücknehmen", gelbe Warnung beim Abschluss mit 0 Einheiten (`FormMessage` hat jetzt `warning`). Migration `20260711280000_unit_ledger_and_completion_reversal.sql`; ersetzt die nie genutzte Funktion `remove_appointment_authorization_usage`. *(17-Schritte-UI-Durchlauf inkl. Negativ-Proben: Patient darf `reverse_appointment_completion` nicht aufrufen, kein Doppelabschluss, fremde Verordnungsauswahl abgelehnt)*

## Prüfstand (alles am 2026-07-12 auf Toms Mac ausgeführt)

- `pnpm db:reset`: grün (alle 7 Migrationen)
- `pnpm seed`: grün
- `pnpm typecheck`, `pnpm lint`: grün
- `pnpm test`: 55 Tests grün (inkl. 5 neue Ledger-Tests)
- `pnpm e2e`: 28 bestanden, 6 planmäßig übersprungen (Kernablauf läuft nur auf Chromium)
- `pnpm build`: grün
- 17-Schritte-UI-Durchlauf Etappe 3 (Playwright-Skript, Screenshots): Abschluss rechnet genau 1 Einheit an, Rücknahme bucht genau 1 zurück, Ledger-Historie vollständig, 0-Warnung, Anpassung unter 0 abgelehnt, Patientensicht konsistent, RPC-Negativ-Proben bestanden

## Bekannte Probleme / offene Punkte in Priorität

1. Verbindlicher Etappenplan in `TASKS.md`: Etappe 4 Verordnungswarnungen (Patientendetail, Dashboard, Filter, datensparsame Notifications) → … → Etappe 9 Obsidian-Sync (wartet auf Vault-Pfad von Tom).
2. Praxisentscheidung für Absageanfragen (annehmen/ablehnen) fehlt.
3. Dedizierte Cross-Practice-/Patient-RLS- und Storage-Tests (Etappe 10).
4. Virenscan/Quarantäne für Uploads vor Pilotbetrieb; aktuell nur Dateityp, Signatur und Größe.
5. Übungs-/Videoverwaltung und Plan-Zuweisung per UI.
6. Kleinere UX-Beobachtung: Erfolgsmeldungen von „Abschließen“/„Zurücknehmen“ sind nach dem Neu-Rendern der Seite nicht sichtbar (das Formular wird durch den neuen Zustand ersetzt); der Zustandswechsel selbst (Badge, Formularwechsel) ist die Rückmeldung.

## Relevante Dateien

- Kalender: `src/app/(practice)/practice/calendar/` · Logik `src/lib/calendar.ts`
- Termine: `src/server/services/appointments.ts`, `src/server/actions/appointments.ts`, `src/lib/validation/appointments.ts`
- Sitzungen/Einheiten: `src/server/actions/authorizations.ts`, `src/server/services/authorizations.ts`, `src/components/practice/authorization-panel.tsx`, `src/lib/authorization-ledger.ts`, `src/components/practice/reverse-completion-form.tsx`
- Dokumente: `src/server/actions/documents.ts`, `src/server/services/documents.ts`, `src/components/practice/document-panel.tsx`, Route `src/app/(practice)/practice/patients/[patientId]/documents/[documentId]/route.ts`
- Telefon/Farben: `src/server/actions/profile.ts`, `src/server/services/profile.ts`, `src/lib/calendar-colors.ts`, `src/lib/validation/profile.ts`
- Neueste Migration: `supabase/migrations/20260711280000_unit_ledger_and_completion_reversal.sql`
- UI-Texte: `src/messages/de.ts`

## Lokaler Start

```bash
cd ~/physio-check
supabase start
pnpm db:reset
pnpm seed
pnpm dev
```

Demo-Logins stehen im README. Keine echten Patientendaten verwenden.

## GitHub

Remote `origin` ist `https://github.com/TomGroeber/physio-check.git` (privat). Vor jedem Push Status und Diff auf Secrets prüfen; `.env.local`, lokale Supabase-Daten und Patientendaten niemals pushen.

## Nächster konkreter Auftrag

Etappe 4 aus `TASKS.md`: Verordnungswarnungen – Hinweis auf der Patientendetailseite und im Praxis-Dashboard bei wenigen verbleibenden Einheiten bzw. nahendem/überschrittenem Gültigkeitsende, Filter in der Patientenliste, datensparsame Notifications (keine Gesundheitsdaten in Inhalten). Schwellenwerte als Produktentscheidung mit Tom klären.
