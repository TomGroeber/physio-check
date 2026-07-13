# PhysioCheck – Entscheidungsnotizen

> Kurze, datierte Einträge. Neueste oben.

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
