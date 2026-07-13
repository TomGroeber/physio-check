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

- [x] `/practice/calendar` mit Monats-, Wochen-, Tages- und Listenansicht ohne zusätzliche Kalenderabhängigkeit
- [x] Termin anlegen, öffnen und ändern (Zeit, Dauer, Therapeut, Standort)
- [x] Stornieren mit optionalem neutralem Grund (`cancelled_at`, Ausführender, Historie bleibt)
- [x] Als abgeschlossen markieren; Filter Therapeut/Patient/Status
- [x] Serverseitige Zugehörigkeitsprüfung, Zod-Validierung und atomarer DB-Konfliktschutz pro Therapeut
- [x] Europe/Luxembourg inkl. Sommer-/Winterzeit-Unit-Tests; Tastaturpfade + Listenalternative
- [x] Patient bei Praxis-Stornierung benachrichtigen; Praxis bei Patienten-Absageanfrage benachrichtigen
- [x] Null-Session-Absturz der Patientenliste durch lokale Route-Prüfung behoben
- [x] Typecheck, Lint, 40 Unit-/Komponententests und Production Build grün
- [x] Migration, Seed und E2E lokal mit Docker/Supabase ausführen (2026-07-11: 28 E2E grün)
- [ ] Entscheidung über Absageanfrage (annehmen/ablehnen) als eigene Praxisaktion vervollständigen

## Phase E – Verordnete und verbleibende Sitzungen

- [x] Tabellen für Verordnung, Adjustment-Historie und terminbezogene Nutzung (kein driftender Zähler)
- [x] Terminabschluss und Anrechnung atomar; nur aktive Praxismitglieder können auslösen
- [x] Patientenansicht „Noch X von Y Sitzungen“ + neutraler Kostenhinweis (keine Kassen-Garantie)
- [x] Therapeutenansicht: Verordnungen anlegen, begründet anpassen, archivieren; Audit-Ereignisse
- [x] Migration/Seed/Terminabschluss lokal mit Docker/Supabase end-to-end geprüft (2026-07-11: UI-Durchlauf; Migration wegen reserviertem Alias `authorization` korrigiert)
- [x] Anzeige bei mehreren aktiven Verordnungen vereinheitlichen: gemeinsame DB-Auswahlregel `primary_authorization_for_patient` für Anzeige und Anrechnung (2026-07-12, Etappe 3)

## Phase F – Private Patientenakten

- [x] Privater Bucket `patient-records`; Pfad aus serverseitig verifizierten IDs; zufällige Dateinamen
- [x] Upload (PDF/JPEG/PNG, 20-MB-Limit, Signaturprüfung), Ansicht über kurzlebige signierte URLs
- [x] Kategorien, Dokumentdatum, Notiz und Archivieren
- [x] RLS, serverseitige Zugehörigkeitsprüfung und Audit für Upload/Archivierung
- [x] Upload, signierte URL und Patientenaussperrung lokal end-to-end geprüft (2026-07-11: UI-Durchlauf + Negativ-Proben)
- [ ] Dokument-Filter, endgültiges Löschen mit Bestätigung und dedizierte Mandantentrennungs-Tests
- [ ] Virenscan/Quarantäne vor Pilotbetrieb integrieren

## Etappenplan ab 11.07.2026 (verbindliche Produktentscheidungen)

Grundlage: bestätigte Entscheidungen vom 11.07.2026 (ganzzahlige Behandlungseinheiten; 1 Termin = 1 Einheit; interne Dokumente nie für Patienten; Verordnungswarnungen, markierte Patienten, Warteliste, freie Termine; ehrliche README; Obsidian-Sync).

- [x] **Etappe 1:** Repository analysiert, Phase-E/F-Parallelordner ins Hauptprojekt konsolidiert, Migration korrigiert, alles lokal verifiziert, README-Funktionsübersicht erstellt (2026-07-11)
- [x] **Etappe 2:** Telefonnummer (Patient pflegt, Praxis sieht/korrigiert via `set_patient_phone`) und Kalenderfarben (8er-Palette, Spaltenrecht nur für `calendar_color`, Legende + Chips im Kalender) – Migration `20260711260000`, UI-Durchlauf + API-Sicherheitsproben grün (2026-07-11)
- [x] **Etappe 3:** Behandlungskontingente ausschließlich in ganzen Einheiten: append-only Ledger (`initial_allocation`/`manual_increase`/`manual_decrease`/`appointment_completed`/`appointment_completion_reversed`), Abschluss-Rücknahme bucht genau 1 Einheit zurück (Historie bleibt), deutliche Warnung beim Abschluss mit 0 Einheiten (Stand nie negativ, Verringerung unter 0 serverseitig abgelehnt), gemeinsame Auswahlregel `primary_authorization_for_patient` für Anzeige und Anrechnung – Migration `20260711280000`, 55 Unit-Tests, 28 E2E, 17-Schritte-UI-Durchlauf inkl. Negativ-Proben grün (2026-07-12)
- [x] **Etappe 4:** Verordnungswarnungen: Schwellen ≤2 Einheiten / ≤14 Tage bis Gültigkeitsende (zentral in `src/lib/authorization-warnings.ts`), DB-Funktion `list_authorization_warnings` (nutzt dieselbe Verordnungsauswahl wie die Anrechnung), Warnbanner auf Patientendetail, Warnkarte im Dashboard, Filter + Badge in der Patientenliste, datensparsame Notification an aktive Praxismitglieder beim Erreichen von 2 bzw. 0 Einheiten – Migration `20260712100000`, 61 Unit-Tests, 28 E2E, 11-Schritte-UI-Durchlauf inkl. Negativ-Probe grün (2026-07-12)
- [x] **Etappe 5:** Patientendokumente vervollständigt (Kategorie-Filter, Archiv-Umschalter, endgültiges Löschen nur für archivierte Dokumente mit Bestätigung, RLS-Delete-Policy, Datei- und Zeilenlöschung + Audit) und internes Patienten-Kurzprofil (eigene Tabelle `patient_internal_profiles` ohne Patienten-Policy, max. 2000 Zeichen, Upsert pro Praxis+Patient) – Migration `20260712120000`, UI-Durchlauf + 5 RLS-Proben grün (2026-07-12)
- [x] **Etappe 6:** Markierte Patienten: eigene Tabelle `pinned_patients` ohne Patienten-Policy (Patient erfährt nie von der Markierung), Markieren/Entfernen mit optionaler Kurznotiz auf der Detailseite, Badge in Liste und Detail, markierte Patienten zuerst in der Liste + Filter, Dashboard-Karte – Migration `20260712140000`, UI-Durchlauf + RLS-Proben grün (2026-07-12)
- [x] **Etappe 7:** Warteliste: eigene Seite `/practice/waitlist` (Seitenleiste), Eintrag mit Wunschzeiten/Priorität/Notiz, höchstens ein offener Eintrag pro Patient (partieller Unique-Index, saubere Fehlermeldung), erledigen (Historie bleibt) und löschen, Tabelle `practice_waitlist_entries` ohne Patienten-Policy – Migration `20260712160000`, UI-Durchlauf + RLS-Proben grün (2026-07-12)
- [x] **Etappe 8:** Frei gewordene Termine und Angebotsworkflow: Wartelisten-Seite zeigt zukünftige stornierte Zeitfenster; Praxis erstellt Terminangebote (Patient, Therapeut, Datum/Zeit/Dauer) und kann sie zurückziehen; Patient sieht offene Angebote unter „Termine" und nimmt genau eines an – `accept_appointment_offer` bucht atomar unter dem bestehenden Überlappungsschutz (23P01 → verständliche Meldung), schließt den offenen Wartelisten-Eintrag und benachrichtigt die Praxis; Ablehnen ebenso mit Benachrichtigung; Angebote werden nie gelöscht (Status offered/accepted/declined/withdrawn) – Migration `20260712180000`, 15-Schritte-UI-Durchlauf inkl. Konfliktfall + RLS-Proben grün (2026-07-12)
- [x] **Etappe 9:** Obsidian-Synchronisation: `pnpm docs:sync` (`scripts/sync-obsidian.ts`) kopiert README, TASKS, DECISIONS und `docs/*.md` mit Hinweis-Banner nach `02_Projekte/PhysioCheck/` im Vault (`OBSIDIAN_VAULT_PATH` in `.env.local`; Toms Vault: `~/Desktop/UNI-Wissensbasis`). Einbahnstraße Repo → Vault, fasst nur den eigenen Zielordner an, Sicherheitsstopp ohne `.obsidian`-Ordner, generierter `00_Index.md` – zweimal ausgeführt und geprüft (2026-07-12)
- [x] **Etappe 10:** Dedizierte RLS-/Autorisierungs-Testsuite `pnpm test:rls` (`scripts/rls-tests.ts`, 36 Proben): Patientin nur eigene Daten, Fremdpraxis-Mitglied ohne jeden Zugriff (Tabellen, RPCs, Storage-Download), keine Selbst-Eskalation, unverbundenes Konto sieht nichts, Storage-Negativtests für `patient-records`; legt eine temporäre Fremdpraxis über den Service-Key an (nur lokal, Sicherheitsstopp) und räumt auf. E2E-Härtung: `expect`-Timeout 10 s + 1 Retry mit Trace (seltener Transport-Hänger unter Parallellast untersucht und dokumentiert) (2026-07-12)
- [x] **Etappe 11:** Abschließende Dokumentation und ehrliche Statusübersicht: README-Funktionsmatrix und „Letzte Änderungen" aktualisiert, `docs/AI_HANDOFF.md` mit vollem Stand (Etappen 3–8, 10), offene Punkte priorisiert (Obsidian-Vault-Pfad, Absage-Entscheidung, Virenscan, Übungsverwaltung, Toast-System, E2E-Hänger-Beobachtung) (2026-07-12)

## Auftrag vom 13.07.2026 – Übungs-/Videoverwaltung, Pläne, geführter Modus (Phasen A–J)

- [x] **Phase A:** Einladungseinstieg optimiert: „Ich habe einen Einladungscode" ist die primäre Auswahl der Startseite; Bestätigungsseite zeigt zusätzlich Ablaufdatum und einen verständlichen Hinweis (Konto selbst erstellen, Code bleibt bis zur endgültigen Verbindung gültig); QR-Code zum Einladungslink wird lokal in der Praxis-UI erzeugt (`qrcode`-Paket, keine externen Dienste). Bestehende sichere Einladungslogik (Hash, einmalig, Rate-Limit, atomare Einlösung nach Auth) unverändert wiederverwendet. UI-Durchlauf 7 Schritte grün (2026-07-13)
- [x] **Phase B:** Übungsbibliothek: anlegen, bearbeiten, duplizieren, deaktivieren, archivieren (nie Hard-Delete – bewusst keine Delete-Policy), Suche + Filter (Kategorie/Körperregion, Hilfsmittel, Archiv-Umschalter), Video-Badge in der Liste. Migration `20260713100000` (category, default_total_duration_seconds, archived_at auf `exercises`); Service/Actions/Formular neu (`src/server/{services,actions}/exercises.ts`, `src/components/practice/exercise-{form,admin-actions}.tsx`); Audit-Events für alle Verwaltungsaktionen. 8-Schritte-UI-Durchlauf + 65 Unit-Tests grün (2026-07-13)
- [~] **Phase C:** Sicherer Medien-Upload implementiert: MP4/WebM, JPEG/PNG und WebVTT; Dateivorschau, echter XHR-Fortschritt, zufälliger signierter Upload-Pfad, serverseitige Größen-/Magic-Byte-Prüfung, eindeutiges Medium je Übung+Art, Ersetzen/Entfernen + Audit; Patient erhält Video/Poster/Untertitel/Alternativbild nur nach Plan-Autorisierung über kurzlebige URL. Neue Migration `20260713120000_unique_exercise_media_kind.sql`, 4 neue Unit-Tests; Typecheck, Lint, 69 Unit-Tests und Build grün. Offen: lokaler `db:reset`, erweiterte RLS-Suite und Browser-Upload (Cloud ohne Supabase/Docker/.env.local) sowie Malware-Scan vor Pilotbetrieb
- [~] **Phase D:** Individuelle Patientenpläne implementiert: Plan-Builder im Patientendetail, Übungsauswahl/-sortierung, patientenspezifische Dosierung, Start-/Enddatum und typisiertes Schedule-Modell (feste Wochentage, 1–6× täglich mit Uhrzeiten oder 1–7× pro Woche). Legacy-Schedules werden normalisiert. Unit-/Build-Prüfung grün; lokaler DB-/Browserlauf steht aus.
- [~] **Phase E:** Atomare Planveröffentlichung als vollständige neue Version, Änderungsgrund, Historie, Archivierung, Audit und datensparsame Notification implementiert. Direkte Tabellenmutationen entzogen; Patientenzugriff nach Praxiswechsel auf aktuell verbundene Praxis begrenzt. Migration `20260713140000_publish_exercise_plans.sql`, RLS-Suite erweitert; Typecheck, Lint, 74 Unit-Tests und Build grün. Offen: `db:reset`, `test:rls`, E2E/UI lokal.
- [~] **Phase F:** Occurrence-Logik implementiert: historische Logs verlustfrei durchnummeriert, neue Durchgänge atomar serverseitig vergeben, eindeutiger Index verhindert Doppeltipps, feste 1–6 Tagesdurchgänge und flexible Wochenziele korrekt gezählt. „Geplant“, „dokumentiert“ und „als erledigt angegeben“ werden getrennt; nicht-erledigte Status zählen nicht als vollständig erledigt. Praxis sieht Einzeldurchgänge. Migration `20260713160000_completion_occurrences.sql`, 5 neue Unit-Tests; Typecheck, Lint, 79 Tests und Build grün. Lokaler DB-/RLS-/Browserlauf offen.
- [~] **Phase G:** Geführter Patientenmodus unter `/session` implementiert: Start/Fortsetzen auf „Heute“, immer ein offener Durchgang, Video/Alternativbild, große Vorgaben inklusive Häufigkeit/Uhrzeiten, optionaler Timer (Start/Pause/Reset; dokumentiert nie automatisch), vier Rückmeldestatus, automatische Neuberechnung des nächsten Durchgangs und Tageszusammenfassung. Klare Zurück-Navigation, ≥48-px-Aktionen, Tastatur-/Screenreader-Semantik und kein Swipe-Zwang. Typecheck, Lint, 83 Tests und Build grün; echter WCAG-/Browserdurchlauf lokal offen.
- [~] **Phase H:** Praxis-Auswertung implementiert: Dashboard und Patientendetail mit 7/30-Tage-Filter, Soll/Dokumentiert/als-erledigt, Status- und Schmerzmarkierungen, letzter Aktivität, inaktiven Patienten, Aufschlüsselung und Links zu Plan/Übung. Separates `reviewed_at/by` markiert neue Rückmeldungen, ohne den unveränderlichen Gesundheitsinhalt zu ändern; RPC mit Praxisprüfung und Audit. Migration `20260713180000_completion_feedback_review.sql`, Analytics-Unit-Tests und RLS-Proben ergänzt; Typecheck, Lint, 88 Tests und Build grün. Lokaler DB-/RLS-/Browserlauf offen.
- [ ] **Phase I:** Freiwillige In-App-Erinnerungen (deaktivierbar, Ruhezeiten; Push ehrlich als Ausbau dokumentiert)
- [ ] **Phase J:** Tests (Bibliothek, Videos, Pläne, Durchgänge, Einladung) + Gesamtabschluss (db:reset, seed, test:rls, e2e, build)

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
