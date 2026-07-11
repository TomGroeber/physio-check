# Folgeauftrag für Claude Fable 5 – PhysioCheck Phase D–G und GitHub-Handoff

Du arbeitest im **bestehenden Repository `~/physio-check`** weiter. Erstelle kein neues Projekt, keine zweite App und keine parallele Implementierung. Der aktuelle Code und die vorhandene Git-Historie sind die einzige technische Wahrheit. Lies zuerst den Bestand und arbeite danach unmittelbar weiter. Stoppe nicht nach Analyse oder Planung, solange kein echtes technisches Hindernis besteht.

## 1. Aktueller Stand, den du zuerst verifizieren musst

Phase C wurde laut letztem Abschlussbericht vollständig umgesetzt:

- Registrierung ist wieder ohne vorherige Einladung möglich.
- Nach Registrierung und E-Mail-Bestätigung ist ein unverbundenes Patientenkonto auf den Verbindungsbereich beschränkt.
- Ein Physiotherapeut kann pro Patient einen Code erzeugen.
- Der angemeldete Patient gibt den Code ein und wird anschließend mit der Praxis verbunden.
- Ungültige, abgelaufene, widerrufene und verwendete Codes werden abgewiesen.
- Praxiswechsel ist konzeptionell über eine neue Einladung möglich.
- Patienten können zugewiesene Übungen als erledigt, teilweise erledigt, zu schwierig oder nicht möglich dokumentieren.
- Tagesfortschritt aktualisiert sich.
- Doppelte Dokumentation desselben Plan-Items am selben Tag wird verhindert.
- Physiotherapeuten sehen die Selbstauskünfte auf der Patientendetailseite.

Laut Bericht wurden unter anderem neu angelegt:

- `src/app/(auth)/connect/page.tsx`
- `src/app/(patient)/exercises/[planItemId]/...`
- `src/app/(practice)/practice/patients/[patientId]/page.tsx`
- `src/server/services/exercise-log.ts`
- `src/server/actions/exercise-logs.ts`
- `src/lib/plan-schedule.ts`
- `src/lib/validation/exercise-logs.ts`
- `e2e/core-flow.spec.ts`

Laut Bericht waren erfolgreich:

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test` mit 32 Unit-/Komponententests
- `pnpm db:reset`
- `pnpm seed`
- `pnpm e2e` mit 28 Tests
- `pnpm build`

Vorhandene Commits laut Bericht:

- `4588ceb` – Initial-Commit des Phase-B-Stands
- `4e1ed64` – Registrierung
- `a9a815d` – Übungsdokumentation
- `9acc17e` – Dokumentation

Verifiziere diese Angaben mit:

```bash
pwd
git status
git log --oneline --decorate -15
git remote -v
git branch --show-current
```

Lies vollständig:

- `README.md`
- `CLAUDE.md`
- `NEXT_TASK.md`
- `TASKS.md`
- `DECISIONS.md`
- alle Dateien unter `docs/`
- relevante Migrationen, Services, Actions, Seiten und Tests

Wenn Bericht und Repository voneinander abweichen, gilt der Repository-Stand. Dokumentiere die Abweichung und repariere nicht blind.

## 2. Noch fehlende, verbindlich zu implementierende Funktionen

Die folgenden Punkte sind keine späteren Ideen, sondern müssen jetzt als echte, getestete Funktionen umgesetzt werden:

1. klassischer, interaktiver Kalender für die Praxis,
2. Termine im Kalender erstellen, einsehen, bearbeiten, stornieren und abschließen,
3. sichere Dokumenten-/Patientenakten-Verwaltung pro Patient,
4. verordnete, verbrauchte und verbleibende Sitzungen pro Patient,
5. vollständiger Code-Verbindungs- und Praxiswechsel-Ablauf,
6. Notifications für relevante Terminereignisse,
7. GitHub als verbindliche gemeinsame Quelle für Claude und ChatGPT,
8. dauerhafte KI-Übergabedokumentation nach jedem Arbeitsauftrag.

## 3. GitHub zuerst sicher einrichten

Der Benutzer möchte, dass Claude und ChatGPT jederzeit auf demselben aktuellen Stand weiterarbeiten können. GitHub wird deshalb die gemeinsame technische Quelle.

### Vor dem ersten Push

Prüfe:

```bash
git status
git remote -v
gh auth status
git ls-files
```

Stelle sicher, dass niemals committed oder gepusht werden:

- `.env`
- `.env.local`
- echte Supabase-Schlüssel
- Zugangstokens
- echte Patienten- oder Gesundheitsdaten
- `node_modules/`
- `.next/`
- `playwright-report/`
- `test-results/`
- `.claude/settings.local.json`
- `supabase/.temp/`
- `__MACOSX/`
- der temporäre Unterordner `PHYSIOCHECK_PHASE_B/`

Erweitere `.gitignore`, falls nötig. Prüfe vor dem Push staged Dateien und Diff auf Secrets.

### Remote-Regeln

- Wenn bereits ein plausibler Remote für PhysioCheck existiert, verwende ihn.
- Wenn kein Remote existiert, richte ein **privates** GitHub-Repository namens `physio-check` unter dem aktuell authentifizierten GitHub-Konto ein.
- Erstelle niemals versehentlich ein öffentliches Repository.
- Wenn mehrere GitHub-Konten oder ein unklarer Remote zur Auswahl stehen, frage einmal nach dem Ziel. Rate nicht.
- Verwende `main` als Hauptbranch, sofern der bestehende Branch nicht bewusst anders benannt ist.
- Push den verifizierten Ausgangsstand vor größeren neuen Änderungen.

GitHub-Zugangsdaten oder Tokens dürfen niemals in Dateien oder Ausgaben übernommen werden.

## 4. Verbindlicher KI-Handoff nach jedem Auftrag

Nach jedem Benutzerauftrag, der Code oder Produktverhalten verändert, musst du vor dem Abschluss:

1. `README.md` aktualisieren,
2. `CLAUDE.md` aktualisieren,
3. `TASKS.md` aktualisieren,
4. `DECISIONS.md` aktualisieren,
5. `docs/AI_HANDOFF.md` neu anlegen oder aktualisieren,
6. Tests ausführen,
7. logisch getrennte Commits erstellen,
8. auf den konfigurierten GitHub-Remote pushen.

`README.md` benötigt einen kompakten Abschnitt **Aktueller Entwicklungsstand** mit:

- zuletzt abgeschlossener Phase,
- tatsächlich funktionierenden Funktionen,
- bekannten Einschränkungen,
- exakt nächstem Arbeitsschritt,
- Datum und letztem Commit-Hash,
- Link auf `docs/AI_HANDOFF.md`.

`docs/AI_HANDOFF.md` ist die detaillierte Übergabedatei für eine andere KI und enthält:

- Produktziel,
- Stack und Laufzeitversionen,
- Architekturgrenzen,
- Datenmodell und neueste Migration,
- abgeschlossene Funktionen,
- offene Funktionen nach Priorität,
- bekannte Bugs und Risiken,
- zuletzt ausgeführte Tests mit Ergebnis,
- Demo-Konten und rein fiktive Testdaten,
- lokale Startbefehle,
- relevante Dateipfade,
- letzte Commits,
- Remote-/Branch-Information ohne Zugangsdaten,
- konkreten nächsten Auftrag.

README bleibt übersichtlich. Detaillierte Sitzungsprotokolle gehören in `docs/AI_HANDOFF.md`, nicht als endlose Chronik in README.

## 5. Phase D – Klassischer, aktiv nutzbarer Praxiskalender

Der bisherige Terminbereich ist nur eine Übersicht. Ersetze bzw. erweitere ihn zu einem echten Arbeitskalender für Physiotherapeuten.

### Kalenderoberfläche

Erstelle einen Hauptbereich **Kalender**, zum Beispiel unter `/practice/calendar`, mit:

- Monatsansicht,
- Wochenansicht,
- Tagesansicht,
- alternativ zugänglicher Terminlistenansicht,
- Navigation zu vorherigem/nächstem Zeitraum und „Heute“,
- Darstellung aller Termine der aktiven Praxis,
- Patient, Uhrzeit, Dauer, behandelnder Physiotherapeut, Standort und Status,
- Filtern nach Therapeut, Patient, Standort und Status,
- visueller, aber nicht nur farblicher Statuskennzeichnung.

Prüfe vor Installation die offizielle Dokumentation einer stabilen Kalenderbibliothek und ihre Kompatibilität mit Next.js 16 und React 19. Halte zusätzliche Abhängigkeiten gering. Alle Kernfunktionen müssen per Tastatur erreichbar sein.

### Kalenderaktionen

Der Physiotherapeut kann:

- durch Auswahl eines Tages/Zeitfensters einen Termin anlegen,
- einen bestehenden Termin öffnen,
- Datum, Startzeit, Dauer, Patient, Therapeut und Standort ändern,
- einen Termin mit Bestätigungsdialog stornieren,
- einen optionalen neutralen Stornierungsgrund angeben,
- einen Termin als abgeschlossen markieren,
- direkt vom Termin zur Patientendetailseite wechseln.

Fachliche und technische Regeln:

- Stornierte Termine werden nicht gelöscht.
- Ergänze nachvollziehbare Felder wie `cancelled_at`, `cancelled_by_profile_id` und optional `cancellation_reason` über eine neue Migration.
- Konflikte desselben Physiotherapeuten müssen serverseitig verhindert werden.
- Alle Schreibvorgänge über Server Actions/Services und Zod validieren.
- Praxis-ID ausschließlich aus der verifizierten serverseitigen Mitgliedschaft ableiten.
- Zeitzone `Europe/Luxembourg`, UTC-Speicherung und Sommer-/Winterzeit korrekt behandeln.
- Kritische Änderungen auditieren, ohne Gesundheitsdetails in Audit-Metadaten.

### Termin-Notifications

- Storniert der Physiotherapeut einen Termin, erhält der Patient eine In-App-Notification.
- Stellt der Patient eine Absageanfrage, erhalten zuständige Praxisnutzer eine Notification.
- Bestätigung oder Ablehnung einer Anfrage wird dem Patienten angezeigt.
- Notification-Titel und Vorschau enthalten keine Diagnose oder sensiblen Gesundheitsdetails.
- Gelesen/ungelesen und Badge-Zähler implementieren, sofern noch nicht vorhanden.

## 6. Patientenverbindung, Codes und Praxiswechsel vollständig prüfen

Der gewünschte Ablauf ist:

1. Patient erstellt ein Konto.
2. Patient bestätigt E-Mail und meldet sich an.
3. Unverbundenes Konto landet zwingend bei der Codeeingabe.
4. Physiotherapeut erzeugt für den vorbereiteten Patienten einen individuellen Code.
5. Patient gibt diesen Code ein.
6. Nach erfolgreicher Einlösung ist der Patient unmittelbar mit der Praxis verbunden und sieht seine Daten.
7. Der Code ist einmalig, zeitlich begrenzt, widerrufbar und nur als Hash gespeichert.
8. Neues Gerät: normaler Login, kein neuer Code erforderlich.
9. Praxiswechsel: Patient kann einen Code einer neuen Praxis eingeben, sieht vorher eine klare Wechselwarnung und bestätigt den Wechsel.
10. Alte Praxisverbindung wird beendet und bleibt als Historie erhalten. Daten werden nicht übertragen.

Phase C soll diesen Ablauf bereits enthalten. Verifiziere ihn im Code und mit E2E-Tests. Ergänze fehlende UI für **Praxis wechseln** im Patientenprofil. Ein Code darf nur den vorbereiteten Patientendatensatz verbinden, für den er erzeugt wurde. Fremde oder bereits anderweitig verwendete Codes dürfen nicht funktionieren.

## 7. Phase E – Verordnete und verbleibende Sitzungen

In Luxemburg kann eine ärztliche Verordnung eine bestimmte Anzahl physiotherapeutischer Sitzungen umfassen. Die Praxis trägt diese Anzahl ein. Sie kann je nach Verordnung variieren.

Die App dokumentiert den von der Praxis eingetragenen Stand. Sie darf keine Garantie geben, dass eine Krankenkasse tatsächlich zahlt. Zeige deshalb einen neutralen Hinweis, dass Kostenübernahme und Bedingungen mit Praxis und Versicherung zu klären sind.

### Datenmodell

Implementiere mehrere Verordnungen pro Patient, zum Beispiel:

- `treatment_authorizations`
- `appointment_authorization_usages`
- gegebenenfalls `treatment_authorization_adjustments`

Eine Verordnung enthält mindestens:

- `practice_id`
- `patient_profile_id`
- Titel oder interne Referenz
- verordnete Gesamtzahl
- Ausstellungsdatum
- optional Gültigkeitszeitraum
- Status: active, exhausted, expired, archived
- optional verordnender Arzt als Freitext
- optionale interne Notiz
- erstellt/geändert von und Zeitstempel

Berechnung:

- Geplante oder abgesagte Termine reduzieren nichts.
- Nach einer tatsächlich abgeschlossenen Sitzung kann der Physiotherapeut den Termin einer Verordnung anrechnen.
- Verbleibend = verordnete Gesamtzahl plus/minus dokumentierte Anpassungen minus gültig angerechnete abgeschlossene Sitzungen.
- Ergebnis darf nie unbemerkt negativ werden.
- Derselbe Termin darf höchstens einmal angerechnet werden.

### Manuelle Anpassung

Der Physiotherapeut muss die Gesamtzahl bzw. den verfügbaren Stand bei fachlich notwendigen Korrekturen anpassen können. Setze das nicht als unprotokolliertes Überschreiben eines Zählers um.

Verwende nachvollziehbare Anpassungen mit:

- Änderung um `+N` oder `-N` beziehungsweise neuer genehmigter Gesamtzahl,
- Pflichtgrund,
- ausführender Person,
- Zeitstempel,
- Audit-Ereignis.

So kann die Praxis Fehler korrigieren oder eine neue/erweiterte Bewilligung abbilden, ohne Historie zu verlieren.

### Oberflächen

Physiotherapeut auf der Patientendetailseite:

- Verordnung anlegen,
- Gesamtzahl und Zeitraum erfassen,
- aktive Verordnung sehen,
- verwendete und verbleibende Sitzungen sehen,
- Anpassung mit Grund durchführen,
- Termin anrechnen oder Anrechnung korrigieren,
- Historie einsehen.

Patient:

- gut sichtbar „Noch X von Y eingetragenen Sitzungen verfügbar“,
- aktive Verordnung und optionaler Zeitraum,
- neutraler Zustand bei 0,
- Hinweis, dass dies keine verbindliche Kostenzusage ist.

## 8. Phase F – Sichere Patientenakten und Dokumente

Das Hochladen von Dokumenten pro Patient existiert derzeit noch nicht und muss vollständig implementiert werden.

### Patientendetailseite

Ergänze den Bereich **Dokumente/Patientenakte** unter `/practice/patients/[patientId]`.

Physiotherapeuten können:

- Dokument hochladen,
- Titel vergeben,
- Kategorie auswählen, mindestens Verordnung, Befund, Patientenakte, Therapiebericht, Sonstiges,
- optionales Dokumentdatum setzen,
- optionale interne Notiz ergänzen,
- Dokumente chronologisch anzeigen und filtern,
- PDF und unterstützte Bilder ansehen,
- herunterladen,
- ältere Dokumente weiterhin aufrufen,
- archivieren oder nach klarer Bestätigung löschen, abhängig von dokumentierter Aufbewahrungsentscheidung.

### Storage und Sicherheit

- Neuer privater Supabase-Bucket `patient-records`.
- Kein öffentlicher Zugriff.
- Objektpfad aus serverseitig verifizierter `practice_id` und Patientenverknüpfung ableiten.
- Keine Client-Praxis-ID als Vertrauensquelle.
- Zufälliger Storage-Dateiname; Originalname nur in geschützten Metadaten.
- MVP-Dateitypen: PDF, JPEG und PNG.
- Konfigurierbares Größenlimit.
- MIME-Typ und Dateisignatur serverseitig plausibilisieren.
- Signierte Download-/Preview-URL nur nach erneuter Berechtigungsprüfung und kurzlebig erzeugen.
- Patienten sehen interne Akten standardmäßig nicht.
- Nur aktive Mitglieder derselben Praxis erhalten Zugriff.
- Cross-Practice-Zugriff in Datenbank, Storage und Service-Schicht verhindern.
- Upload, Download, Archivierung und Löschung auditieren.
- Keine Dokumenttitel, Originaldateinamen oder Inhalte in normalen Logs oder Audit-Metadaten.

Erstelle eine neue Tabelle wie `patient_documents` mit RLS. Dokumentiere Virenscanning als Blocker vor echtem Pilotbetrieb, wenn lokal kein zuverlässiger Scanner implementiert wird. Stelle ungeprüfte Uploads nicht als produktionsreif dar.

## 9. Zentrale Patientendetailseite

Die Patientendetailseite soll nach Abschluss mindestens enthalten:

- Übersicht,
- Übungen und Selbstauskünfte,
- Termine,
- Verordnungen/Sitzungen,
- Dokumente/Patientenakte,
- Aktivität/Historie.

Die Übersicht zeigt kompakt:

- nächsten Termin,
- aktive Verordnung und verbleibende Sitzungen,
- aktuellen Übungsplan,
- dokumentierte Übungen der letzten sieben Tage,
- markierte Rückmeldungen,
- letzte Dokumente.

Jeder Zugriff auf `[patientId]` muss serverseitig nachweisen, dass der aktuelle Benutzer aktives Mitglied derselben Praxis ist.

## 10. Neue Migrationen und Datenbankregeln

- Bestehende Migrationen nicht umschreiben.
- Neue timestamp-basierte Migrationen erstellen.
- Bestehende lokale Daten sauber migrieren.
- RLS auf jeder neuen Tabelle aktivieren.
- Grants explizit setzen.
- `database.types.ts` nach Migrationen mit `pnpm db:types` regenerieren.
- Kritische Vorgänge atomar implementieren.
- Keine Service-Role-Schlüssel im Client.
- Keine echten Patientendaten in Seed oder Tests.

## 11. Verbindliche Tests

Ergänze mindestens:

### Kalender

- Termin erstellen, bearbeiten, stornieren und abschließen.
- Stornierter Termin bleibt in Historie.
- Fremde Praxis kann Termin nicht sehen oder ändern.
- Überlappender Termin desselben Therapeuten wird abgewiesen.
- Stornierung erzeugt Notification.
- Zeitzone und Sommer-/Winterzeit.

### Praxisverbindung

- neues Konto bleibt bis Codeeinlösung gesperrt,
- gültiger Code verbindet den vorbereiteten Patienten,
- Code ist nur einmal verwendbar,
- Praxiswechsel braucht Bestätigung,
- alte Praxis sieht keine Daten der neuen Praxis und umgekehrt.

### Sitzungen

- geplante/abgesagte Termine reduzieren Restwert nicht,
- abgeschlossener, angerechneter Termin reduziert genau einmal,
- manuelle Anpassung braucht Grund und wird historisiert,
- Restwertberechnung ist korrekt und nicht unbemerkt negativ,
- Patient sieht nur eigene Werte,
- fremde Praxis hat keinen Zugriff.

### Dokumente

- erlaubter Upload funktioniert,
- unerlaubter MIME-Typ und zu große Datei werden abgewiesen,
- fremde Praxis kann Metadaten und Datei nicht lesen,
- Patient kann interne Akte nicht lesen,
- signierte URL nur für Berechtigte,
- Archivierung/Löschung wird bestätigt und auditiert.

Führe nach jeder Teilphase aus:

```bash
pnpm typecheck
pnpm lint
pnpm test
```

Vor Abschluss zusätzlich:

```bash
pnpm db:reset
pnpm seed
pnpm e2e
pnpm build
```

## 12. Arbeitsreihenfolge

1. Aktuellen Code, Git-Status, Tests und Dokumentation verifizieren.
2. GitHub-Remote sicher einrichten und Ausgangsstand privat pushen.
3. Phase D: Kalender und Termin-Notifications vollständig umsetzen.
4. Praxisverbindung und Praxiswechsel gegen Anforderungen prüfen und Lücken schließen.
5. Phase E: Verordnungen und Sitzungsstand vollständig umsetzen.
6. Phase F: Patientenakten und Dokumente vollständig umsetzen.
7. Patientendetailseite integrieren.
8. Vollständige Sicherheits-, RLS-, E2E- und Build-Prüfung.
9. README und `docs/AI_HANDOFF.md` aktualisieren.
10. Logisch getrennte Commits erstellen und auf GitHub pushen.

Stoppe nicht nach einer Planung. Wenn GitHub-Zugriff fehlt, implementiere die lokalen Produktphasen weiter, dokumentiere den konkreten GitHub-Blocker und frage gezielt nach der einmaligen Authentifizierung. Ein fehlender Remote darf nicht als Vorwand dienen, die App-Funktionen nicht zu bauen.

## 13. Abschlussbericht

Berichte nach jeder Phase:

- implementierte Funktionen,
- wesentliche Dateien,
- neue Migrationen,
- Sicherheitsentscheidungen,
- neue Tests,
- Ergebnisse aller Prüfungen,
- bekannte Einschränkungen,
- manueller Testweg für Tom,
- Commit-Hashes,
- Remote und Branch,
- Push-Status,
- nächster Auftrag für eine andere KI.

## Beginne jetzt

Analysiere den aktuellen Repository-Stand und beginne danach unmittelbar mit der sicheren GitHub-Grundlage und Phase D. Das erste sichtbare Ergebnis muss ein klassischer, aktiv nutzbarer Praxiskalender sein. Danach implementierst du Sitzungsanspruch und Patientenakten vollständig. Alle fertigen Änderungen müssen dokumentiert, committed und auf den privaten GitHub-Remote gepusht werden.
