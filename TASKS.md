# PhysioCheck – Aufgaben

> Status: `[ ]` offen · `[~]` in Arbeit · `[x]` erledigt. Jede Aufgabe hat eine Definition of Done (DoD). Aktualisierung nach jeder Etappe.

## Phase 0 – Bestand und Planung

- [x] Projektverzeichnis, Git-Status, Laufzeitversionen geprüft (Node v22.12.0 ✓, pnpm ✗, Supabase CLI ✗)
- [x] Aktuelle Doku/Versionen geprüft: Next.js 16, Tailwind v4, shadcn/ui (Tailwind-v4-kompatibel), `@supabase/ssr`
- [x] `docs/PRODUCT_SPEC.md` erstellt
- [x] `docs/ARCHITECTURE.md` erstellt
- [x] `docs/DATA_MODEL.md` erstellt (ER-Diagramm + Begründungen)
- [x] `TASKS.md`, `DECISIONS.md`, `CLAUDE.md` erstellt
- [x] Kompakte Zusammenfassung + Blocker an Tom präsentiert

## Phase 1 – Lauffähiges Grundgerüst ✅ (2026-07-11)

- [x] Werkzeuge installiert: Node 22.23.1 (nvm), pnpm 11.11.0, Supabase CLI 2.109.1; Docker läuft
- [x] Next.js 16.2.10 mit TypeScript strict, Tailwind v4, ESLint, Vitest, Playwright; Versionen im README gepinnt
      DoD erfüllt: `pnpm typecheck`, `lint`, `test` (12 Tests), `build`, `e2e` (18 Tests) grün.
- [x] Design-Tokens (`globals.css`, kommentiert) + `src/config/branding.ts`; Schrift Atkinson Hyperlegible
- [x] Zentrales Text-Modul `src/messages/de.ts`
- [x] Migration `20260711100000_initial_schema.sql`: alle 16 Tabellen, RLS-Policies, Grants, privater Storage-Bucket
      DoD erfüllt: `supabase db reset` fehlerfrei; RLS auf jeder Tabelle aktiv.
- [x] Auth mit `@supabase/ssr`: Registrierung, Login, E-Mail-Bestätigung (Mailpit), Passwort vergessen/zurücksetzen, Proxy (Session-Refresh)
- [x] Rollenabhängige Weiterleitung + Layouts: `(auth)`, `(patient)` mit unterer 3-Punkte-Navigation, `(practice)` mit Navy-Seitenleiste; Fehler-/Lade-/Leerzustände
- [x] Demo-Seeds (`pnpm seed`): fiktive Praxis, Therapeutin, Admin, Patientin, 3 Übungen, Plan v1, Termine, 2 Protokolle
- [x] `.env.example`, README (deutsch), `docs/PRIVACY_SECURITY.md` (Erstfassung), `docs/ROADMAP.md`, PWA-Manifest

**Aus Phase 1 verschoben:** Übungs-/Video-Verwaltung und dedizierte vollständige RLS-Testsuite. Die Code-Einlösung wurde in Phase B umgesetzt.

## Phase A – Bestandsanalyse ✅ (2026-07-11)

- [x] Dokumentation, Schema, Auth, Rollen, Patienten-, Termin- und Übungslogik geprüft
- [x] Bestehende Tests und Build-Konfiguration geprüft
- [x] Sichere Migrationsstrategie ohne zweite App festgelegt

## Phase B – Einladung, Registrierung und Praxiswechsel ✅ (2026-07-11)

- [x] Öffentliche Startseite mit Einladungscode- und Login-Einstieg
- [x] Registrierung nur nach serverseitig geprüfter Einladung
- [x] Kurzlebige, signierte HttpOnly-Einladungssitzung
- [x] Persistentes Rate Limiting ohne IP-Adresse/User-Agent im Klartext
- [x] Therapeut erstellt, widerruft und erneuert Einladungscodes
- [x] Erneuerung invalidiert den alten Code atomar
- [x] Einlösung erfolgt atomar per PostgreSQL-Funktion
- [x] Praxiswechsel: genau eine aktive Praxis, alte Verbindung bleibt als Historie
- [x] Einladungshash ist für normale Praxisnutzer nicht lesbar
- [x] Demo-Einladung und manuelle Testanleitung ergänzt
- [x] Typecheck, Lint, Unit-/Komponententests (16) und Production Build grün
- [ ] Migration und E2E lokal mit Docker/Supabase ausführen

## Phase C – Übungen und dokumentierte Durchführung

- [ ] Übung anlegen (Formular + Video-Upload in privaten Bucket, Validierung, signierte URLs)
- [ ] Plan zuweisen (Version 1) – Auswahl aus Bibliothek, Konfiguration pro Patient
- [ ] Patienten-Startseite „Heute" mit Übungsliste und Fortschritt
- [ ] Übung durchführen: Video, Vorgaben, Timer, erledigt/zu schwierig, Schmerzskala, Notiz, Snapshot
- [ ] Therapeutenansicht: dokumentierte Einträge als Selbstauskunft
- [ ] RLS-/Autorisierungstests: Fremdzugriff Patient↔Patient und Praxis↔Praxis wird verhindert
- [ ] E2E-Test des gesamten Kernablaufs

## Phase D – Termine, Absagen und neue Terminvorschläge

- [ ] Terminverwaltung Therapeut (anlegen, ändern, stornieren, abschließen)
- [ ] Nächster Termin auf Patienten-Startseite + Karten-Link
- [ ] Absageanfrage Patient (mit Aufklärungstext) → Bearbeitung Therapeut → konsistenter Status beidseitig
- [ ] Patient kann nach Absage einen neuen Termin anfragen
- [ ] Therapeut sendet mehrere Terminvorschläge; Patient bestätigt einen Vorschlag
- [ ] Zeitzonen-/Sommerzeit-Tests

## Phase E – Benachrichtigungen

- [ ] Zentrale Notification-Services und In-App-Oberfläche
- [ ] Gegenseitige Benachrichtigungen bei Absagen, Anfragen und Vorschlägen
- [ ] gelesen/ungelesen, datensparsame Inhalte, relevante Tests

## Phase F – Patientenakten

- [ ] Privater Dokument-Storage pro Praxis und Patient
- [ ] Upload, Download, Dokumentübersicht und Löschung mit Bestätigung
- [ ] Strikte Mandantentrennung, Audit-Log und Zugriffstests

## Phase G – Härtung und Bedienbarkeit

- [ ] Barrierefreiheit: Tastatur, Fokus, Kontraste, Screenreader-Labels, große Schrift (WCAG 2.2 AA, Kernansichten geprüft)
- [ ] Fehler-, Lade- und Leerzustände aller datenabhängigen Seiten
- [ ] Security-Review: CSP, Upload-Härtung, Rate Limits, Audit-Events vollständig
- [ ] Videoverwaltung komplett (Vorschaubild, Untertitel, Alternativbild, Formate/Größen konfigurierbar)
- [ ] Plan-Versionierung UI (Änderungshistorie nachvollziehbar)
- [ ] `docs/CUSTOMIZATION_GUIDE.md` (Deutsch, für Nicht-Programmierer)
- [ ] Pilot-Checkliste in `docs/PRIVACY_SECURITY.md` finalisieren
- [ ] Production Build + kritische E2E-Tests grün
