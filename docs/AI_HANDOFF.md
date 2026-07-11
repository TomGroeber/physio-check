# PhysioCheck – AI Handoff

> Stand: 2026-07-11 · Arbeitszweig: `main` · letzter bestehender Commit vor Phase D: `9acc17e`

## Produkt und Stack

PhysioCheck verbindet Physiotherapiepraxen mit Patienten: Praxiscode, Heimübungen als Selbstauskunft, Termine und später Verordnungen sowie interne Patientenakten. Stack: Next.js 16, React 19, TypeScript strict, Tailwind, shadcn/ui, Supabase Auth/PostgreSQL/Storage/RLS, pnpm, Vitest und Playwright.

## Fertig

- Phase C: freie Registrierung, unverbundenes Konto auf `/connect` beschränkt, sichere einmalige Codes und Praxiswechsel.
- Phase C: Übungsdetail und Dokumentation mit Status, Sätzen, Schmerz, Notiz und Snapshot; Praxisansicht 7/30 Tage.
- Phase D: `/practice/calendar` mit Monat/Woche/Tag/Liste und Filtern.
- Phase D: Termin anlegen, bearbeiten, stornieren und abschließen.
- Phase D: PostgreSQL-Konfliktschutz für überlappende aktive Termine desselben Therapeuten.
- Phase D: Patient kann Absage anfragen; Praxis erhält datensparsame Notifications.
- Phase D: Praxisstornierung erzeugt Patient-Notification.
- Fix: Praxis-Patientenrouten prüfen Session/Mitgliedschaft selbst und dereferenzieren keine Null-Session.

## Neueste Migration

`supabase/migrations/20260711200000_appointment_lifecycle.sql`

Sie ergänzt `cancelled_at`, `cancelled_by_profile_id`, `cancellation_reason`, `completed_at`, den GiST-Konflikt-Constraint und `request_appointment_cancellation(...)`.

## Prüfstand

- `pnpm typecheck`: grün
- `pnpm lint`: grün
- `pnpm test`: 40 Tests, grün
- `pnpm build`: grün
- `pnpm db:reset`, `pnpm seed`, `pnpm e2e`: in dieser Umgebung nicht möglich (Docker/Supabase fehlen); auf Toms Mac ausführen.

## Offene Punkte in Priorität

1. Lokal Migration/Seed/E2E prüfen und gefundene SQL-/Ablauffehler beheben.
2. Praxisentscheidung für Absageanfragen (annehmen/ablehnen) fertigstellen.
3. Phase E: `treatment_authorizations`, Usage-/Adjustment-Historie und Patientenanzeige verbleibender Sitzungen.
4. Phase F: privater Bucket `patient-records`, Metadaten, Upload/Preview/Download und RLS.
5. Übungs-/Videoverwaltung und Plan-Zuweisung per UI.
6. Dedizierte Cross-Practice-RLS-Tests.

## Relevante Dateien

- Kalender: `src/app/(practice)/practice/calendar/`
- Kalenderlogik: `src/lib/calendar.ts`
- Termin-Services/-Actions: `src/server/services/appointments.ts`, `src/server/actions/appointments.ts`
- Terminvalidierung: `src/lib/validation/appointments.ts`
- Patient-Absage: `src/components/patient/cancellation-request-form.tsx`
- Migration: `supabase/migrations/20260711200000_appointment_lifecycle.sql`
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

Noch kein Remote vorhanden (`git remote -v` war leer). Vor einem Push `.gitignore`, `git status` und staged Diff auf Secrets prüfen. Repository privat anlegen; `.env.local`, lokale Supabase-Daten und Patientendaten niemals pushen.

## Nächster konkreter Auftrag

Zuerst Phase-D-Migration und Kalender end-to-end auf Toms lokaler Supabase-Instanz prüfen. Danach Absageentscheidung abschließen und Phase E (verordnete/verbleibende Sitzungen mit nachvollziehbaren Anpassungen) implementieren.
