# CLAUDE.md – PhysioCheck

Verbindliche Projektregeln. Der Masterprompt (Produkt- und Arbeitsgrundlage) ist in `docs/PRODUCT_SPEC.md` konkretisiert; bei Widerspruch gilt: Masterprompt > diese Datei > Defaults.

## Projekt

App für Physiotherapiepraxen (Therapeuten-Dashboard) und Patienten (Heimübungspläne mit Videos, Termine, Adhärenz-Dokumentation). Vorläufiger Name **PhysioCheck** – Name/Logo/Farben liegen zentral in `src/config/branding.ts` und Design-Tokens; niemals hartkodieren.

**Aktueller Stand:** Web- und native Patientenoberfläche stehen in UI-Parität (Auftrag 19.–20.07.2026, in `main` gemergt). Branch `claude/platform-admin-20260725` ergänzt ein strikt getrenntes Betreiberportal (`platform_admin`-Rolle, nie eine Praxisrolle), ein Liquid-Glass-Design für Portal/Praxis-Einstellungen/Nachrichten sowie eine vollständige Nachrichtenfunktion Patient:in ↔ Praxis (Web + nativ). Typecheck, Lint, 115 Unit-Tests, 125 RLS-Proben und die volle Playwright-Suite sind lokal grün; Details/Testmatrix: `docs/TEST_MATRIX.md`, `docs/AI_HANDOFF.md`. Remote `origin` ist `TomGroeber/physio-check` (öffentlich, keine Secrets oder echten Patientendaten). `pnpm docs:sync` synchronisiert die Projektdoku auf Toms Mac.

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
9. **UX Patient:** mobile-first, Deutsch, Touch-Ziele ≥ 48 px, Text ≥ 18 px, WCAG 2.2 AA, max. 4 Navigationsbereiche (Heute/Termine/Nachrichten/Profil – seit 26.07.2026 auf ausdrücklichen Auftrag hin von 3 auf 4 erweitert, Nachrichtenfunktion). Alle UI-Texte über `src/messages/de.ts`.
10. **Git/Extern:** Commits nur mit Toms Erlaubnis. Keine Deployments, externen Registrierungen, Veröffentlichungen oder produktiven DB-Änderungen ohne ausdrückliche Zustimmung.

## Befehle (ab Phase 1, nach Projekterstellung)

`pnpm dev` · `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm build` · `pnpm e2e` · `supabase db reset` (Migrationen + Seeds). Nach jeder Etappe mindestens Typecheck, Lint und relevante Tests; vor Meilensteinen zusätzlich Build + kritische E2E.

## Dokumente

`docs/PRODUCT_SPEC.md` (Umfang + Akzeptanz) · `docs/ARCHITECTURE.md` · `docs/DATA_MODEL.md` · `docs/PRIVACY_SECURITY.md` (ab Phase 1) · `docs/CUSTOMIZATION_GUIDE.md` (Phase 4, Deutsch, für Nicht-Programmierer) · `docs/PLATFORM_ADMIN_GUIDE.md` (Betreiberportal: was global/praxisweit konfigurierbar ist und was nie per UI editierbar sein darf) · `docs/ROADMAP.md` · `TASKS.md` · `DECISIONS.md`.
