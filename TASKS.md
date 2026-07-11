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
- [x] Migration und E2E lokal mit Docker/Supabase ausführen (2026-07-11, Phase C)

## Phase C – Registrierung korrigiert + dokumentierte Durchführung ✅ (2026-07-11)

- [x] Registrierung ohne Einladung (Name, E-Mail, Passwort); erzeugt nur ein unverbundenes Patientenkonto, nie eine Praxisrolle
- [x] Unverbundene Konten sehen nur `/connect` (Codeeingabe, Basiskonto, Abmelden, Hinweis); `/today`, `/practice` usw. leiten um
- [x] `/connect` als geschützter Verbindungsbereich: Code prüfen → Praxis bestätigen → atomare Einlösung; Praxiswechsel mit Warnhinweis
- [x] Einladungslink-Ablauf (`/invite` → `/invite/continue`) für Besucher erhalten; Einladungssicherheit unverändert (Hash, 7 Tage, einmalig, Widerruf/Erneuerung, Rate Limit, Audit)
- [x] Keine Schemaänderung für die Registrierung nötig (reine Anwendungslogik, dokumentiert in D-018)
- [x] Übungsdetailseite Patient: Video (kurzlebige signierte URL nach Autorisierungsprüfung), Vorgaben, Schritte, Hinweise
- [x] Dokumentation als Selbstauskunft: erledigt/teilweise/zu schwierig/nicht möglich, optional Sätze, Schmerz 0–10 vorher/nachher, Notiz
- [x] `prescription_snapshot` friert Vorgaben zum Zeitpunkt der Durchführung ein; nur eigene Items des aktuellen aktiven Plans dokumentierbar
- [x] Doppelte Tagesdokumentation verhindert; nach Speichern „Heute dokumentiert“ und aktualisierter Fortschritt
- [x] Neutraler Schmerzhinweis bei hohen/steigenden Werten (keine Diagnose)
- [x] Patientendetailseite Praxis (`/practice/patients/[patientId]`): nächster Termin, aktueller Plan, Selbstauskünfte der letzten 7/30 Tage mit Hinweis
- [x] Migration `20260711170000`: Praxis liest nur Protokolle aus Plänen der EIGENEN Praxis (Mandantentrennung nach Praxiswechsel)
- [x] Unit-Tests (32) für Planlogik und Validierung; serieller E2E-Kernablauf inkl. E-Mail-Bestätigung über Mailpit
- [ ] Übung anlegen/bearbeiten mit Video-Upload in privaten Bucket (Medienverwaltung) – nächster Schritt vor/neben Phase D
- [ ] Plan zuweisen über die Oberfläche (Version 1 + Änderungen als neue Version)
- [ ] Dedizierte RLS-Testsuite (Fremdzugriff Patient↔Patient, Praxis↔Praxis) als eigene Testdatei

## Phase D – Vollständig nutzbarer Praxiskalender

- [ ] `/practice/calendar` mit Monats-, Wochen- und Tagesansicht (kompatibel mit Next 16/React 19, wenige Abhängigkeiten)
- [ ] Termin anlegen (Datum/Zeitfenster wählen), öffnen, ändern (Zeit, Dauer, Therapeut, Standort)
- [ ] Stornieren mit Bestätigung + optionalem neutralem Grund (`cancelled_at`, `cancelled_by`, Historie bleibt)
- [ ] Als abgeschlossen markieren; Filter Therapeut/Patient/Standort/Status
- [ ] Serverseitige Konfliktprüfung pro Therapeut; Zod-Validierung aller Schreibwege
- [ ] Zeitzone Europe/Luxembourg inkl. Sommer-/Winterzeit-Tests; Tastaturbedienung + Listenalternative
- [ ] Notifications: Patient bei Stornierung, Praxis bei Absageanfrage, Patient bei Entscheidung (ohne Gesundheitsdaten)

## Phase E – Verordnete und verbleibende Sitzungen

- [ ] Tabellen `treatment_authorizations` + `appointment_authorization_usages` (verbleibend = verordnet − gültige Nutzungen, kein driftender Zähler)
- [ ] Nur Therapeut rechnet abgeschlossene Termine an; nie automatisch
- [ ] Patientenansicht „Noch X von Y Sitzungen“ + neutraler Kostenhinweis (keine Kassen-Garantie)
- [ ] Therapeutenansicht: Verordnungen anlegen/bearbeiten/archivieren, Zuordnung korrigieren, Historie/Audit

## Phase F – Private Patientenakten

- [ ] Privater Bucket `patient-records`; Pfad aus serverseitig verifizierten IDs; zufällige Dateinamen
- [ ] Upload (PDF/JPEG/PNG, Größenlimit, Signaturprüfung), Ansicht, Download über kurzlebige signierte URLs
- [ ] Kategorien, Dokumentdatum, Notiz, Filter; Archivieren/Löschen mit Bestätigung
- [ ] Strikte Mandantentrennung (RLS + Service + Tests); Audit; Virenscan vor Pilotbetrieb dokumentieren

## Phase G – Notifications, Terminvorschläge, Härtung und Bedienbarkeit

- [ ] In-App-Benachrichtigungszentrum: gelesen/ungelesen, Badge, Zielroute, datensparsame Inhalte
- [ ] Terminanfrage nach Absage: mehrere Vorschläge, Patient bestätigt genau einen (atomar, mit Konfliktprüfung)

- [ ] Barrierefreiheit: Tastatur, Fokus, Kontraste, Screenreader-Labels, große Schrift (WCAG 2.2 AA, Kernansichten geprüft)
- [ ] Fehler-, Lade- und Leerzustände aller datenabhängigen Seiten
- [ ] Security-Review: CSP, Upload-Härtung, Rate Limits, Audit-Events vollständig
- [ ] Videoverwaltung komplett (Vorschaubild, Untertitel, Alternativbild, Formate/Größen konfigurierbar)
- [ ] Plan-Versionierung UI (Änderungshistorie nachvollziehbar)
- [ ] `docs/CUSTOMIZATION_GUIDE.md` (Deutsch, für Nicht-Programmierer)
- [ ] Pilot-Checkliste in `docs/PRIVACY_SECURITY.md` finalisieren
- [ ] Production Build + kritische E2E-Tests grün
