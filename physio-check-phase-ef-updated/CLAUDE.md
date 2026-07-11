# CLAUDE.md – PhysioCheck

Verbindliche Projektregeln. Der Masterprompt (Produkt- und Arbeitsgrundlage) ist in `docs/PRODUCT_SPEC.md` konkretisiert; bei Widerspruch gilt: Masterprompt > diese Datei > Defaults.

## Projekt

App für Physiotherapiepraxen (Therapeuten-Dashboard) und Patienten (Heimübungspläne mit Videos, Termine, Adhärenz-Dokumentation). Vorläufiger Name **PhysioCheck** – Name/Logo/Farben liegen zentral in `src/config/branding.ts` und Design-Tokens; niemals hartkodieren.

**Aktueller Stand:** Phase E/F ist implementiert (2026-07-11): Zusätzlich zum interaktiven Kalender gibt es Verordnungen/verbleibende Sitzungen mit Adjustment-/Usage-Historie und private Patientenakten mit sicherem PDF/JPEG/PNG-Upload. Neueste Migration: `20260711230000_authorizations_and_patient_documents.sql`. DB-/Storage-Abläufe und E2E müssen auf Toms Mac mit Docker/Supabase verifiziert werden. Remote `origin` ist `TomGroeber/physio-check`. Details und nächster Auftrag: `docs/AI_HANDOFF.md`.

## Kommunikation

- Erklärungen für Tom auf **Deutsch** (wenig Programmiererfahrung, Fachbegriffe knapp erklären).
- Code, Dateinamen, DB-Felder, Commits auf **Englisch**.
- Kleine, überprüfbare Etappen; nach jeder Etappe `TASKS.md` aktualisieren, Prüfungen ausführen, kurzen manuellen Testweg nennen.
- Probleme (technisch, widersprüchlich, datenschutzrechtlich) direkt benennen statt blind umsetzen.

## Stack (Entscheidungen in DECISIONS.md, Details in docs/ARCHITECTURE.md)

Next.js 16 (App Router, TS strict) · Tailwind v4 · shadcn/ui · Supabase (`@supabase/ssr`) · Zod · React Hook Form · Vitest/Testing Library · Playwright · pnpm.

## Harte Regeln

1. **Sprachhygiene:** Dokumentierte Übungen sind Selbstauskunft („erledigt", „dokumentiert", „Adhärenz") – nie „verifiziert"/„bewiesen"/„kontrolliert". Keine Diagnosen, keine automatischen Therapieentscheidungen.
2. **Sicherheit:** Autorisierung serverseitig + RLS auf jeder patientenbezogenen Tabelle. Kein Service-Role-Key im Browser. Keine Secrets im Repo. Einladungscodes nur als Hash speichern. Videos nur über kurzlebige signierte URLs aus privatem Storage.
3. **Rollen:** Privilegien nur über `practice_members` (serverseitig geschrieben). Kein Frontend-Weg zur Selbst-Eskalation.
4. **Datenschutz:** Datenminimierung; keine Gesundheitsdaten in Logs, Audit-Metadaten, Push-Vorschauen oder Betreffzeilen. Niemals echte Patientendaten in Entwicklung/Tests.
5. **Kapselung:** UI → Server Actions/Route Handler (Zod) → `src/server/services` → `src/server/db` (einziger Supabase-Zugriffspunkt).
6. **Zeit:** `timestamptz` (UTC) + IANA-Zeitzone; Formatierung nur über `src/lib/datetime.ts`.
7. **Planintegrität:** Pläne versioniert; Protokolle mit `prescription_snapshot` – nie rückwirkend verfälschen.
8. **Qualität:** kein `any` ohne Not, keine Platzhalter, die Erfolg vortäuschen; Fehler-/Lade-/Leerzustände für jede datenabhängige Seite; Fehler offen melden, Prüfungen nie abschalten.
9. **UX Patient:** mobile-first, Deutsch, Touch-Ziele ≥ 48 px, Text ≥ 18 px, WCAG 2.2 AA, max. 3 Navigationsbereiche (Heute/Termine/Profil). Alle UI-Texte über `src/messages/de.ts`.
10. **Git/Extern:** Commits nur mit Toms Erlaubnis. Keine Deployments, externen Registrierungen, Veröffentlichungen oder produktiven DB-Änderungen ohne ausdrückliche Zustimmung.

## Befehle (ab Phase 1, nach Projekterstellung)

`pnpm dev` · `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm build` · `pnpm e2e` · `supabase db reset` (Migrationen + Seeds). Nach jeder Etappe mindestens Typecheck, Lint und relevante Tests; vor Meilensteinen zusätzlich Build + kritische E2E.

## Dokumente

`docs/PRODUCT_SPEC.md` (Umfang + Akzeptanz) · `docs/ARCHITECTURE.md` · `docs/DATA_MODEL.md` · `docs/PRIVACY_SECURITY.md` (ab Phase 1) · `docs/CUSTOMIZATION_GUIDE.md` (Phase 4, Deutsch, für Nicht-Programmierer) · `docs/ROADMAP.md` · `TASKS.md` · `DECISIONS.md`.
