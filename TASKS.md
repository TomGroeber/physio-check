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
- [x] Übung anlegen/bearbeiten mit Video-Upload in privaten Bucket – umgesetzt in Phase B/C des Auftrags vom 13.07.2026
- [x] Plan zuweisen über die Oberfläche – umgesetzt in Phase D/E des Auftrags vom 13.07.2026 (Plan-Builder, atomare Versionen)
- [x] Dedizierte RLS-Testsuite – umgesetzt in Etappe 10 (`pnpm test:rls`, inzwischen 96 Proben)

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
- [x] Dokument-Filter, endgültiges Löschen mit Bestätigung und Mandantentrennungs-Tests – umgesetzt in Etappe 5
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
- [x] **Phase C:** Sicherer Medien-Upload implementiert: MP4/WebM, JPEG/PNG und WebVTT; Dateivorschau, echter XHR-Fortschritt, zufälliger signierter Upload-Pfad, serverseitige Größen-/Magic-Byte-Prüfung, eindeutiges Medium je Übung+Art, Ersetzen/Entfernen + Audit; Patient erhält Video/Poster/Untertitel/Alternativbild nur nach Plan-Autorisierung über kurzlebige URL. Neue Migration `20260713120000_unique_exercise_media_kind.sql`, 4 neue Unit-Tests; Typecheck, Lint, 69 Unit-Tests und Build grün. Offen: lokaler `db:reset`, erweiterte RLS-Suite und Browser-Upload (Cloud ohne Supabase/Docker/.env.local) sowie Malware-Scan vor Pilotbetrieb
- [x] **Phase D:** Individuelle Patientenpläne implementiert: Plan-Builder im Patientendetail, Übungsauswahl/-sortierung, patientenspezifische Dosierung, Start-/Enddatum und typisiertes Schedule-Modell (feste Wochentage, 1–6× täglich mit Uhrzeiten oder 1–7× pro Woche). Legacy-Schedules werden normalisiert. Unit-/Build-Prüfung grün; lokaler DB-/Browserlauf steht aus.
- [x] **Phase E:** Atomare Planveröffentlichung als vollständige neue Version, Änderungsgrund, Historie, Archivierung, Audit und datensparsame Notification implementiert. Direkte Tabellenmutationen entzogen; Patientenzugriff nach Praxiswechsel auf aktuell verbundene Praxis begrenzt. Migration `20260713140000_publish_exercise_plans.sql`, RLS-Suite erweitert; Typecheck, Lint, 74 Unit-Tests und Build grün. Offen: `db:reset`, `test:rls`, E2E/UI lokal.
- [x] **Phase F:** Occurrence-Logik implementiert: historische Logs verlustfrei durchnummeriert, neue Durchgänge atomar serverseitig vergeben, eindeutiger Index verhindert Doppeltipps, feste 1–6 Tagesdurchgänge und flexible Wochenziele korrekt gezählt. „Geplant“, „dokumentiert“ und „als erledigt angegeben“ werden getrennt; nicht-erledigte Status zählen nicht als vollständig erledigt. Praxis sieht Einzeldurchgänge. Migration `20260713160000_completion_occurrences.sql`, 5 neue Unit-Tests; Typecheck, Lint, 79 Tests und Build grün. Lokaler DB-/RLS-/Browserlauf offen.
- [x] **Phase G:** Geführter Patientenmodus unter `/session` implementiert: Start/Fortsetzen auf „Heute“, immer ein offener Durchgang, Video/Alternativbild, große Vorgaben inklusive Häufigkeit/Uhrzeiten, optionaler Timer (Start/Pause/Reset; dokumentiert nie automatisch), vier Rückmeldestatus, automatische Neuberechnung des nächsten Durchgangs und Tageszusammenfassung. Klare Zurück-Navigation, ≥48-px-Aktionen, Tastatur-/Screenreader-Semantik und kein Swipe-Zwang. Typecheck, Lint, 83 Tests und Build grün; echter WCAG-/Browserdurchlauf lokal offen.
- [x] **Phase H:** Praxis-Auswertung implementiert: Dashboard und Patientendetail mit 7/30-Tage-Filter, Soll/Dokumentiert/als-erledigt, Status- und Schmerzmarkierungen, letzter Aktivität, inaktiven Patienten, Aufschlüsselung und Links zu Plan/Übung. Separates `reviewed_at/by` markiert neue Rückmeldungen, ohne den unveränderlichen Gesundheitsinhalt zu ändern; RPC mit Praxisprüfung und Audit. Migration `20260713180000_completion_feedback_review.sql`, Analytics-Unit-Tests und RLS-Proben ergänzt; Typecheck, Lint, 88 Tests und Build grün. Lokaler DB-/RLS-/Browserlauf offen.
- [x] **Phase I:** Freiwillige In-App-Erinnerungen implementiert: Übungs- und Planhinweise getrennt deaktivierbar, Ruhezeit in Praxiszeitzone, Restzahl für mehrere Tagesdurchgänge, ungelesene Planänderungen und eng begrenzter Lesestatus. Migration `20260713200000_patient_reminder_preferences.sql`, Reminder-/Zeit-/Validierungs-Unit-Tests sowie RLS-Proben; Typecheck, Lint, 97 Tests und Build grün. Push/E-Mail bewusst als späterer Ausbau dokumentiert; lokaler DB-/RLS-/Browserlauf offen.
- [x] **Phase J:** Testkatalog für Bibliothek, Videos, Pläne, Durchgänge und Einladungen implementiert (`e2e/phase-j-*.spec.ts`, erweiterte `scripts/rls-tests.ts`, `docs/TEST_MATRIX.md`). Typecheck, Lint, 101 Unit-/Komponententests, Playwright-Testliste mit 42 Fällen und Build grün. Gesamtabschluss lokal offen: `db:reset` ohne Supabase CLI, Seed/RLS ohne `.env.local`, E2E zusätzlich durch eingeschränkte Netzwerk-Interfaces blockiert.

> **Nachtrag 19.07.2026:** Alle in den Phasen C–J als „lokal offen“ vermerkten Prüfungen (db:reset, Seed, RLS, E2E, Browser-/WCAG-Durchläufe) wurden am 19.07.2026 auf Toms Mac vollständig ausgeführt und sind grün – die Formulierungen oben beschreiben nur den damaligen Cloud-Prüfstand. Aktuelle Ergebnisse: `docs/TEST_MATRIX.md`.

## Phase G – Notifications, Terminvorschläge, Härtung und Bedienbarkeit

- [ ] In-App-Benachrichtigungszentrum: gelesen/ungelesen, Badge, Zielroute, datensparsame Inhalte
- [ ] Terminanfrage nach Absage: mehrere Vorschläge, Patient bestätigt genau einen (atomar, mit Konfliktprüfung)

- [ ] Barrierefreiheit: Tastatur, Fokus, Kontraste, Screenreader-Labels, große Schrift (WCAG 2.2 AA, Kernansichten geprüft)
- [ ] Fehler-, Lade- und Leerzustände aller datenabhängigen Seiten
- [ ] Security-Review: CSP, Upload-Härtung, Rate Limits, Audit-Events vollständig
- [x] Videoverwaltung: Vorschaubild, Untertitel, Alternativbild umgesetzt (Phase C, 13.07.2026); konfigurierbare Formate/Größen bewusst offen
- [ ] Plan-Versionierung UI (Änderungshistorie nachvollziehbar)
- [ ] `docs/CUSTOMIZATION_GUIDE.md` (Deutsch, für Nicht-Programmierer)
- [ ] Pilot-Checkliste in `docs/PRIVACY_SECURITY.md` finalisieren
- [x] Production Build + kritische E2E-Tests grün (zuletzt 19.07.2026: Build ✓, E2E 49 bestanden/0 fehlgeschlagen)

## Auftrag vom 18.07.2026 – Patientenoberfläche konsolidieren

- [x] Claudes uncommitteten Stand als `e9868fa` gesichert und vollständig geprüft.
- [x] Seed-Reparatur und Migration `20260718100000_fix_mark_notification_read.sql` erhalten.
- [x] „Heute“ als kompakte Checkliste mit einem primären Einstieg und großen Statusflächen fertiggestellt.
- [x] Nur `completed` wird als „Geschafft“ bestätigt; schwierige/nicht mögliche Rückmeldungen bleiben wertungsfrei.
- [x] Übungsformular, vergangene Termine, Absage sowie seltene Hinweise schrittweise einklappbar gemacht.
- [x] Profil und Konto-Actions gehärtet: Doppelbestätigung, pending E-Mail, Recovery-Mail nur an Session-Adresse, interner Callback und Patientenscope.
- [x] Typecheck, Lint, 105 Tests und Production Build grün; Playwright erkennt 48 Fälle.
- [x] Auf Toms Mac ausführen: `pnpm db:reset && pnpm seed && pnpm test:rls && pnpm e2e`; Mailpit-Links und Mobil-/Desktopdarstellung prüfen. (2026-07-19, siehe Auftrag unten)
- [x] Merge nach `main` mit Toms Freigabe (2026-07-19): Fast-Forward `960c212..c0579ca`, gepusht.

## Auftrag vom 19.07.2026 – Video-first-Übungsansicht und Profilbild (Branch `claude-patient-exercise-avatar-20260719`)

- [x] Übungsdetailseite und geführter Modus auf gemeinsame Video-first-Ansicht umgestellt (`ExerciseView`): randloses 16:9-Video mit Poster/Untertiteln, Alternativbild, freundlicher Leerzustand; kompakte Vorgaben-Chips (Sätze, Wiederholungen, Halten, Pause, Hilfsmittel), Häufigkeit, Uhrzeiten und Praxisnotiz.
- [x] Kurzbeschreibung, Ausgangsposition, Durchführungsschritte und häufige Fehler aus der Patientenansicht entfernt; Daten und Praxis-Bearbeitung unverändert (per E2E belegt), D-055.
- [x] Migration `20260719100000_patient_avatars.sql`: `profiles.avatar_path` (Clients können die Spalte nicht schreiben), privater Bucket `patient-avatars` (5 MB, JPEG/PNG/WebP), Lese-Policy nur für den Patienten selbst und aktive Mitglieder der aktuell verbundenen Praxis; keine Client-Schreib-Policies (D-054).
- [x] Avatar-Service/-Actions nach dem Ticket-Muster der Übungsmedien: zufälliger Pfad im eigenen Profilordner, serverseitige Größen- und Magic-Byte-Prüfung (inkl. WebP), Ersetzen löscht das alte Objekt, Entfernen löscht Datei und Verweis, Audit ohne Dateinamen; Auslieferung nur über kurzlebige signierte URLs nach Pfadprüfung.
- [x] Profilseite mit Auswahl/Vorschau/Hochladen/Ersetzen/Entfernen; runder Avatar mit Initialen-Platzhalter und automatischem Fallback bei Ladefehlern in Patienten-Kopfzeile, Profil, Praxis-Patientenliste und -detailseite.
- [x] Tests: 9 neue Unit-/Komponententests (Video-vor-Vorgaben, ausgeblendete Langtexte, Leerzustand, WebP-/Pfad-Prüfungen), 10 neue RLS-Proben (inkl. Ex-Praxis nach Praxiswechsel, Spalten- und Bucket-Schreibschutz), 6 neue E2E-Fälle (Upload/Ablehnungen/Ersetzen/Entfernen/Praxisansicht, video-first-Seite).
- [x] Vollständig lokal ausgeführt: db:reset (21 Migrationen), Seed, Typecheck, Lint, 114 Tests, 88 RLS-Proben, E2E Exit 0 (43 bestanden/16 planmäßig übersprungen), Build, mobiler Browserlauf (iPhone-Viewport, kein horizontales Scrollen, Video volle Breite).
- [x] Teststabilität: Playwright auf 4 Worker begrenzt, Expect-Timeout 15 s, Hydrations-Klickverluste in drei Spezifikationen behoben.
- [x] Merge nach `main` mit Toms Freigabe (2026-07-19): Fast-Forward `4723363..91591df`, gepusht.

## Auftrag vom 19.07.2026 – Mobile Patienten-App (Branch `claude-patient-mobile-20260719`, Basis `28ee792`)

- [x] Architektur dokumentiert (`docs/MOBILE_ARCHITECTURE.md`) und Entscheidungen D-058–D-062 festgehalten, BEVOR implementiert wurde.
- [x] pnpm-Workspace: `apps/patient-mobile` (Expo SDK 57, Expo Router, TS strict, ESLint, Jest) + `packages/shared` (plan-schedule, occurrences, datetime, exercise-timer, invite-code-format; Website re-exportiert unter den alten Pfaden – alle 115 Web-Tests unverändert grün). Website nicht verschoben.
- [x] Root-Skripte: `mobile:start/ios/android/typecheck/lint/test`, `shared:typecheck`.
- [x] Mobile Auth (Teil H): Willkommen mit zwei großen Wegen, Code-Prüfung serverseitig (Praxisname + Ablauf), eigenes Konto (signUp + Deep-Link-Bestätigung), atomare Einlösung per `redeem_patient_invite`, Praxiswechsel mit Warnung, Praxisrollen-Aussperrung mit verständlichem Hinweis, Passwort-Reset per Deep Link; Sessions AES-verschlüsselt, Schlüssel im SecureStore (D-061).
- [x] Deep Links: `physiocheck://invite/<code>`, `auth/confirm`, `reset-password`, `today`, `appointments`; Redirect-URLs in `supabase/config.toml`; Universal/App Links als offene Domain-Aufgabe dokumentiert.
- [x] Kernfunktionen (Teil I): Heute-Checkliste (dokumentiert ≠ erledigt, „Geschafft!“ nur bei completed, Pull-to-refresh, Lade-/Fehler-/Leerzustände), Übung (16:9-Video mit signierter URL/Poster/Untertiteln, kompakte Vorgaben-Chips, Praxisnotiz, alle vier Status, Schmerzskalen 0–10 als große Touch-Flächen, Mehrfach-Durchgänge), Termine (kommend/vergangen einklappbar, Absageanfrage, Angebote annehmen/ablehnen inkl. Konfliktfall), Behandlungseinheiten (neutraler Kostenhinweis, Warnung bei ≤2/abgelaufen), Profil (Bild hochladen/ersetzen/entfernen über Ticket-Endpunkte, Initialen-Platzhalter, Telefonnummer, Erinnerungen, E-Mail-Änderung, Abmelden).
- [x] Kontolöschung (Teil I6, D-062): doppelt bestätigter Antrag → Migration `20260719140000_account_deletion_requests.sql` (keine Client-Policies), Audit-Ereignis, Zugangssperre; offene Luxemburg-Aufbewahrungsfrage ehrlich dokumentiert.
- [x] `/api/mobile`-Endpunkte (D-059): Bearer-Authentifizierung, Code-Prüfung mit bestehendem Rate-Limit, signierte Übungsmedien nur nach Prüfung „aktueller eigener Plan“, Avatar start/finalize/remove über bestehende Services, Löschantrag; strukturierte Fehler.
- [x] Sync v1 (Teil J, D-060): Laden beim Öffnen, Refresh nach Mutation und beim Foreground, Pull-to-refresh, ehrlicher Offline-/Fehlerzustand; kein Realtime, keine lokale Gesundheitsdaten-Persistenz; Push nur konzeptionell (Credentials fehlen – echter Blocker).
- [x] Barrierefreiheit (Teil K): Basisschrift 18, Aktionen ≥ 56 pt, Touch ≥ 48 pt, Textbeschriftungen statt Icon-only, Screenreader-Labels/Live-Regionen, Dark Mode über Systemschema mit eigener Palette, kein horizontales Scrollen (ScrollView-Layout), keine Swipe-Pflichten.
- [x] Tests (Teil L): 10 Jest-Tests (Statussemantik der Heute-Ansicht, Code-Formatprüfung ohne Netz, UI-A11y, Sprachhygiene); RLS gegen echte lokale Supabase: 96 Proben inkl. Löschantrags-Tabelle; Integrationsprobe mit 15 Schritten gegen lokale Supabase + Next-Server (Login → Heute → RPC-Dokumentation → signierte Medien → 401-Grenzen → Code gültig/ungültig → Rollenerkennung) – keine Mock-Datenbank als RLS-„Beweis“.
- [x] Store-Vorbereitung (Teil M): `eas.json` (3 Profile), Bundle-ID-Vorschläge, `docs/APP_STORE_CHECKLIST.md` (Privacy/Data-Safety/Testkonto/TestFlight/Screenshots/Domain/Malware-Scan als offene Punkte), `.env.example`; nichts eingereicht oder registriert.
- [x] Verifiziert (Teil N): mobile Typecheck/Lint (0 Fehler)/10 Tests, `expo-doctor` 20/20, `expo config`, iOS-Produktions-Bundle (`expo export`); Web nach Umbau komplett: Typecheck, Lint, 115 Tests, 96 RLS-Proben, E2E 49/0, Build. Simulator-/Emulatorstart: echter Umgebungs-Blocker (kein Xcode/Android SDK auf dem Mac), dokumentiert.
- [ ] Offen: Push-Versand (Credentials), Universal-Link-Domain, native Builds/Simulatortest nach Xcode-Installation, Datenschutzerklärungs-URL, rechtliche Klärung Kontolöschung/Aufbewahrung Luxemburg.

## Auftrag vom 19.07.2026 – Kalenderfarben pro Patient (Branch `claude-patient-calendar-colors-20260719`)

- [x] Unterbrochenen, uncommitteten Stand der Vorsitzung analysiert, als WIP-Commit gesichert und gepusht (kein Stand verworfen).
- [x] Migration `20260719120000_patient_calendar_colors.sql`: Tabelle `patient_calendar_colors` (Farbe je Praxis+Patient, RLS nur für Mitglieder, Zuweisen nur bei aktiver Verbindung, keine Patienten-Policy, Grants ergänzt); `practice_members.calendar_color` entfernt (D-057).
- [x] Farbauswahl auf der Praxis-Patientendetailseite (`PatientColorPicker`: 8 Farben + „Keine Farbe“, Farbfeld immer mit Farbname); Einstellungsseite ohne „Meine Kalenderfarbe“.
- [x] Kalender (Monat/Woche/Tag/Liste) färbt Termine nach Patient; Legende zeigt nur zugeordnete Patienten im sichtbaren Zeitraum; Termine ohne Zuordnung neutral.
- [x] Fertigstellung nach Übernahme: `AppointmentList` erhält die Farbzuordnung als Prop (vorher Scope-Fehler), `appointments.ts`-Selects, `database.types.ts`, Seed (Demo-Patientin „Petrol“) und alte Picker-Komponente/Validierung/Tests bereinigt.
- [x] Speicherbestätigung nach dem Redirect-Muster D-053 (`?calendar_color_saved=1`), weil der Rückgabezustand mit `revalidatePath` den Client auf dem Produktionsserver reproduzierbar nicht erreichte; Playwright-Testtimeout auf 60 s angehoben (Navigationen unter Spitzenlast, bekannte Ursache).
- [x] Tests: 4 neue RLS-Proben (Patientin liest/schreibt nichts, Fremdpraxis liest nichts und kann fremdem Patienten keine Farbe zuweisen, Mitglied setzt Farbe der verbundenen Patientin) → 94 Proben; E2E-Fall „Kalenderfarbe zuweisen und im Kalender sehen“ in `demo-accounts.spec.ts`.
- [x] Vollständig lokal geprüft: db:reset (22 Migrationen), Seed, Typecheck, Lint, 115 Tests, 94 RLS-Proben, E2E, Build, Browser-Check Desktop + iPhone-Viewport.
- [x] Merge nach `main` mit Toms Freigabe (19.07.2026, PR #2 `a776f23`, gemeinsam mit der Mobile-Branch-Kette).

## Auftrag vom 19.07.2026 – Dunkelmodus für Patienten (Branch `claude-patient-dark-mode-20260719`)

- [x] Umschalter „Darstellung: Hell/Dunkel“ im Patientenprofil (große Radio-Flächen, sofortige Wirkung, Hinweis „gilt für dieses Gerät“).
- [x] `.dark`-Klasse nur auf dem Patienten-Layout-Wrapper (Cookie `pc-theme`); Praxisbereich liest das Cookie nicht und bleibt immer hell (D-056).
- [x] Vorhandene dunkle Token-Palette genutzt; kein Flackern (Server rendert die Klasse aus dem Cookie).
- [x] Tests: `theme-toggle.test.tsx` (Parsing + Umschalten + Cookie), E2E in `demo-accounts.spec.ts` (Dunkel setzen, überall gültig, Neuladen übersteht, zurück auf Hell; Praxis trotz Dunkel-Cookie ohne `.dark`).
- [x] Vollständig geprüft: Typecheck, Lint, 116 Tests, Build, E2E Exit 0 (45 bestanden/16 planmäßig übersprungen), mobiler Dunkel-Screenshot-Durchlauf.
- [x] Merge nach `main` mit Toms Freigabe (19.07.2026, PR #2 `a776f23`, gemeinsam mit der Mobile-Branch-Kette).

## Auftrag vom 19.07.2026 – Lokale Prüfungen und Fehlerbehebung (Branch `claude-patient-ui-20260718`)

- [x] `supabase start`, `pnpm db:reset` (20 Migrationen), `pnpm seed`, Typecheck, Lint, 105 Unit-Tests grün.
- [x] `pnpm test:rls`: 78 Proben grün.
- [x] `pnpm e2e`: erst gegen veralteten Dauerserver gelaufen (5 Scheinfehler), nach sauberem Build/Neustart und Testfixes Exit 0 (35 bestanden, 12 planmäßig übersprungen, 1 bekannter Parallellast-Flake vom Retry aufgefangen).
- [x] Fehler behoben: hängende Medien-Finalisierung (Body-Reader-Cancel), nicht-deterministischer Seed (stille FK-Blocker aus E2E-Daten), Terminabsage- und E-Mail-Änderungs-Bestätigung per Redirect statt Rückgabezustand, `/auth/confirm` beim zweiten Bestätigungslink, Fortschrittstext „geschafft“→„eingetragen“ (D-049-konform).
- [x] Vier hartkodierte Patiententexte nach `src/messages/de.ts` verschoben; vier E2E-Spezifikationsfehler repariert (Login-Race, mehrdeutige Selektoren, Ersetzen-Race, Seed-Doppelwert im Selbstauskunfts-Test).
- [x] Browser-Durchläufe: Heute-Checkliste, „Geschafft!“ nur bei `completed`, neutrale Rückmeldung bei teilweise/zu schwierig/nicht möglich, Terminübersicht + Absage (5×), Profil, Telefonnummer, Erinnerungen, Passwortänderung mit Mailpit-Recovery-Link, E-Mail-Änderung mit Doppelbestätigung, Redirect-Schutz (`next=//…`), Praxisbereich-Aussperrung, iPhone-Viewport (Touch-Ziele ≥ 48 px, kein horizontales Scrollen).
- [x] Dokumentation aktualisiert und `pnpm docs:sync` ausgeführt; Commit auf `claude-patient-ui-20260718` gepusht.
