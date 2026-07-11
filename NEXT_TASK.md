# Fortsetzungs-Prompt für Claude Fable 5 – PhysioCheck

Du arbeitest im **bestehenden Repository `physio-check`** weiter. Starte kein neues Projekt, erstelle keine zweite App und ersetze keine funktionierende Architektur ohne konkreten Grund. Untersuche zuerst den aktuellen Stand und arbeite danach direkt weiter. Stoppe nicht nach der Analyse, solange kein echtes technisches Hindernis besteht.

## 1. Rolle und Kommunikation

Du bist leitender Product Engineer, UX-Designer, Softwarearchitekt, Datenbankentwickler und Security-Reviewer für PhysioCheck.

- Erklärungen und Abschlussberichte für Tom auf Deutsch.
- Code, Datenbanktabellen, Typen, Dateinamen und technische Dokumentation auf Englisch.
- Tom hat wenig Programmiererfahrung: erkläre notwendige manuelle Schritte exakt und ohne unnötigen Fachjargon.
- Triff reversible Detailentscheidungen selbstständig.
- Stelle nur Rückfragen, wenn eine Entscheidung die Architektur, Datensicherheit oder fachliche Logik wesentlich verändert.
- Probleme direkt benennen. Keine Features als fertig darstellen, wenn sie nur Mockups oder Platzhalter sind.

## 2. Aktueller verifizierter Projektstand

Der bestehende Stack ist verbindlich:

- Next.js 16 App Router
- React 19
- TypeScript strict
- Tailwind CSS
- shadcn/ui
- Supabase Auth, PostgreSQL, Storage und Row Level Security
- pnpm
- Vitest und Testing Library
- Playwright

Bereits vorhanden:

- rollenabhängige Patienten- und Praxisoberflächen,
- E-Mail-/Passwort-Authentifizierung,
- Praxis-, Mitarbeiter- und Patientenverknüpfungen,
- Übungsbibliothek, Planversionen und Completion-Log-Datenmodell,
- Termine, Absageanfragen und Notifications als grundlegende Tabellen,
- privater Storage-Bucket für Übungsvideos,
- Demo-Daten,
- zentrale deutsche UI-Texte,
- Dokumentation in `README.md`, `CLAUDE.md`, `TASKS.md`, `DECISIONS.md` und `docs/`.

Die folgenden Migrationen existieren und wurden lokal erfolgreich angewendet:

- `supabase/migrations/20260711100000_initial_schema.sql`
- `supabase/migrations/20260711140000_secure_patient_invites.sql`

Phase B wurde zuletzt umgesetzt:

- sichere Einladungscodes,
- Hash-Speicherung,
- Rate Limiting,
- Erstellen, Widerrufen und Erneuern von Codes,
- atomare Code-Einlösung,
- nachvollziehbarer Praxiswechsel,
- Demo-Konto `eingeladen@demo.physiocheck.test`,
- Typecheck, Lint, 16 Unit-/Komponententests und Production Build waren grün.

Wichtig: Der zuletzt implementierte Ablauf prüft die Einladung **vor** der Registrierung. Diese Produktentscheidung ist jetzt geändert und muss sauber migriert werden. Die Sicherheitsmechanismen der Einladung sollen dabei erhalten bleiben.

## 3. Verbindliche Korrektur des Registrierungsablaufs

Der gewünschte Ablauf ist ab jetzt:

1. Ein Besucher öffnet PhysioCheck.
2. Er kann ein neues Patientenkonto mit Name, E-Mail und Passwort erstellen.
3. Er bestätigt seine E-Mail und meldet sich an.
4. Solange das Konto mit keiner Praxis verbunden ist, darf es ausschließlich die Codeeingabe, das eigene Basiskonto, Abmeldung und notwendige rechtliche Hinweise sehen.
5. Erst nach Eingabe und erfolgreicher Prüfung eines vom Physiotherapeuten erzeugten Codes wird das Konto mit dem vorbereiteten Patientendatensatz der Praxis verbunden.
6. Erst danach werden Übungen, Termine, Sitzungsanspruch und weitere Patientendaten freigeschaltet.
7. Auf einem neuen Gerät meldet sich der Patient normal mit E-Mail und Passwort an. Der Code ist kein Login-Ersatz.
8. Ein bestehender Patient kann über einen neuen gültigen Code die Praxis wechseln. Der Wechsel braucht eine klare Bestätigung. Die bisherige Verbindung wird beendet und bleibt als Historie erhalten. Daten werden nicht zwischen Praxen übertragen.

Passe dafür mindestens an:

- öffentliche Startseite,
- `/register`,
- `registerAction`,
- E-Mail-Bestätigung,
- Login-Weiterleitung,
- `/connect` bzw. Einladungseingabe,
- `homeRouteFor`,
- Einladungscookies/-sitzungen,
- deutsche UI-Texte,
- E2E-Tests und Dokumentation.

Die Registrierung darf keine Therapeuten- oder Adminrolle erzeugen. Ein unverbundener Benutzer darf durch direkte URL-Aufrufe oder manipulierte Requests keine Praxis- oder Patientendaten sehen.

## 4. Ziel der nächsten Entwicklungsphasen

Implementiere jetzt folgende Funktionen produktionsnah und als echte End-to-End-Abläufe.

### Phase C – Registrierung korrigieren und Übungen wirklich dokumentieren

#### Patientenregistrierung

Setze den oben beschriebenen neuen Ablauf um. Erhalte dabei:

- sichere Codes,
- sieben Tage Gültigkeit,
- einmalige Nutzung,
- Widerruf und Erneuerung,
- Rate Limiting,
- atomare Einlösung,
- Audit-Ereignisse,
- Mandantentrennung.

Ändere bereits angewendete Migrationen nicht nachträglich. Erstelle neue additive Migrationen mit einem neuen Zeitstempel. Falls reine Anwendungslogik ohne Schemaänderung genügt, dokumentiere das.

#### Abhaken und Dokumentieren von Übungen

Das derzeit sichtbare Abhaken in der Patientenansicht funktioniert noch nicht zuverlässig und muss vollständig implementiert werden.

Ein Patient muss für jede heute fällige Übung:

- die Übungsdetailseite öffnen können,
- Video und genaue Vorgaben sehen,
- die Übung als **erledigt**, **teilweise erledigt**, **zu schwierig** oder **nicht möglich** dokumentieren können,
- optional absolvierte Sätze angeben,
- optional Schmerz vorher und nachher von 0 bis 10 angeben,
- optional eine kurze Notiz hinterlassen,
- nach dem Speichern sofort den aktualisierten Tagesfortschritt sehen.

Fachliche Regeln:

- Es bleibt eine Selbstauskunft, kein Nachweis korrekter Ausführung.
- Keine Formulierung wie „verifiziert“, „bewiesen“ oder „kontrolliert ausgeführt“.
- Der Patient darf nur eigene, aktuell zugewiesene Plan-Items dokumentieren.
- `prescription_snapshot` muss die zum Zeitpunkt der Durchführung gültigen Vorgaben speichern.
- Offensichtliche Doppelerfassungen desselben Plan-Items am selben Tag verhindern.
- Nach erfolgreichem Speichern Button deaktivieren und „Heute dokumentiert“ anzeigen.
- Fehler dürfen keinen falschen Erfolgszustand erzeugen.
- Hohe oder steigende Schmerzwerte lösen nur einen neutralen Hinweis aus, keine Diagnose.

Der Physiotherapeut sieht auf der Patientendetailseite:

- dokumentierte Übungen der letzten 7 und 30 Tage,
- Status, Zeitpunkt, Sätze und optionale Schmerzwerte,
- Notizen und Markierungen wie „zu schwierig“,
- einen klaren Hinweis, dass es Selbstauskünfte sind.

### Phase D – Vollständig nutzbarer Kalender für Physiotherapeuten

Der bisherige Bereich „Termine“ reicht nicht. Der Physiotherapeut braucht einen echten Arbeitskalender.

Erstelle unter beispielsweise `/practice/calendar` einen übersichtlichen Kalender mit:

- Monatsansicht,
- Wochenansicht,
- Tagesansicht,
- allen Terminen der aktiven Praxis,
- Zeit, Dauer, Patient, behandelnder Person, Standort und Status,
- Filtern nach Therapeut, Patient, Standort und Status,
- klarer Kennzeichnung von geplant, Absage angefragt, abgesagt und abgeschlossen.

Der Kalender muss aktiv nutzbar sein:

- neuen Termin durch Auswahl eines Datums/Zeitfensters erstellen,
- bestehenden Termin öffnen,
- Datum, Uhrzeit, Dauer, Therapeut und Standort ändern,
- Termin mit Bestätigungsdialog und optionalem Grund stornieren,
- Termin als abgeschlossen markieren,
- Konflikte für denselben Therapeuten serverseitig prüfen,
- alle Schreibvorgänge mit Zod validieren,
- Zeitzone `Europe/Luxembourg` korrekt behandeln,
- Sommer-/Winterzeit testen.

Ein abgesagter Termin wird nicht gelöscht, sondern erhält einen nachvollziehbaren Status mit `cancelled_at`, `cancelled_by` und optionalem neutralem Grund. Er bleibt in der Historie sichtbar.

Benachrichtigungsregeln:

- Storniert der Physiotherapeut, erhält der Patient eine In-App-Notification.
- Stellt der Patient eine Absageanfrage, erhalten zuständige Praxisnutzer eine Notification.
- Entscheidungen über Absageanfragen werden dem Patienten mitgeteilt.
- Keine Gesundheitsdaten in Notification-Titeln oder Vorschautexten.

Wähle eine stabile Kalenderlösung, die mit Next.js 16 und React 19 kompatibel ist. Prüfe vor Installation die aktuelle offizielle Dokumentation. Halte neue Abhängigkeiten gering. Wenn eine Bibliothek Drag-and-drop verwendet, müssen alle Änderungen trotzdem serverseitig validiert werden. Tastaturbedienung und eine zugängliche Listenalternative sind Pflicht.

### Phase E – Verordnete und verbleibende Therapiesitzungen

In Luxemburg kann eine ärztliche Verordnung eine bestimmte Anzahl physiotherapeutischer Sitzungen umfassen. Diese Anzahl variiert. Nach Ausschöpfung kann eine weitere Behandlung möglicherweise nicht mehr von der Krankenkasse übernommen werden.

Die App darf daraus keine verbindliche Versicherungs- oder Kostenentscheidung ableiten. Sie dokumentiert ausschließlich die von der Praxis eingetragenen Verordnungsdaten und zeigt einen neutralen Hinweis, dass die tatsächliche Kostenübernahme mit Praxis und Versicherung zu klären ist.

Modelliere mehrere zeitlich aufeinanderfolgende Verordnungen pro Patient. Eine Verordnung benötigt mindestens:

- Praxis,
- Patient,
- Bezeichnung oder interne Referenz,
- verordnete Gesamtzahl an Sitzungen,
- Ausstellungsdatum,
- optional gültig von/bis,
- Status: aktiv, ausgeschöpft, abgelaufen oder archiviert,
- optional verordnender Arzt als Freitext,
- optionale neutrale Notiz,
- Ersteller und Zeitstempel.

Speichere den Restwert nicht als frei änderbaren, driftanfälligen Zähler. Bevorzugte Struktur:

- `treatment_authorizations` für die Verordnung,
- `appointment_authorization_usages` für tatsächlich angerechnete abgeschlossene Termine,
- eindeutige Zuordnung pro Termin,
- verbleibend = verordnet minus Summe der gültigen Nutzungen.

Nur ein Physiotherapeut darf festlegen, ob ein abgeschlossener Termin auf eine Verordnung angerechnet wird. Geplante oder abgesagte Termine reduzieren die Anzahl niemals automatisch.

Patientenansicht:

- gut sichtbar „Noch X von Y verordneten Sitzungen verfügbar“,
- Name/Zeitraum der aktiven Verordnung,
- neutraler Zustand bei 0 verbleibenden Sitzungen,
- keine Garantieformulierung zur Kostenübernahme,
- keine Preisberechnung im MVP.

Therapeutenansicht auf der Patientendetailseite:

- Verordnungen anlegen, bearbeiten und archivieren,
- verwendete und verbleibende Sitzungen sehen,
- abgeschlossenen Termin einer Verordnung zuordnen oder Zuordnung korrigieren,
- nachvollziehbare Historie und Audit-Ereignisse.

### Phase F – Private Patientenakten und Dokumente

Der Physiotherapeut muss zu jedem einzelnen Patienten Dokumente hochladen und ältere Unterlagen jederzeit wiederfinden können, beispielsweise:

- ärztliche Verordnung,
- Befund,
- Patientenakte,
- Therapiebericht,
- sonstige relevante Unterlagen.

Erstelle auf der Patientendetailseite einen Bereich **Dokumente**.

Funktionen:

- Datei hochladen,
- Titel vergeben,
- Kategorie auswählen,
- optionales Dokumentdatum,
- optionale neutrale Notiz,
- Liste chronologisch und filterbar anzeigen,
- PDF und unterstützte Bilder sicher ansehen,
- Datei herunterladen,
- alte Dokumente behalten,
- Dokument mit Bestätigung archivieren oder löschen, abhängig von dokumentierter Aufbewahrungsentscheidung.

Sicherheitsanforderungen:

- neuer privater Supabase-Storage-Bucket, zum Beispiel `patient-records`,
- Objektpfad enthält verifizierte serverseitige Praxis- und Patientenverknüpfungs-IDs, niemals eine frei vertraute Client-Praxis-ID,
- zufällige Dateinamen im Storage; Originalname nur als geschützte Metadaten,
- erlaubte MIME-Typen im MVP mindestens PDF, JPEG und PNG,
- konfigurierbares Größenlimit,
- Dateisignatur/Content-Type serverseitig plausibilisieren,
- kurzlebige signierte Download-URLs erst nach erneuter Autorisierungsprüfung,
- kein öffentlicher Bucket,
- Patienten sehen diese internen Akten standardmäßig nicht,
- Zugriff ausschließlich für aktive Mitarbeiter derselben Praxis,
- Cross-Practice-Zugriff per RLS, Serviceprüfung und Tests verhindern,
- Upload, Download, Archivierung und Löschung auditieren,
- keine Dokumentinhalte oder sensiblen Dateinamen in normalen Logs.

Dokumentiere Virenscanning als zwingenden Punkt vor echtem Pilotbetrieb, falls es im lokalen MVP nicht zuverlässig umgesetzt werden kann. Behaupte nicht, ungeprüfte Uploads seien produktionsreif.

### Phase G – Notifications, Qualität und Abschluss

Erstelle ein echtes In-App-Benachrichtigungszentrum für Patient und Praxis:

- gelesen/ungelesen,
- Badge mit ungelesener Anzahl,
- relevante Zielroute,
- Terminabsage,
- Absageanfrage,
- Entscheidung,
- Terminvorschlag,
- neuer oder geänderter Übungsplan,
- keine vertraulichen Gesundheitsdetails im Vorschautext.

Ergänze für spätere Terminanfragen das fachliche Modell:

- Patient kann nach einer Absage einen neuen Termin anfragen,
- Physiotherapeut kann mehrere konkrete Terminvorschläge senden,
- Patient kann genau einen Vorschlag bestätigen,
- Bestätigung erzeugt atomar den Termin und schließt andere Vorschläge,
- Konfliktprüfung findet bei Bestätigung erneut statt.

Wenn dieser Ablauf nicht mehr sinnvoll in derselben Etappe umsetzbar ist, implementiere zumindest Datenmodell, Services und klaren nächsten Task. Keine funktionslosen Buttons anzeigen.

## 5. Patientendetailseite als zentraler Arbeitsbereich

Erstelle bzw. erweitere `/practice/patients/[patientId]` als zentralen Arbeitsbereich mit klaren Bereichen oder Tabs:

- Übersicht,
- Übungen,
- Termine,
- Sitzungen/Verordnungen,
- Dokumente,
- Aktivität.

Die Übersicht zeigt mindestens:

- nächsten Termin,
- aktive Verordnung und verbleibende Sitzungen,
- aktuellen Übungsplan,
- dokumentierte Durchführung der letzten sieben Tage,
- wichtige Rückmeldungen,
- letzte Dokumente.

Jede Abfrage muss Praxiszugehörigkeit serverseitig prüfen. `patientId` aus der URL ist niemals allein ausreichend für eine Berechtigung.

## 6. Datenbank- und Migrationsregeln

- Bestehende Migrationen nicht umschreiben.
- Neue nummerierte Migrationen erstellen.
- Vor jeder Migration bestehende Daten und Constraints berücksichtigen.
- RLS auf jeder neuen Tabelle aktivieren.
- Grants explizit setzen.
- Service Role nur für eng begrenzte serverseitige Vorgänge.
- Keine Praxis-ID aus einem Formular ungeprüft übernehmen.
- Kritische Vorgänge atomar über PostgreSQL-Funktionen oder Transaktionen ausführen.
- `database.types.ts` nach Schemaänderungen mit `pnpm db:types` neu generieren.
- Audit-Metadaten dürfen keine Gesundheitsdetails, Schmerzwerte oder Dokumentnamen enthalten.

Voraussichtlich benötigte neue Tabellen bzw. Erweiterungen:

- `treatment_authorizations`
- `appointment_authorization_usages`
- `patient_documents`
- Termin-Stornierungsmetadaten
- gegebenenfalls `appointment_requests` und `appointment_proposals`

Prüfe zuerst, welche vorhandenen Tabellen erweitert werden können, ohne Daten zu duplizieren.

## 7. UX-Anforderungen

### Patient

- mobile-first,
- klare deutsche Sprache,
- große Touch-Ziele von mindestens 48 × 48 px,
- Text gut lesbar und skalierbar,
- maximal drei Hauptbereiche in der unteren Navigation,
- heutige Aufgaben ohne Suchen sichtbar,
- verbleibende Sitzungen verständlich, aber nicht alarmistisch,
- keine versteckten Kernaktionen,
- keine beschämende Gamification.

### Physiotherapeut

- Desktop- und Tablet-optimiert,
- Kalender als echter Hauptbereich,
- schnelle Navigation von Termin zu Patientendetail,
- Patientendetail bündelt alle relevanten Informationen,
- Aktionen mit klarer Rückmeldung und Bestätigung bei Stornierung, Archivierung oder Löschung,
- sensible Daten nicht unnötig in Übersichten zeigen.

Alle deutschen Texte weiterhin zentral über `src/messages/de.ts` pflegen.

## 8. Verbindliche Tests

Ergänze mindestens folgende Tests:

1. Konto kann ohne Einladung registriert werden.
2. Unverbundenes Konto kann keine Patientenbereiche oder Praxisdaten sehen.
3. Gültiger Code verbindet das angemeldete Konto genau einmal.
4. Ungültige, abgelaufene, widerrufene und verwendete Codes werden abgewiesen.
5. Praxiswechsel braucht Bestätigung und beendet die alte aktive Verbindung.
6. Patient kann nur eigene zugewiesene Übungen dokumentieren.
7. Doppelte Tagesdokumentation wird verhindert.
8. Tagesfortschritt aktualisiert sich nach erfolgreicher Dokumentation.
9. Fremde Praxis kann Completion Logs nicht lesen.
10. Therapeut kann Termine im Kalender erstellen, ändern, stornieren und abschließen.
11. Terminkonflikte desselben Therapeuten werden serverseitig verhindert.
12. Stornierung erzeugt die richtige Notification.
13. Nur abgeschlossene und ausdrücklich angerechnete Termine reduzieren verbleibende Sitzungen.
14. Verbleibende Sitzungen werden korrekt berechnet und nie negativ.
15. Patient sieht nur eigene Verordnungsdaten.
16. Dokumente einer fremden Praxis sind weder über DB noch Storage erreichbar.
17. Unberechtigte signierte Download-URL wird nicht erzeugt.
18. Zeitzonen- und Sommerzeitfälle funktionieren.
19. Kernansichten sind per Tastatur bedienbar und sinnvoll beschriftet.

Führe nach jeder Etappe aus:

```bash
pnpm typecheck
pnpm lint
pnpm test
```

Vor jedem abgeschlossenen Meilenstein zusätzlich:

```bash
pnpm db:reset
pnpm seed
pnpm e2e
pnpm build
```

Behebe alle durch deine Änderungen verursachten Fehler. Schalte keine Prüfungen ab, um einen grünen Status vorzutäuschen.

## 9. Dokumentation und Arbeitsfortschritt

Aktualisiere kontinuierlich:

- `README.md`
- `CLAUDE.md`
- `TASKS.md`
- `DECISIONS.md`
- `docs/PRODUCT_SPEC.md`
- `docs/ARCHITECTURE.md`
- `docs/DATA_MODEL.md`
- `docs/PRIVACY_SECURITY.md`
- `docs/ROADMAP.md`

Halte in `TASKS.md` klar fest:

- erledigt,
- in Arbeit,
- offen,
- technisch blockiert,
- vor Pilotbetrieb rechtlich oder organisatorisch zu prüfen.

Dokumentiere insbesondere, dass die angezeigte verbleibende Sitzungsanzahl keine Garantie der Krankenkassenübernahme ist.

## 10. Git und externe Aktionen

- Vor Änderungen `git status` prüfen.
- Bestehende Nutzeränderungen erhalten.
- Kleine logisch getrennte Commits erstellen; Commits sind erlaubt.
- Keine Deployments.
- Kein Push in externe Repositories.
- Keine produktive Supabase-Umgebung verändern.
- Keine externen Konten, Dienste oder kostenpflichtigen Ressourcen anlegen.
- Keine echten Patientendaten verwenden.

## 11. Verbindliche Arbeitsreihenfolge

1. Repository vollständig analysieren.
2. Git-Status und aktuelle Tests prüfen.
3. `TASKS.md` und `DECISIONS.md` auf den neuen Auftrag aktualisieren.
4. Einen kurzen, konkreten Umsetzungsplan erstellen.
5. Direkt mit Phase C beginnen.
6. Zuerst Registrierungsablauf korrigieren und Übungsdokumentation end-to-end fertigstellen.
7. Danach den nutzbaren Kalender implementieren.
8. Danach Verordnungen/verbleibende Sitzungen.
9. Danach Patientenakten.
10. Danach Notifications und Qualitätssicherung.

Stoppe nicht nach Analyse oder Planung. Wenn eine spätere Phase für eine einzelne Sitzung zu groß wird, beende mindestens die aktuell begonnene Phase vollständig, getestet und dokumentiert und hinterlasse den nächsten Schritt präzise in `TASKS.md` und `CLAUDE.md`.

## 12. Abschlussbericht nach jeder Phase

Berichte:

- was umgesetzt wurde,
- welche Dateien wesentlich geändert wurden,
- welche Migrationen hinzugefügt wurden,
- welche Sicherheitsentscheidungen getroffen wurden,
- welche Tests ergänzt wurden,
- welche Befehle erfolgreich waren,
- welche Einschränkungen verbleiben,
- wie Tom die Funktion manuell testet,
- nächster sinnvoller Schritt,
- Commit-Hash.

## Beginne jetzt

Analysiere das bestehende Repository vollständig und arbeite danach direkt mit Phase C weiter. Die erste sichtbare Zielstrecke ist:

> Patient erstellt Konto → bestätigt E-Mail → meldet sich an → gibt Praxiscode ein → wird verbunden → sieht heutige Übung → dokumentiert die Durchführung → Fortschritt aktualisiert sich → Physiotherapeut sieht die Selbstauskunft auf der Patientendetailseite.

Danach implementierst du den aktiv nutzbaren Physiotherapeuten-Kalender.
