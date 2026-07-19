# PhysioCheck – Entscheidungsnotizen

> Kurze, datierte Einträge. Neueste oben.

## 2026-07-19 – Kalenderfarben pro Patient

**D-057 · Kalenderfarben gehören zum Patienten, nicht zum Praxismitglied.** Die Praxis vergibt pro Patient (und pro Praxis – nach einem Praxiswechsel behält jede Praxis ihr eigenes Schema) eine Farbe aus der bestehenden 8er-Palette; der Kalender färbt Termine danach, der Name steht immer zusätzlich dabei (WCAG 1.4.1). Neue Tabelle `patient_calendar_colors` nach dem Muster von `pinned_patients`: interne Organisationsdaten, bewusst KEINE Patienten-Policy (Patienten sehen ihre Zuordnung nie), Zuweisen/Ändern verlangt neben der Mitgliedschaft eine aktive Verbindung (`member_can_view_patient`). Das alte Feld `practice_members.calendar_color` samt Auswahl in den Einstellungen ist ersatzlos entfernt – zwei parallele Farbsysteme im selben Kalender wären mehrdeutig. „Keine Farbe“ ist der Normalzustand: Termine ohne Zuordnung bleiben neutral, die Legende zeigt nur zugeordnete Patienten im sichtbaren Zeitraum.

## 2026-07-19 – Dunkelmodus für Patienten

**D-056 · Dunkelmodus ist eine reine Patienten-Geräteeinstellung.** Die vorbereitete `.dark`-Token-Palette wird jetzt genutzt: Die Wahl liegt in einem Cookie (`pc-theme`, 1 Jahr, kein Gesundheits-/Kontobezug) und die `.dark`-Klasse liegt ausschließlich auf dem Wrapper des Patienten-Layouts – nie auf `<html>`. Der Praxisbereich liest das Cookie nicht und bleibt dadurch immer hell, selbst auf einem Gerät mit gespeicherter Dunkel-Wahl. Der Umschalter (Hell/Dunkel als große Radio-Flächen) steht nur im Patientenprofil, wirkt sofort ohne Server-Roundtrip und wird serverseitig beim nächsten Render aus dem Cookie bestätigt (kein Flackern).

## 2026-07-19 – Video-first-Übungsansicht und Profilbilder

**D-055 · Patientenansicht zeigt keine beschreibenden Langtexte mehr.** Kurzbeschreibung, Ausgangsposition, Durchführungsschritte und häufige Fehler bleiben vollständig in der Datenbank und in der Übungsbibliothek der Praxis bearbeitbar, erscheinen aber nicht mehr auf der Patienten-Übungsseite und im geführten Modus. Dort stehen Video (16:9, auf Mobilgeräten randlos) und kompakte Vorgaben (Dosierungs-Chips, Häufigkeit, Uhrzeiten, Hilfsmittel, Praxisnotiz) im Vordergrund – gemeinsame Komponente `ExerciseView`, damit beide Ansichten identisch bleiben. Historische Daten und Snapshots sind unberührt.

**D-054 · Profilbild als serververwalteter Pfad + privater Bucket.** `profiles.avatar_path` zeigt auf genau ein Objekt in `patient-avatars` (`<profile_id>/<uuid>.<ext>`, kein Name/keine E-Mail im Pfad). Die Spalte ist für Clients nicht beschreibbar (Spaltenrechte wie bei `calendar_color`, D-033); alle Schreibwege laufen über das bewährte Ticket-Muster der Übungsmedien (D-034) mit serverseitiger Größen- und Magic-Byte-Prüfung (inkl. WebP). Die einzige Storage-Policy erlaubt Lesen dem Patienten selbst und aktiven Mitgliedern der AKTUELL verbundenen Praxis (`member_can_view_patient`); eine ehemalige Praxis verliert den Zugriff mit dem Praxiswechsel automatisch. Auslieferung ausschließlich über kurzlebige signierte URLs nach Pfadprüfung; Ersetzen und Entfernen löschen das alte Objekt und werden ohne Dateinamen auditiert. Bewusst keine eigene Avatar-Tabelle: ein einzelnes aktuelles Bild ohne Historie braucht keinen zweiten Mandantenpfad.

## 2026-07-19 – Lokale Verifikation der Patientenoberfläche

**D-053 · Patientenbestätigungen per Redirect, nicht per Rückgabezustand.** Server-Actions, die nach Erfolg `revalidatePath` aufrufen und einen Zustand zurückgeben, erreichen den Client unter Next 16 nachweislich unzuverlässig (Formular bleibt „Wird geladen …“ oder die Aktualisierung wird verworfen; lokal reproduziert bei Terminabsage und E-Mail-Änderung). Patientenkritische Bestätigungen folgen deshalb dem bestehenden Muster der Übungsdokumentation: Redirect mit Query-Parameter (`/appointments?cancellation_requested=1`, `/profile?email_change_requested=1`), die Zielseite zeigt die Bestätigung. Fehlerfälle geben weiterhin direkt einen Zustand zurück (kein `revalidatePath` → zuverlässig). Praxisformulare bleiben vorerst unverändert; die Beobachtung ist in `docs/AI_HANDOFF.md` festgehalten.

**D-052 · Signaturprüfung liest die Range-Antwort vollständig.** `reader.cancel()` auf einem angelesenen Fetch-Body kehrt im Next-Server-Kontext nie zurück; die Medien-Finalisierung hing dadurch dauerhaft. Da `Range: bytes=0-15` die Antwort ohnehin auf 16 Bytes begrenzt, wird sie jetzt vollständig gelesen – kein manueller Reader, kein Cancel.

**D-051 · Seed-Aufräumen ist deterministisch und laut.** Mehrere Tabellen blockieren per `NO ACTION`-Fremdschlüssel das kaskadierende Löschen von Praxis und Demo-Benutzern (Einladungen, Verordnungen samt Anrechnungen, Dokumente, Selbstauskünfte an Plan-Items). Der Seed löscht diese Bestände jetzt in fester Reihenfolge vor der Praxis und wirft bei jedem Fehler sofort – vorher wurden Löschfehler verschluckt und der Seed scheiterte erst später unverständlich („already registered“) bzw. nur bei jedem zweiten Lauf.

## 2026-07-18 – Konsolidierte Patientenoberfläche und Kontosicherheit

**D-050 · Claude-Stand erhalten und gezielt vervollständigt.** Seed-Fix, Notification-RPC, pending E-Mail und getrennte Sicherheitsformulare bleiben erhalten. Fehlende Bedienvereinfachungen, Tests und Statussemantik wurden als Folgecommit ergänzt; es wurde kein Stand blind überschrieben.

**D-049 · Positive Rückmeldung respektiert den dokumentierten Status.** Nur `completed` erhält „Geschafft“. `partial`, `too_difficult` und `not_possible` erhalten eine wertungsfreie Speicherbestätigung. Die serverseitige Occurrence-Logik bleibt unverändert.

**D-048 · Kontoänderungen bleiben an die authentifizierte Patientensession gebunden.** Zieladresse und Identität stammen nie frei aus dem Client. E-Mail-Änderung nutzt Supabase-Doppelbestätigung, Passwortänderung den internen Confirm-/Recovery-Ablauf. Keine Service-Role-Nutzung.

## 2026-07-13 – Testabschluss (Phase J)

**D-047 · Getrennte Testebenen mit ehrlichem Status.** Reine Schedule-, Grenzwert- und Fortschrittslogik bleibt schnell in Vitest. Rollen-, Mandanten-, Versionierungs- und Einladungszustände laufen gegen echte lokale Supabase-Sitzungen in `test:rls`. Browserinteraktion, Upload-Ticket, Mailpit und neues Gerät laufen in Playwright. Eine nur gelistete, aber infrastrukturell nicht ausgeführte RLS-/Browser-Spezifikation gilt ausdrücklich nicht als bestanden; `docs/TEST_MATRIX.md` hält Abdeckung und tatsächlichen Laufstatus getrennt fest.

## 2026-07-13 – Freiwillige Erinnerungen (Phase I)

**D-046 · Notification-Inhalte sind für Empfänger unveränderlich.** Das bisher breite Tabellen-Update-Recht wurde entzogen. `mark_notification_read` darf unter RLS ausschließlich `read_at` für eine eigene Notification setzen; Titel, Text, Typ, Referenz und Empfänger bleiben servererzeugt. Reminder-Präferenzen liegen in einer eigenen Tabelle und sind ausschließlich für das eigene Profil les-/schreibbar.

**D-045 · In-App zuerst, Push später.** Übungshinweise werden aus dem aktuellen Soll-/Dokumentiert-Stand berechnet und nur außerhalb einer selbst gewählten Ruhezeit in der Praxiszeitzone angezeigt. Patienten können Übungs- und Planhinweise getrennt deaktivieren. Es gibt bewusst noch keinen Push-/E-Mail-Versand; dadurch wird keine unverhältnismäßige Infrastruktur vorgetäuscht und es gelangen keine Gesundheitsdaten in Geräte- oder E-Mail-Vorschauen.

## 2026-07-13 – Praxis-Auswertung (Phase H)

**D-044 · Lesestatus getrennt vom unveränderlichen Gesundheitsinhalt.** Completion-Logs bleiben ohne allgemeine Update-Policy. Nur `mark_completion_log_reviewed` darf nach Prüfung der planbesitzenden Praxis `reviewed_at/by` setzen; Status, Schmerz, Notiz, Snapshot und Zeitpunkt bleiben unberührt. Fremdpraxis und Patient können den Praxis-Lesestatus nicht setzen.

**D-043 · Soll nach aktueller Planversion und Kalenderwochen.** 7-/30-Tage-Sollwerte verwenden Items der aktuellen Version und deren Start-/Enddatum. Feste Wochentage sind exakt zählbar. Flexible Wochenziele werden je ISO-Kalenderwoche gezählt und in Teilwochen höchstens mit der Zahl verfügbarer Tage angesetzt. Die UI bezeichnet dies ausdrücklich als Soll aus der aktuellen Planversion, nicht als Beweis der Durchführung.

## 2026-07-13 – Geführter Patientenmodus (Phase G)

**D-042 · Serverberechnete Warteschlange statt Client-Sessionzustand.** `/session` zeigt immer den ersten aktuell offenen Durchgang aus `getPatientTodayData`. Nach jeder Selbstauskunft erfolgt ein Redirect und eine frische Datenbankberechnung. Dadurch kann ein alter Browserzustand weder einen inzwischen dokumentierten Durchgang wiederholen noch einen neuen Plan übersehen. Der optionale Timer bleibt eine reine Bedienhilfe und dokumentiert niemals automatisch.

## 2026-07-13 – Mehrere Durchgänge (Phase F)

**D-041 · Dokumentiert ist nicht automatisch erledigt.** Jeder Status verbraucht den betreffenden geplanten Durchgang als dokumentierte Selbstauskunft. Nur `completed` zählt zusätzlich als vollständig erledigt. So bleibt eine Rückmeldung „teilweise“, „zu schwierig“ oder „nicht möglich“ sichtbar, ohne fälschlich Erfolg zu behaupten.

**D-040 · Serververgebener Occurrence-Index statt Client-Zähler.** `record_exercise_occurrence` bestimmt Praxisdatum, Wochenstand und nächsten freien Tagesindex unter einer Transaktionssperre. Der Client kann keine Durchgangsnummer erfinden; ein Unique-Index verhindert parallele Doppelanlage. Historische Logs werden nach Zeitstempel nummeriert und niemals gelöscht oder zusammengeführt. Flexible Wochenziele erlauben höchstens einen dokumentierten Durchgang pro Tag.

## 2026-07-13 – Individuelle Übungspläne (Phase D/E)

**D-039 · Patienten lesen Pläne nur aus der aktuell verbundenen Praxis.** `can_access_plan`, `patient_can_view_exercise` und die Plan-Select-Policy verlangen zusätzlich den aktiven Praxislink. Ein Praxiswechsel überträgt oder öffnet keine alten Plan-/Mediendaten; die frühere Praxis behält ihre Dokumentationshistorie.

**D-038 · Planmutationen ausschließlich atomar per RPC.** Direkte Client-Policies für Plan-, Versions- und Item-Schreibzugriffe wurden entfernt. `publish_exercise_plan` prüft Mitgliedschaft, aktiven Patientenlink, Übungen, Grenzen und Schedule, erzeugt dann Version, vollständige Items, aktuellen Zeiger, Notification und Audit in einer Transaktion. Parallelaufrufe werden je Praxis+Patient serialisiert; höchstens ein aktiver Plan ist erlaubt.

**D-037 · Zwei explizite Schedule-Modi mit Legacy-Normalisierung.** Neue Planversionen speichern entweder feste ISO-Wochentage mit 1–6 Tagesdurchgängen und optionalen Uhrzeiten oder ein flexibles Ziel von 1–7 Durchgängen pro Woche. Alte `{weekdays}`-/`{times_per_week}`-Werte bleiben lesbar und werden beim nächsten Veröffentlichen in das typisierte Format überführt.

## 2026-07-13 – Übungsmedien (Phase C)

**D-036 · Repository aktuell öffentlich, Secrets bleiben strikt extern.** Tom hat das Repository für die Zusammenarbeit zwischen Claude und ChatGPT öffentlich geschaltet. Der Quellcode enthält ausschließlich fiktive Seed-Daten und Platzhalter; `.env.local`, Schlüssel, Uploads und echte Patientendaten bleiben ausgeschlossen. Vor jedem Push wird der Diff weiterhin auf Geheimnisse und personenbezogene Daten geprüft.

**D-035 · Genau ein Medium je Art und Übung.** Der eindeutige Index `(exercise_id, kind)` erlaubt pro Übung höchstens ein Video, ein Vorschaubild, ein Alternativbild und eine Untertiteldatei. Ersetzen erfolgt per Upsert; die bisherige Storage-Datei wird anschließend entfernt. Alte signierte URLs liefern nach der Objektlöschung keinen Inhalt mehr.

**D-034 · Direkter Ticket-Upload, serverseitige Finalisierung.** Große Videos laufen nicht durch eine Next.js Server Action. Nach Mitgliedschafts- und Übungsprüfung erzeugt der Server einen zufälligen, eng begrenzten signierten Upload-Pfad; der Browser lädt mit echtem Fortschritt direkt in den privaten Bucket. Erst die anschließende Server-Finalisierung prüft Pfad, Größe und Magic Bytes, registriert das Medium und auditiert die Aktion. Nicht finalisierte Objekte werden bestmöglich entfernt. Ein Malware-Scanner ist weiterhin Voraussetzung vor echtem Pilotbetrieb.

## 2026-07-11 – Etappe 2

**D-033 · Kalenderfarbe als einziges selbst änderbares Mitgliedsfeld.** Das breite Update-Recht auf `practice_members` wurde entzogen und durch ein Spaltenrecht nur für `calendar_color` plus eine RLS-Policy auf die eigene Zeile ersetzt. Damit kann ein Mitglied seine Farbe selbst wählen, aber niemals Rolle oder Aktiv-Status ändern – per API-Probe verifiziert. Farben sind eine feste 8er-Palette; im Kalender steht der Name immer neben der Farbe (WCAG 1.4.1).

**D-032 · Telefonnummer liegt beim Profil.** `profiles.phone` gehört der Person: Patienten pflegen sie über die bestehende „update own“-Policy selbst. Die Praxis darf sie nur über die SECURITY-DEFINER-Funktion `set_patient_phone` korrigieren, die aktive Mitgliedschaft und aktive Patientenverbindung prüft. Optional und formatoffen (max. 30 Zeichen, nur Ziffern und übliche Zeichen) – Datenminimierung, keine Pflichtangabe.

## 2026-07-11 – Konsolidierung und Verifikation

**D-031 · Repository ist privat.** Das GitHub-Repository `TomGroeber/physio-check` war versehentlich öffentlich und wurde auf privat gestellt. Es enthielt keine Secrets (nur Platzhalter in `.env.example`), aber ein Gesundheits-App-Projekt bleibt grundsätzlich privat.

**D-030 · Ein Projektstamm, keine Parallelkopien.** Die als kompletter Ordner `physio-check-phase-ef-updated/` angelieferte Phase-E/F-Implementierung wurde in das Hauptprojekt übernommen und der Ordner gelöscht (Git-Historie behält ihn). Der Root des Repositories ist die einzige technische Wahrheit; künftige Zulieferungen werden direkt dort integriert. Beim ersten echten Datenbanklauf wurde in der Migration `20260711230000` der Alias `authorization` (reserviertes PostgreSQL-Schlüsselwort) zu `auth_rec` korrigiert – die Migration war zuvor in keiner Umgebung ausgeführt worden.

## 2026-07-11 – Phase E/F

**D-029 · Dokumente bleiben praxisintern.** Patientendokumente sind ausschließlich für aktive Praxismitglieder sichtbar. Der Bucket ist privat; Dateinamen sind zufällig und Ansichten verwenden 60 Sekunden gültige signierte URLs. Upload/Archivierung werden auditiert. Vor einem Pilotbetrieb ist zusätzlich ein Virenscan mit Quarantäne erforderlich.

**D-028 · Sitzungskorrekturen sind append-only.** Der Ausgangswert einer Verordnung wird nicht still überschrieben. Jede manuelle Korrektur ist ein Delta mit Pflichtgrund; verbleibend wird aus Grundwert + Anpassungen − Termin-Nutzungen berechnet.

**D-027 · Terminabschluss rechnet atomar an.** Das Abschließen eines geplanten Termins und die Anrechnung genau einer verfügbaren, gültigen Verordnung laufen in einer PostgreSQL-Funktion. Ohne verfügbare Verordnung wird der Termin abgeschlossen, aber keine Sitzung erfunden.

**D-026 · Keine Erstattungszusage.** Die Sitzungsanzeige ist eine organisatorische Übersicht und macht keine Zusage zur Kostenübernahme durch eine luxemburgische Krankenkasse.

## 2026-07-11 – Phase D

**D-025 · Eigener servergerenderter Kalender.** Monat, Woche, Tag und Liste werden mit kleinen reinen Datumshelfern umgesetzt. Keine zusätzliche Kalenderbibliothek: weniger Abhängigkeiten, vollständige Tastatur-/Listenbedienung und kompatibel mit Next.js 16/React 19.

**D-024 · Konfliktschutz in PostgreSQL.** Ein partieller GiST-Exclusion-Constraint verhindert überlappende aktive Termine desselben Therapeuten atomar, auch bei parallelen Requests. Stornierte und abgeschlossene Termine blockieren nicht.

**D-023 · Termine werden nie gelöscht.** Stornierung und Abschluss ergänzen Status, Zeitpunkt und ausführende Person. Historie bleibt erhalten; neutrale Gründe enthalten keine Gesundheitsdetails.

**D-022 · Absageanfrage als atomare DB-Funktion.** Patientenanfrage, Terminstatus und datensparsame Notifications an aktive Praxisnutzer entstehen in einer Transaktion.

## 2026-07-11 – Phase C

**D-021 · Lokales E-Mail-Limit angehoben.** `supabase/config.toml` erlaubt lokal 100 statt 2 Auth-E-Mails pro Stunde, damit der E2E-Kernablauf (Registrierung + Bestätigung über Mailpit) wiederholbar läuft. Betrifft nur die lokale Entwicklungsumgebung.

**D-020 · Duplikatschutz applikationsseitig.** Doppelte Dokumentation desselben Plan-Items am selben Kalendertag (Praxiszeitzone) wird serverseitig geprüft und abgewiesen; bewusst kein Unique-Constraint, damit spätere Verordnungen wie „2× täglich" möglich bleiben (siehe Datenmodell). Ein theoretisches Parallel-Race erzeugt schlimmstenfalls einen zweiten Eintrag, verfälscht aber nichts und bleibt sichtbar.

**D-019 · Protokolle gehören zur Praxis des Plans.** Neue Migration ersetzt die Lese-Policy für `completion_logs`: Praxismitglieder lesen nur Protokolle, deren Plan-Item zu einem Plan der eigenen Praxis gehört. Nach einem Praxiswechsel sieht die neue Praxis keine alte Dokumentation; die frühere Praxis behält ihre eigene Behandlungsdokumentation.

**D-018 · Registrierung ohne Einladung.** Produktentscheidung (ersetzt D-017): Jeder Besucher kann ein Patientenkonto erstellen (Name, E-Mail, Passwort). Das Konto bleibt unverbunden und sieht nur den geschützten Bereich `/connect` (Codeeingabe, Basiskonto, Abmelden). Erst ein geprüfter Code verbindet mit der Praxis; alle Sicherheitsmechanismen der Einladung (Hash, 7 Tage, einmalig, Widerruf/Erneuerung, Rate Limit, atomare Einlösung, Audit) bleiben unverändert. Keine Schemaänderung nötig – reine Anwendungslogik. Eine Registrierung kann weiterhin niemals eine Therapeuten- oder Adminrolle erzeugen.

## 2026-07-11 – Phase B

**D-017 · Einladung vor Registrierung.** `/register` ist ohne kurz zuvor serverseitig geprüfte Einladung nicht erreichbar. Die Prüfung erzeugt eine 30 Minuten gültige, HMAC-signierte HttpOnly-Sitzung; der Klartextcode wird nicht im Browser-State gespeichert.

**D-016 · Praxiswechsel statt paralleler aktiver Praxen.** Im MVP hat ein Patient genau eine aktive Praxis. Beim bestätigten Wechsel wird die alte Verbindung beendet, aber als Historie erhalten. So bleiben Daten eindeutig mandantenbezogen; ein späterer Mehrpraxis-Modus kann bewusst ergänzt werden.

**D-015 · Atomare Code-Einlösung.** `redeem_patient_invite` sperrt die Einladung, prüft Gültigkeit, wechselt die Praxisverbindung und markiert den Code in einer DB-Transaktion als benutzt. Parallelaufrufe können denselben Code nicht doppelt einlösen.

**D-014 · Persistentes Rate Limiting.** Fehlversuche werden serverseitig in `invite_redemption_attempts` gezählt. Gespeichert wird nur ein HMAC-Fingerabdruck; IP-Adresse und User-Agent werden nicht im Klartext abgelegt.

**D-013 · Einladungshash nicht für Praxisclients lesbar.** Spaltenrechte schließen `code_hash` aus; direkte Updates sind auf `revoked_at` begrenzt. Codes werden nur einmal im Klartext an den Ersteller zurückgegeben.

## 2026-07-11 – Phase 1

**D-012 · Explizite Datenbank-Grants.** Die aktuelle Supabase-CLI vergibt keine Standard-Datenrechte mehr. Modell: `anon` keinerlei Datenzugriff, `authenticated` Datenrechte nur durch RLS gefiltert, `service_role` voll (nur serverseitig). In der Migration dokumentiert.

**D-011 · Schrift Atkinson Hyperlegible.** Vom Braille Institute für maximale Lesbarkeit bei eingeschränktem Sehvermögen entwickelt – passend zur Zielgruppe. Geladen über `next/font` (keine externen Requests zur Laufzeit).

**D-010 · `proxy.ts` statt `middleware.ts`.** Next.js 16 hat Middleware in „Proxy" umbenannt; der Proxy übernimmt nur das Supabase-Session-Refresh. Zugriffsschutz liegt in Layouts/Services + RLS.

**D-009 · Seeds als TypeScript-Skript** (`pnpm seed`) über die Admin-API statt `seed.sql`, weil Auth-Benutzer sauber nur über die API entstehen. Sicherheitsstopp: läuft nur gegen lokale Instanzen.

**D-008 · Node auf 22.23.1 aktualisiert** (nvm), weil pnpm 11 mindestens Node 22.13 verlangt. Gleiche Hauptversion, kein Migrationsaufwand.

## 2026-07-11 – Phase 0

**D-007 · Keine i18n-Bibliothek im MVP.** Alle Oberflächentexte liegen in einem zentralen Modul `src/messages/de.ts` (strukturierte Keys). Das hält die Abhängigkeiten klein und erlaubt später die Übernahme durch `next-intl` (fr/lb), ohne Texte im Code zu suchen. *Reversibel.*

**D-006 · Rollen ausschließlich in der Datenbank.** `profiles` trägt keine Rolle; Privilegien entstehen nur durch `practice_members`-Zeilen (nur serverseitig beschreibbar). Verhindert Selbst-Eskalation strukturell. Therapeutenkonten entstehen im MVP über Seed-/Admin-Prozess, nicht über Registrierung.

**D-005 · Planversionierung + Snapshot.** Übungspläne sind versioniert (`exercise_plan_versions`); Durchführungsprotokolle referenzieren das versionierte Plan-Item und speichern zusätzlich einen `prescription_snapshot`. Alte Protokolle können durch Planänderungen nicht verfälscht werden.

**D-004 · Einladungscodes.** Alphabet ohne verwechselbare Zeichen (`ABCDEFGHJKMNPQRSTUVWXYZ23456789`), ≥ 10 Zeichen, nur Hash in der DB, 7 Tage gültig, einmal verwendbar, widerrufbar; Einlösung ratenbegrenzt mit konstanter Fehlermeldung („ungültig oder abgelaufen" – kein Hinweis, welcher Fall vorliegt).

**D-003 · Supabase gekapselt.** Frontend spricht nie direkt mit Supabase-Tabellen; alle Zugriffe laufen über `src/server/services` → `src/server/db`. RLS bleibt als zweite Verteidigungslinie auf jeder patientenbezogenen Tabelle aktiv.

**D-002 · Auth über `@supabase/ssr`.** Die früheren `@supabase/auth-helpers` sind deprecated; `@supabase/ssr` ist der offiziell empfohlene Weg für den App Router (Cookie-Sessions, getrennte Browser-/Server-Clients, Middleware-Refresh).

**D-001 · Stack bestätigt (geprüft 2026-07-11).** Next.js 16 (App Router, TypeScript strict), Tailwind CSS v4 (Design-Tokens via `@theme`), shadcn/ui (Tailwind-v4- und React-19-kompatibel), Supabase, Zod, React Hook Form, Vitest + Testing Library, Playwright, pnpm. Exakte Versionen werden bei Projekterstellung in Phase 1 gepinnt und im README dokumentiert. Umgebung: Node v22.12.0 vorhanden; pnpm und Supabase CLI müssen in Phase 1 installiert werden.
