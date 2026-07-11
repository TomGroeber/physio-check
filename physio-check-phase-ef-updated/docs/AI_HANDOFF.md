# PhysioCheck – AI Handoff

> Stand: 2026-07-11 · Arbeitszweig: `main` · GitHub-Remote: `TomGroeber/physio-check`

## Produkt und Stack

PhysioCheck verbindet Physiotherapiepraxen mit Patienten: Praxiscode, Heimübungen als Selbstauskunft, Termine, Verordnungen und interne Patientenakten. Stack: Next.js 16, React 19, TypeScript strict, Tailwind, shadcn/ui, Supabase Auth/PostgreSQL/Storage/RLS, pnpm, Vitest und Playwright.

## Fertig

- Phase C: freie Registrierung, unverbundenes Konto auf `/connect` beschränkt, sichere einmalige Codes und Praxiswechsel.
- Phase C: Übungsdetail und Dokumentation mit Status, Sätzen, Schmerz, Notiz und Snapshot; Praxisansicht 7/30 Tage.
- Phase D: `/practice/calendar` mit Monat/Woche/Tag/Liste und Filtern.
- Phase D: Termin anlegen, bearbeiten, stornieren und abschließen.
- Phase D: PostgreSQL-Konfliktschutz für überlappende aktive Termine desselben Therapeuten.
- Phase D: Patient kann Absage anfragen; Praxis erhält datensparsame Notifications.
- Phase D: Praxisstornierung erzeugt Patient-Notification.
- Fix: Praxis-Patientenrouten prüfen Session/Mitgliedschaft selbst und dereferenzieren keine Null-Session.
- Phase E: Verordnungen mit Grundwert, Adjustment-Historie, terminbezogener Usage und Patientenanzeige.
- Phase E: Abschluss eines Termins und Anrechnung einer verfügbaren Sitzung laufen atomar in PostgreSQL.
- Phase F: interne PDF/JPEG/PNG-Dokumente pro Patient, privater Bucket, Signatur-/Größenprüfung, signierte URL und Audit.

## Neueste Migration

`supabase/migrations/20260711230000_authorizations_and_patient_documents.sql`

Sie ergänzt Verordnungen, Anpassungen, Termin-Anrechnungen, private Dokumentmetadaten, RLS/RPCs und den privaten Bucket `patient-records`.

## Prüfstand

- `pnpm typecheck`: grün
- `pnpm lint`: grün
- `pnpm test`: 40 Tests, grün
- `pnpm build`: grün
- `pnpm db:reset`, `pnpm seed`, `pnpm e2e`: in dieser Umgebung nicht möglich (Docker/Supabase fehlen); auf Toms Mac ausführen.

## Offene Punkte in Priorität

1. Lokal Migration/Seed/E2E prüfen und gefundene SQL-/Ablauffehler beheben.
2. Praxisentscheidung für Absageanfragen (annehmen/ablehnen) fertigstellen.
3. Dedizierte Cross-Practice-RLS- und Storage-Tests ergänzen.
4. Vor Pilotbetrieb Virenscan/Quarantäne für Uploads integrieren; aktuell nur Dateityp, Signatur und Größe geprüft.
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
- Sitzungen: `src/server/actions/authorizations.ts`, `src/server/services/authorizations.ts`
- Dokumente: `src/server/actions/documents.ts`, `src/server/services/documents.ts`
- Neueste Migration: `supabase/migrations/20260711230000_authorizations_and_patient_documents.sql`

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

Remote `origin` ist `https://github.com/TomGroeber/physio-check.git`. Vor jedem Push Status und Diff auf Secrets prüfen; `.env.local`, lokale Supabase-Daten und Patientendaten niemals pushen.

## Nächster konkreter Auftrag

Zuerst die neueste Migration, Seed, Dokument-Upload und Termin-Anrechnung auf Toms lokaler Supabase-Instanz prüfen. Danach Cross-Practice-RLS-Tests und die Praxisentscheidung für Absageanfragen ergänzen.
