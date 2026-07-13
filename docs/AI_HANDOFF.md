# PhysioCheck – AI Handoff

> Stand: 2026-07-13 · Arbeitszweig: `main` · GitHub-Remote: `TomGroeber/physio-check` (aktuell öffentlich; keine Secrets/echten Daten)

## Laufender Auftrag (13.07.2026): Phasen A–J

Übungs-/Videoverwaltung, individuelle Pläne, flexible Häufigkeiten, geführter Patientenmodus, optimierter Einladungseinstieg. Fortschritt in `TASKS.md` (Abschnitt „Auftrag vom 13.07.2026") und `NEXT_TASK.md`.

- **Phase H implementiert (Cloud-Prüfstand, 2026-07-13):** `src/lib/adherence-analytics.ts` berechnet Soll je Schedule/Zeitraum sowie dokumentiert, completed, Status-, Schmerz- und ungelesene Zähler. `src/server/services/adherence.ts` liefert Patientendetail und Bulk-Dashboard ohne Patient-N+1. Beide Ansichten filtern 7/30 Tage, zeigen letzte Aktivität/inaktive Patienten und verlinken Patient, Plan und Übung. Migration `20260713180000_completion_feedback_review.sql` ergänzt getrennte Review-Metadaten und eine autorisierte/auditierte RPC; Action/Button markieren ungelesene Logs. RLS-Suite prüft Patient/Fremdpraxis/eigene Praxis. Cloud-geprüft: Typecheck, Lint, 88 Tests, Build. DB/RLS/E2E/UI lokal offen.

- **Phase G implementiert (Cloud-Prüfstand, 2026-07-13, Commit `441fc80`):** Neue Patientenseite `/session` und Start/Fortsetzen-CTA auf `/today`. Sie zeigt genau den nächsten offenen Durchgang mit privaten Medien, großen individuellen Vorgaben, Schedule/Uhrzeiten, Schritten und optionalem Timer. Das wiederverwendbare `ExerciseLogForm` unterstützt einen streng validierten Guided-Return; nach dem Speichern wird die Queue serverseitig neu geladen. Wenn nichts offen ist, erscheint eine neutrale Tageszusammenfassung. Neue Dateien: `src/app/(patient)/session/page.tsx`, `src/components/patient/{exercise-log-form,exercise-timer}.tsx`, `src/lib/exercise-timer.ts`. Cloud-geprüft: Typecheck, Lint, 83 Tests, Build. Browser-/WCAG-Test offen. Push und Obsidian-Sync bleiben wegen fehlender Cloud-Anmeldung beziehungsweise fehlendem lokalen Vault blockiert.

- **Phase F implementiert (Cloud-Prüfstand, 2026-07-13, Commit `3ffa797`):** Migration `20260713160000_completion_occurrences.sql` ergänzt `occurrence_index`, nummeriert alle alten Logs deterministisch und erzwingt eindeutige Tagesdurchgänge. `record_exercise_occurrence` prüft aktuellen Plan/Praxislink, Tages-/Wochen-Schedule und vergibt den nächsten Index atomar; der Snapshot entsteht in der DB, direkte Inserts wurden entzogen. `src/lib/occurrences.ts` berechnet Soll, dokumentiert und als erledigt gemeldet getrennt. Heute-/Detail-/Praxisansicht zeigen Einzeldurchgänge und Wochenstand. RLS-Suite um Direktinsert, Doppelanlage und Fremdzugriff ergänzt. Cloud-geprüft: Typecheck, Lint, 79 Tests, Build. DB-Reset/RLS/E2E/UI mangels lokaler Supabase offen. GitHub-Push scheitert weiterhin mangels Schreibanmeldung; Obsidian-Sync mangels `.env.local`/Vault.

- **Phase D/E implementiert (Cloud-Prüfstand, 2026-07-13, Commit `16a166a`):** `ExercisePlanBuilder` im Praxis-Patientendetail verwaltet Übungsauswahl, Reihenfolge, Dosierung, Zeitraum und typisierte Häufigkeiten (feste Wochentage mit 1–6 Durchgängen/Uhrzeiten oder 1–7 frei gewählte Tage pro Woche). Migration `20260713140000_publish_exercise_plans.sql` ergänzt Schedule-Constraint, einen partiellen Unique-Index und atomare RPCs für Veröffentlichen/Archivieren. Direkte Plan-Tabellenmutationen sind entfernt; Patientenzugriff verlangt den aktiven Link zur aktuellen Praxis. Neue Services/Actions/Validierungen und RLS-Proben. Cloud-geprüft: Typecheck, Lint, 74 Unit-Tests, Build. Nicht ausgeführt: DB-Reset, RLS, E2E und UI-Durchlauf (keine `.env.local`/lokale Supabase). GitHub-Push weiterhin mangels Schreibanmeldung blockiert; `pnpm docs:sync` weiterhin mangels `.env.local`/lokalem Vault blockiert. Branch `main` enthält alle lokalen Commits und darf nicht überschrieben werden.

- **Phase C implementiert (2026-07-13, Commit `61638bd`, lokaler Zwischenstand aus Claude übernommen):** `src/config/media.ts` und `src/server/services/exercise-media.ts` wurden fertig angeschlossen und gehärtet. Neue Server-Actions autorisieren jede Übung über die aktuelle Praxis-Mitgliedschaft. `ExerciseMediaManager` bietet Video, Poster, Alternativbild und WebVTT-Untertitel mit Vorschau, echtem XHR-Uploadfortschritt, Ersetzen und Entfernen. Finalisierung liest nur den ersten Stream-Chunk, prüft Größe und Magic Bytes, registriert per eindeutigem `(exercise_id, kind)`-Upsert und auditiert ohne Dateinamen. Patienten erhalten die vier Medienarten erst nach Prüfung ihres aktuellen Plans über 10 Minuten gültige URLs. Migration `20260713120000_unique_exercise_media_kind.sql`; RLS-Suite um nicht zugewiesene/fremde Übungsmedien und direkte Storage-Zugriffe ergänzt. Cloud-geprüft: Typecheck, Lint, 69 Unit-Tests, Build. Nicht ausgeführt: DB-Reset, RLS, E2E und UI-Upload (keine `.env.local`, Docker/Supabase CLI in der Cloud). Malware-Scan bleibt Pilot-Blocker.

### Synchronisationsstatus nach Phase C

- GitHub-Push von `main`: blockiert, weil in der Cloud keine GitHub-Schreibanmeldung vorhanden ist (`fatal: could not read Username for 'https://github.com': No such device or address`). Der öffentliche Remote ist lesbar; lokale Commits bleiben erhalten und dürfen nicht per Force-Push ersetzt werden.
- Obsidian: `pnpm docs:sync` ist in der Cloud mit `node: .env.local: not found` abgebrochen. Der Vault liegt nur auf Toms Mac; nach Übernahme des Commits dort erneut ausführen.

- **Phase B fertig (2026-07-13):** Übungsbibliothek komplett verwaltbar: `/practice/exercises` mit Suche + Filtern (Kategorie, Hilfsmittel, Archiv), Anlegen/Bearbeiten (`/new`, `/[exerciseId]`), Duplizieren (ohne Medien), Deaktivieren (nicht in neuen Plänen) und Archivieren (aus Bibliothek ausgeblendet; Übungen werden nie hart gelöscht – es existiert keine Delete-Policy, alte Pläne/Logs bleiben lesbar). Migration `20260713100000_exercise_library_fields.sql` (category, default_total_duration_seconds, archived_at). practice_id stammt immer aus der verifizierten Mitgliedschaft. Neue Dateien: `src/server/services/exercises.ts`, `src/server/actions/exercises.ts`, `src/lib/validation/exercises.ts` (+ 4 Unit-Tests), `src/components/practice/exercise-form.tsx`, `exercise-admin-actions.tsx`. Geprüft: Typecheck, Lint, 65 Unit-Tests, Build, 8-Schritte-UI-Durchlauf (anlegen, bearbeiten, suchen/filtern, duplizieren, deaktivieren, archivieren, Roundtrip, aufräumen).
- **Phase A fertig (2026-07-13):** Startseite führt primär zum Code-Einstieg; `/invite/continue` zeigt Ablaufdatum + Hinweis (Konto selbst erstellen, Code bleibt bis zur endgültigen Verbindung gültig); QR-Code zum Einladungslink lokal erzeugt (`src/components/practice/invite-qr-code.tsx`, neues Paket `qrcode`, keine externen Aufrufe). Einladungssicherheit unverändert. Geprüft: Typecheck, Lint, 61 Unit-Tests, Build, 7-Schritte-UI-Durchlauf (frischer Code, QR sichtbar, Deep-Link, neutrale Fehlermeldung, Aufräumen).

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
- Etappe 3: Behandlungskontingente strikt ganzzahlig mit append-only Ledger. `appointment_authorization_usages` bekommt `reversed_at`/`reversed_by` (nie löschen, nur markieren), `sessions_used = 1` erzwungen, partieller Unique-Index `appointment_usages_active_appointment_key` (höchstens eine aktive Anrechnung pro Termin, nach Rücknahme erneut anrechenbar). Neue DB-Funktionen: `reverse_appointment_completion` (Termin → „geplant", bucht genau 1 Einheit zurück; 23P01 bei inzwischen belegtem Zeitraum wird in der Action abgefangen) und `primary_authorization_for_patient` (gemeinsame Auswahlregel für Patientenanzeige und Anrechnung – Phase-E-Inkonsistenz behoben). `authorization_remaining` ignoriert stornierte Anrechnungen, nie negativ; manuelle Verringerung unter 0 lehnt der Server ab. UI: Ledger-Historie auf der Patientendetailseite (`src/lib/authorization-ledger.ts` + Tests), Formular „Abschluss zurücknehmen", gelbe Warnung beim Abschluss mit 0 Einheiten (`FormMessage` hat jetzt `warning`). Migration `20260711280000`. *(17-Schritte-UI-Durchlauf inkl. Negativ-Proben)*
- Etappe 4: Verordnungswarnungen. Schwellen zentral in `src/lib/authorization-warnings.ts` (≤ 2 Einheiten bzw. ≤ 14 Tage bis `valid_until`; Toms Freigabe „sinnvolle Standardwerte"), DB-Funktion `list_authorization_warnings` (nutzt `primary_authorization_for_patient`), Warnbanner Patientendetail, Dashboard-Karte, Filter+Badge Patientenliste, datensparsame Notification an aktive Mitglieder genau beim Erreichen von 2 bzw. 0 Einheiten. Migration `20260712100000`. *(11-Schritte-UI-Durchlauf + RPC-Negativ-Probe)*
- Etappe 5: Dokumente vervollständigt (Kategorie-Filter, Archiv-Umschalter, endgültiges Löschen NUR archivierter Dokumente mit Bestätigung; RLS-Delete-Policy + Action löschen Zeile und Storage-Objekt, Audit-Event) und internes Kurzprofil `patient_internal_profiles` (kein Patienten-Policy → nie für Patienten lesbar, max. 2000 Zeichen, Upsert je Praxis+Patient). Migration `20260712120000`. *(UI-Durchlauf + 5 RLS-Proben)*
- Etappe 6: Markierte Patienten `pinned_patients` (kein Patienten-Policy; Markieren/Entfernen mit optionaler Notiz, Badge Liste+Detail, markierte zuerst + Filter, Dashboard-Karte). Migration `20260712140000`. *(UI-Durchlauf + RLS-Proben)*
- Etappe 7: Warteliste `/practice/waitlist` (Seitenleiste): `practice_waitlist_entries` mit Wunschzeiten/Priorität/Notiz, max. 1 offener Eintrag pro Patient (partieller Unique-Index → verständliche Meldung), erledigen (Historie) und löschen. Migration `20260712160000`. *(UI-Durchlauf + RLS-Proben)*
- Etappe 8: Frei gewordene Zeitfenster + Angebotsworkflow: Wartelisten-Seite zeigt zukünftige stornierte Slots; Praxis erstellt/zieht Angebote zurück (`appointment_offers`, nie löschen – Status offered/accepted/declined/withdrawn); Patient antwortet unter „Termine": `accept_appointment_offer` bucht atomar unter dem GiST-Überlappungsschutz (23P01 → verständliche Meldung), schließt offenen Wartelisten-Eintrag, benachrichtigt Mitglieder; `decline_appointment_offer` ebenso. Migration `20260712180000`. *(15-Schritte-UI-Durchlauf inkl. Konfliktfall)*
- Etappe 10: Dedizierte RLS-Suite `pnpm test:rls` (`scripts/rls-tests.ts`, 36 Proben: Patientin nur eigene Daten, Fremdpraxis nichts, keine Selbst-Eskalation, unverbundenes Konto nichts, Storage-Download/Signed-URL verweigert). Legt temporäre Fremdpraxis via Service-Key an (Sicherheitsstopp: nur lokal) und räumt auf.

## Prüfstand (alles am 2026-07-12 auf Toms Mac ausgeführt)

- `pnpm db:reset`: grün (alle 12 Migrationen)
- `pnpm seed`: grün
- `pnpm typecheck`, `pnpm lint`: grün
- `pnpm test`: 61 Tests grün
- `pnpm e2e`: 28 bestanden, 6 planmäßig übersprungen (Kernablauf läuft nur auf Chromium)
- `pnpm test:rls`: 36 Proben grün
- `pnpm build`: grün
- UI-Durchläufe je Etappe (Playwright-Treiberskripte mit Screenshots) inkl. Negativ-/Konflikt-Proben

## Bekannte Probleme / offene Punkte in Priorität

1. Praxisentscheidung für Absageanfragen (annehmen/ablehnen) fehlt; `decideCancellationSchema` existiert bereits ungenutzt in `src/lib/validation/appointments.ts`.
3. Virenscan/Quarantäne für Uploads vor Pilotbetrieb; aktuell nur Dateityp, Signatur und Größe.
4. Phase C–H lokal mit `db:reset`, `test:rls` und echtem Browser/WCAG-Check prüfen. Danach Phase I (Erinnerungen) abschließen.
5. UX-Beobachtung: Erfolgs-/Fehlermeldungen von Server-Actions gehen verloren, wenn `revalidatePath` die Formular-Komponente neu aufbaut (Abschließen/Zurücknehmen, Angebot annehmen). Der Zustandswechsel selbst ist die Rückmeldung; ein Toast-System wäre die saubere Lösung.
6. E2E: seltener Hänger eines einzelnen Server-Action-Roundtrips nur unter voller Parallellast (untersucht 2026-07-12: keine blockierten DB-Queries, isoliert nie reproduzierbar). Handling: `expect`-Timeout 10 s, 1 Retry mit `trace: on-first-retry` – bei erneutem Auftreten liegt ein Trace in `test-results/`.

## Relevante Dateien

- Kalender: `src/app/(practice)/practice/calendar/` · Logik `src/lib/calendar.ts`
- Termine: `src/server/services/appointments.ts`, `src/server/actions/appointments.ts`, `src/lib/validation/appointments.ts`
- Einheiten/Warnungen: `src/server/{actions,services}/authorizations.ts`, `src/lib/authorization-ledger.ts`, `src/lib/authorization-warnings.ts`, `src/lib/authorization-warning-text.ts`, `src/components/practice/{authorization-panel,reverse-completion-form}.tsx`
- Dokumente/Kurzprofil: `src/server/{actions,services}/documents.ts`, `src/server/services/internal-profile.ts`, `src/components/practice/{document-panel,internal-profile-form}.tsx`
- Markierungen/Warteliste/Angebote: `src/server/{actions,services}/{pinned-patients,waitlist,offers}.ts`, `src/components/practice/{pin-patient-form,waitlist-panel,offer-panel}.tsx`, `src/components/patient/offer-response.tsx`, Seite `src/app/(practice)/practice/waitlist/page.tsx`
- RLS-Tests: `scripts/rls-tests.ts` (`pnpm test:rls`)
- Plan-Builder: `src/components/practice/exercise-plan-builder.tsx`, `src/server/{actions,services}/plans.ts`, `src/lib/{plan-schedule,validation/plans}.ts`
- Durchgänge: `src/lib/occurrences.ts`, `src/server/services/exercise-log.ts`, `src/server/services/patient.ts`
- Geführter Modus: `src/app/(patient)/session/page.tsx`, `src/components/patient/{exercise-log-form,exercise-timer}.tsx`
- Auswertung: `src/lib/adherence-analytics.ts`, `src/server/services/adherence.ts`, `src/server/actions/adherence.ts`
- Neueste Migration: `supabase/migrations/20260713180000_completion_feedback_review.sql`
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

Nächster Auftrag: Phase I – freiwillige In-App-Erinnerungen mit Patienteneinstellungen und Ruhezeiten; Push ehrlich als späteren Ausbau belassen. Vor dem nächsten lokalen Meilenstein Phase C–H mit Supabase/RLS/Browser prüfen. Obsidian-Sync: `pnpm docs:sync` auf Toms Mac (`OBSIDIAN_VAULT_PATH=~/Desktop/UNI-Wissensbasis`); aus der Cloud nicht direkt erreichbar.
