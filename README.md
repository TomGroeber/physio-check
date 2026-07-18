# PhysioCheck

App für Physiotherapiepraxen und ihre Patientinnen und Patienten: Heimübungspläne mit Videos, Termine, verordnete Sitzungen und selbst dokumentierte Durchführung (Adhärenz).

> **Stand 19.07.2026:** Die konsolidierte Patientenoberfläche wurde erstmals vollständig lokal geprüft: db:reset (20 Migrationen), Seed, Typecheck, Lint, 105 Tests, 78 RLS-Proben, Playwright-E2E (35 bestanden, 12 planmäßig übersprungen) und Build sind grün. Zusätzlich wurden Heute-Checkliste, Statusrückmeldungen, Terminabsage, Profil, Passwort- und E-Mail-Änderung (inkl. Mailpit-Doppelbestätigung) und die Mobildarstellung im echten Browser durchgespielt. Dabei gefundene Fehler (hängende Medien-Finalisierung, unzuverlässige Absage-/E-Mail-Rückmeldung, `/auth/error` beim zweiten Bestätigungslink, nicht-deterministischer Seed, „geschafft“-Wortlaut für nicht erledigte Durchgänge) sind behoben. Produktumfang: `docs/PRODUCT_SPEC.md` · Testmatrix: `docs/TEST_MATRIX.md` · Übergabe: `docs/AI_HANDOFF.md`.

## Funktionsübersicht

Statuswerte: ✅ Funktioniert und getestet · 🟡 Teilweise umgesetzt · 🧪 Implementiert, lokal noch zu testen · ❌ Noch nicht umgesetzt · 🛑 Bewusst nicht vorgesehen

| Bereich | Funktion | Status | Getestet durch | Hinweise |
|---|---|---|---|---|
| Authentifizierung | Registrierung, Login, E-Mail-Bestätigung, Passwort zurücksetzen | ✅ | E2E-Tests (28, 11.07.2026) | Registrierung erzeugt nur unverbundene Patientenkonten |
| Praxiscode | Code erzeugen, einlösen, widerrufen, erneuern | ✅ | E2E-Kernablauf (11.07.2026) | Nur Hash gespeichert, einmalig, 7 Tage gültig |
| Praxiswechsel | Wechsel per Code neuer Praxis mit Warnhinweis | 🟡 | Unit-Tests, kein eigener E2E-Test | Alte Verbindung bleibt als Historie; kein Datenübertrag |
| Patientenverwaltung | Liste, Suche, Patient anlegen, Detailseite | ✅ | E2E + UI-Durchlauf (11.07.2026) | Detailseite mit Terminen, Sitzungen, Dokumenten, Plan |
| Telefonnummer | Patient pflegt eigene Nummer; Praxis sieht und korrigiert sie | ✅ | UI-Durchlauf + API-Proben (11.07.2026) | Optional, nur Ziffern/übliche Zeichen; Anzeige in Liste und Detail |
| Heimübungen | Übungsanzeige „Heute“ + Detailseite mit Vorgaben | ✅ | E2E-Tests (11.07.2026) | Übungen stammen aus Demo-Seed |
| Heimübungen | Übungsbibliothek durch die Praxis | ✅ | 65 Unit-Tests + UI-Durchlauf (13.07.2026) | Anlegen, bearbeiten, duplizieren, deaktivieren, archivieren; nie Hard-Delete |
| Heimübungen | Privater Medien-Upload durch die Praxis | ✅ | E2E-Browserlauf (19.07.2026) | MP4/WebM, JPEG/PNG und WebVTT; falsche Signatur abgelehnt, Ersetzen entwertet alte URL, Patient nur über kurzlebige URL; Virenscan vor Pilot weiterhin offen |
| Heimübungen | Individuelle Pläne und Versionierung | 🧪 | Typecheck, Lint, 74 Unit-Tests, Build (13.07.2026) | Dosierung, feste Wochentage, 1–6× täglich oder 1–7× wöchentlich, Uhrzeiten, Sortierung, Historie und Archivierung; atomare DB-Funktion, lokaler DB-/UI-Lauf offen |
| Übungsdokumentation | Selbstauskunft (erledigt/teilweise/zu schwierig/nicht möglich), Schmerz, Notiz | ✅ | E2E-Tests (11.07.2026) | Snapshot der Vorgaben; keine Doppeldokumentation pro Tag |
| Übungsdokumentation | Mehrere Durchgänge und flexible Wochenziele | 🧪 | Typecheck, Lint, 79 Unit-Tests, Build (13.07.2026) | Jeder Durchgang eigener Zeitstempel/Index; Doppeltipp atomar verhindert; geplant/dokumentiert/erledigt getrennt; DB/RLS/UI lokal offen |
| Patientenmodus | Geführter Tagesablauf mit optionalem Timer | 🧪 | Typecheck, Lint, 83 Tests, Build (13.07.2026) | Eine Übung/ein Durchgang pro Ansicht, automatische nächste Aufgabe, Tageszusammenfassung; Browser-/WCAG-Prüfung offen |
| Praxis-Auswertung | Soll/Ist, Rückmeldungen und Inaktivität für 7/30 Tage | 🧪 | Typecheck, Lint, 88 Tests, Build (13.07.2026) | Dashboard + Patientendetail, Übungsaufschlüsselung, ungelesen-Markierung, Links; DB/RLS/UI lokal offen |
| Patientenerinnerungen | Freiwillige Hinweise, Ruhezeiten und Planänderungen | 🧪 | Typecheck, Lint, 97 Tests, Build (13.07.2026) | Im Profil getrennt deaktivierbar; mehrere offene Tagesdurchgänge; DB/RLS/UI lokal offen; kein Push |
| Kalender | Monats-, Wochen-, Tages- und Listenansicht mit Filtern | ✅ | Unit-Tests + UI-Durchlauf (11.07.2026) | Ohne zusätzliche Kalenderbibliothek |
| Termine | Termin anlegen und bearbeiten | 🧪 | Unit-Tests der Validierung | UI vorhanden; kein automatischer End-zu-End-Test |
| Termine | Termin abschließen (rechnet genau 1 Einheit an) | ✅ | UI-Durchlauf (12.07.2026) | Anrechnung atomar; pro Termin höchstens eine aktive Anrechnung (partieller `unique`-Index) |
| Termine | Abschluss zurücknehmen (bucht genau 1 Einheit zurück) | ✅ | UI-Durchlauf (12.07.2026) | Historie bleibt erhalten (Anrechnung wird als zurückgebucht markiert, nie gelöscht) |
| Termine | Termin stornieren (Historie bleibt erhalten) | 🧪 | Unit-Tests der Validierung | Konfliktschutz gegen Überlappung in PostgreSQL |
| Absagen | Patient stellt Absageanfrage, Praxis wird benachrichtigt | ✅ | Browser-Durchlauf 5× (19.07.2026) | Bestätigung jetzt zuverlässig über Weiterleitung; Annehmen/Ablehnen durch die Praxis fehlt noch |
| Benachrichtigungen | In-App-Notifications bei Planänderungen, Stornierung und Absageanfrage | 🟡 | Unit-Tests | Planhinweise patientenseitig gelesen/ungelesen; vollständiges Zentrum und Badge fehlen |
| Behandlungseinheiten | Verordnung anlegen, ganzzahlige Anpassung mit Pflichtgrund, vollständige Ledger-Historie, Warnung bei 0, Patientenanzeige | ✅ | UI-Durchlauf + API-Proben (12.07.2026) | Nur ganze Einheiten; Stand nie negativ; Anzeige und Anrechnung nutzen dieselbe Auswahlregel (`primary_authorization_for_patient`) |
| Verordnungswarnungen | Warnbanner (Patientendetail), Dashboard-Karte, Listenfilter, Notification | ✅ | UI-Durchlauf + API-Probe (12.07.2026) | Schwellen: ≤2 Einheiten bzw. ≤14 Tage bis Gültigkeitsende; Notification ohne Gesundheitsdaten |
| Patientenakten | Upload (PDF/JPEG/PNG), Ansicht über kurzlebige signierte URL, Archivieren | ✅ | UI-Durchlauf (11.07.2026) | Patient hat keinen Zugriff (Probe bestanden); Virenscan vor Pilotbetrieb erforderlich |
| Patientenakten | Kategorie-Filter, Archiv-Umschalter, endgültiges Löschen (nur archivierte, mit Bestätigung) | ✅ | UI-Durchlauf + RLS-Proben (12.07.2026) | Löschen entfernt Zeile und Datei; Audit-Ereignis; dedizierte Testsuite folgt in Etappe 10 |
| Patienten-Kurzprofil | Internes Kurzprofil auf der Detailseite | ✅ | UI-Durchlauf + RLS-Proben (12.07.2026) | Eigene Tabelle ohne Patienten-Policy; Patienten können es nie lesen |
| Kalenderfarben | Eigene Farbe pro Praxismitglied, Termin-Chips + Legende | ✅ | UI-Durchlauf + API-Proben (11.07.2026) | 8 feste Farben; Name steht immer dabei (nie nur Farbe) |
| Markierte Patienten | Anheften mit Notiz, Badge, Filter, Dashboard-Karte | ✅ | UI-Durchlauf + RLS-Proben (12.07.2026) | Intern; Patienten sehen die Markierung nie (eigene Tabelle ohne Patienten-Policy) |
| Warteliste | Eigene Seite: Wunschzeiten, Priorität, Notiz, erledigen/löschen | ✅ | UI-Durchlauf + RLS-Proben (12.07.2026) | Intern (Patienten sehen sie nicht); max. 1 offener Eintrag pro Patient |
| Freie Termine | Frei gewordene Zeitfenster + Terminangebote (annehmen/ablehnen/zurückziehen) | ✅ | UI-Durchlauf inkl. Konfliktfall (12.07.2026) | Annahme bucht atomar; Doppelbuchung durch DB-Überlappungsschutz ausgeschlossen |
| PWA | Installierbares Manifest | 🟡 | manuell (frühere Phase) | Kein Offline-Modus, keine Push-Benachrichtigungen |
| Sicherheit | RLS auf allen Patiententabellen, serverseitige Autorisierung, private Buckets | ✅ | 36 RLS-Proben `pnpm test:rls` (12.07.2026) | Patient/Fremdpraxis/Selbst-Eskalation/Storage negativ getestet; Virenscan vor Pilot weiterhin offen |
| Tests | Typecheck, Lint, 105 Unit-/Komponententests, Playwright-E2E (35 bestanden/12 planmäßig übersprungen), 78 RLS-Proben, Build | ✅ | Vollständig lokal ausgeführt (19.07.2026) | Seed ist jetzt auch nach E2E-Läufen deterministisch; ein bekannter Parallellast-Flake wird vom eingebauten Retry aufgefangen |
| Deployment | Produktivbetrieb/Hosting | ❌ | – | Nur mit ausdrücklicher Zustimmung von Tom |

## Was funktioniert aktuell?

- **Kompletter Patienteneinstieg:** Konto erstellen → E-Mail bestätigen → Praxiscode einlösen → mit der Praxis verbunden.
- **Übungen:** Patienten sehen ihre Tagesübungen, dokumentieren die Durchführung als Selbstauskunft; die Praxis sieht die Rückmeldungen der letzten 7/30 Tage.
- **Übungsbibliothek und Medien:** Die Praxis legt Übungen vollständig über die Oberfläche an. Videos, Vorschaubilder, Alternativbilder und WebVTT-Untertitel werden über eng begrenzte Upload-Tickets direkt in den privaten Bucket geladen, danach serverseitig auf Größe und Dateisignatur geprüft und nur berechtigten Patienten über kurzlebige URLs angezeigt.
- **Individuelle Übungspläne:** Im Patientendetail stellt die Praxis Übungen zusammen, sortiert sie und überschreibt Dosierung, Zeitraum und Häufigkeit. Jede Veröffentlichung erzeugt atomar eine vollständige neue Version; alte Versionen und damalige Selbstauskünfte bleiben unverändert. Pläne können archiviert, aber nicht rückwirkend gelöscht werden.
- **Mehrere Durchgänge:** Bei z. B. drei täglichen Durchgängen bleibt die Übung nach dem ersten offen. Jeder Durchgang wird einzeln mit Zeitstempel dokumentiert. Die Oberfläche trennt Rückmeldungen von tatsächlich als „Erledigt“ angegebenen Durchgängen; ein Status „teilweise“ oder „zu schwierig“ wird niemals als vollständig erledigt dargestellt.
- **Geführter Modus:** Der Patient startet auf „Heute“ und sieht jeweils nur den nächsten offenen Durchgang. Video, Vorgaben und optionale Timersteuerung sind groß dargestellt. Nach der Selbstauskunft berechnet der Server die Warteschlange neu; am Ende folgt eine Tageszusammenfassung ohne Wertung oder beschämende Gamification.
- **Praxis-Auswertung:** Praxisnutzer wählen 7 oder 30 Tage und sehen geplante, dokumentierte und als erledigt angegebene Durchgänge getrennt. Schwierige/nicht mögliche Durchgänge, relevante Schmerzveränderungen, ungelesene Rückmeldungen und Patienten ohne aktuelle Dokumentation sind direkt mit Patient, Plan und Übung verknüpft.
- **Freiwillige Erinnerungen:** Patienten schalten Hinweise zu offenen Übungen und Planänderungen getrennt ein oder aus und legen eine Ruhezeit fest. „Heute“ erinnert außerhalb der Ruhezeit neutral an noch offene Durchgänge; Planhinweise lassen sich als gelesen markieren.
- **Kalender:** Die Praxis arbeitet mit Monats-/Wochen-/Tages-/Listenansicht; Termine können angelegt, geändert, storniert und abgeschlossen werden.
- **Behandlungseinheiten:** Die Praxis hinterlegt Verordnungen mit ganzzahligen Einheiten und korrigiert mit Pflichtgrund. Ein abgeschlossener Termin rechnet genau eine Einheit an, eine Rücknahme des Abschlusses bucht genau eine zurück – jede Bewegung bleibt als Historie sichtbar, der Stand wird nie negativ. Beim Abschluss mit 0 verfügbaren Einheiten erscheint eine deutliche Warnung (der Termin bleibt abschließbar, angerechnet wird nichts). Patienten sehen ihren Stand mit neutralem Kostenhinweis.
- **Patientenakten:** Die Praxis lädt PDF/JPEG/PNG in einen privaten Bucket und öffnet sie über kurzlebige signierte URLs; Patienten haben keinerlei Zugriff.
- **Kontakt und Farben:** Patienten hinterlegen ihre Telefonnummer im Profil, die Praxis sieht und korrigiert sie; jedes Praxismitglied hat eine eigene Kalenderfarbe mit Legende im Kalender.
- **Verordnungswarnungen:** Bei höchstens 2 verbleibenden Einheiten oder wenn die Verordnung in höchstens 14 Tagen abläuft, warnen Patientendetailseite, Dashboard und Patientenliste (Filter + Badge); beim Erreichen der Schwelle geht eine datensparsame Benachrichtigung an die Praxismitglieder.
- **Interne Organisation:** Kurzprofil und Markierung pro Patient sowie eine Warteliste mit Priorität und Wunschzeiten – alles nur für die Praxis sichtbar, Patienten sehen davon nichts.
- **Terminangebote:** Frei gewordene Zeitfenster (z. B. nach Stornierung) bietet die Praxis gezielt an; Patienten nehmen ein Angebot mit einem Klick an (der Termin wird atomar und konfliktgeprüft gebucht) oder lehnen ab.

## Was funktioniert noch nicht vollständig?

- **Absageanfragen:** Die Praxis wird benachrichtigt, kann aber noch nicht per Klick annehmen/ablehnen.
- **Termin anlegen/bearbeiten/stornieren:** implementiert und validiert, aber ohne automatischen End-zu-End-Test.
- **Übungsmedien:** Implementiert; die neue Migration, Storage-RLS und der tatsächliche MP4/WebM-Upload müssen noch mit der lokalen Supabase-Instanz und im Browser geprüft werden.
- **Uploads:** Ein Malware-/Virenscan mit Quarantäne bleibt vor einem echten Pilotbetrieb erforderlich.
- **Benachrichtigungszentrum:** Planänderungen sind patientenseitig gelesen/ungelesen sichtbar; eine gemeinsame Übersicht für alle Notification-Arten und ein Badge fehlen noch.

## Letzte Änderungen

- **19.07.2026 – Lokale Gesamtprüfung und Fehlerbehebungen der Patientenoberfläche.** Erstmals vollständige lokale Ausführung aller Prüfungen (db:reset, Seed, Typecheck, Lint, 105 Tests, 78 RLS-Proben, E2E, Build) plus manuelle Browser-Durchläufe der Patientenflüsse auf Desktop und iPhone-Viewport. Behoben: (1) Die Medien-Finalisierung hing dauerhaft, weil ein abgebrochener Body-Reader im Next-Server nie zurückkehrt – die Signaturprüfung liest die per Range begrenzte Antwort jetzt vollständig. (2) Terminabsage und E-Mail-Änderung bestätigen jetzt zuverlässig über eine Weiterleitung mit Query-Parameter statt über den unzuverlässig gestreamten Rückgabezustand. (3) Der zweite Bestätigungslink einer E-Mail-Änderung landete auf der Fehlerseite, obwohl die Änderung vollzogen war – mit gültiger Session geht es jetzt zum Profil. (4) Der Seed schlug nach E2E-Läufen und beim wiederholten Aufruf fehl (stille Fremdschlüssel-Blocker); die Aufräumreihenfolge ist jetzt deterministisch und Fehler werden nie mehr verschluckt. (5) Der Tagesfortschritt hieß „X von Y geschafft“, zählte aber auch nicht erledigte Rückmeldungen – jetzt wertungsfrei „eingetragen“. Zusätzlich vier hartkodierte Patiententexte nach `src/messages/de.ts` verschoben und vier E2E-Spezifikationsfehler (Login-Race, mehrdeutige Selektoren, Ersetzen-Race) repariert.

- **18.07.2026 – Konsolidierte Patientenoberfläche (`e9868fa` + `7ef8fae`).** Claudes angefangener Stand wurde vollständig erhalten: Seed-Reparatur, ausstehende E-Mail-Anzeige, Doppelbestätigung und die sichere `mark_notification_read`-Migration. Ergänzt wurden eine ehrliche Erfolgsrückmeldung (nur `completed` wird gefeiert), optionale einklappbare Angaben, vereinfachte Termine/Absage, größere Navigation sowie abgesicherte Konto-Actions und Recovery-Callbacks. Typecheck, Lint, 105 Tests und Build grün; 48 Browserfälle gelistet. Vollständiger DB-/Mailpit-/Browserlauf lokal offen.

- **13.07.2026 – Phase J (Testabdeckung).** Zwei neue serielle Playwright-Strecken prüfen Bibliotheks-CRUD, Magic-Byte-Upload, private Patientenauslieferung, Videoersatz, Code-vor-Konto, bestehendes Konto und neues Gerät. Die echte RLS-Suite erzeugt zusätzlich temporäre Pläne/Versionen, Bibliotheksobjekte, Einladungszustände und einen Praxiswechsel und räumt sie auf. Zentrale Größenvalidierung wird von UI, Action und Service gemeinsam verwendet. Typecheck, Lint, 101 Tests, Playwright-Testliste (42) und Build grün; DB-Reset/Seed/RLS/E2E hier infrastrukturell blockiert, Details in `docs/TEST_MATRIX.md`.

- **13.07.2026 – Phase I (freiwillige Erinnerungen).** Neue RLS-geschützte Patienteneinstellungen steuern Übungshinweise, Planänderungen und praxiszeitzonensichere Ruhezeiten. „Heute“ zeigt nur außerhalb der Ruhezeit einen neutralen Hinweis mit der Zahl offener Durchgänge und höchstens fünf ungelesene Planänderungen. `mark_notification_read` erlaubt ausschließlich den Lesestatus, nicht das Umschreiben servererzeugter Inhalte. Migration `20260713200000_patient_reminder_preferences.sql`; Typecheck, Lint, 97 Tests und Build grün, lokaler DB-/RLS-/Browserlauf offen. Push/E-Mail bleiben bewusst eine spätere Erweiterung.

- **13.07.2026 – Phase H (Praxis-Auswertung).** Reine Analytics-Logik berechnet Soll-Durchgänge aus fester oder flexibler aktueller Schedule und trennt dokumentiert/erledigt/andere Rückmeldung. Dashboard und Patientendetail bieten 7-/30-Tage-Filter, Übungsaufschlüsselung, letzte Aktivität, Inaktivität, ungelesene Rückmeldungen sowie steigende/hohe Schmerzmarkierungen. `reviewed_at/reviewed_by` ist ausschließlich über eine praxisautorisierte RPC änderbar; klinischer Loginhalt bleibt unveränderlich. Migration `20260713180000_completion_feedback_review.sql`; Typecheck, Lint, 88 Tests und Build grün, lokaler DB-/RLS-/Browserlauf offen.

- **13.07.2026 – Phase G (geführter Patientenmodus).** Neue Route `/session`: ein offener Durchgang pro Seite mit Video/Untertiteln/Alternativbild, individuellen Vorgaben, Schedule/Uhrzeiten, klaren Schritten, optionalem Countdown und großem Dokumentationsformular. Nach „Speichern und weiter“ wird der nächste zulässige Durchgang aus der Datenbank neu ermittelt; Abschlussansicht trennt dokumentiert und als erledigt angegeben. Timer ist rein optional und erzeugt niemals selbst einen Log. Typecheck, Lint, 83 Tests und Build grün; Browser- und WCAG-Durchlauf offen.

- **13.07.2026 – Phase F (mehrere Durchgänge).** `completion_logs.occurrence_index` nummeriert historische und neue Tagesdurchgänge verlustfrei. `record_exercise_occurrence` leitet Praxisdatum, Fälligkeit, Wochenziel und nächsten freien Durchgang in einer serialisierten DB-Transaktion ab und erstellt den Vorgaben-Snapshot serverseitig; direkte Log-Inserts wurden entzogen. „Heute“, Übungsdetail und Praxisprotokoll unterscheiden geplante, dokumentierte und vollständig erledigte Durchgänge. Migration `20260713160000_completion_occurrences.sql`; Typecheck, Lint, 79 Unit-Tests und Build grün, lokaler DB-/RLS-/Browserlauf offen.

- **13.07.2026 – Phase D/E (individuelle Pläne und Versionen).** Neuer Plan-Builder im Praxis-Patientendetail mit Bibliotheksauswahl, Sortierung, individuellen Dosierungswerten, Gültigkeitszeitraum sowie typisierten festen/flexiblen Häufigkeiten. `publish_exercise_plan` prüft Mitgliedschaft, aktive Patientenverbindung und jede Übung erneut und veröffentlicht Version+Items+aktuellen Zeiger+Notification+Audit in einer Transaktion. Direkte Planmutationen sind für Clients gesperrt; nach Praxiswechsel sieht der Patient nur Pläne der aktuell verbundenen Praxis. Migration `20260713140000_publish_exercise_plans.sql`; Typecheck, Lint, 74 Unit-Tests und Build grün, lokaler DB-/RLS-/Browserlauf offen.

- **13.07.2026 – Phase C (sicherer Übungsmedien-Upload).** Praxisoberfläche pro Übung für MP4/WebM-Videos, JPEG/PNG-Vorschau- und Alternativbilder sowie WebVTT-Untertitel; Dateivorschau vor dem Upload, echter Fortschrittsbalken, Ersetzen und bestätigtes Entfernen. Ein serverseitig autorisiertes Ticket bestimmt einen zufälligen Praxis-/Übungspfad; erst nach serverseitiger Größen- und Magic-Byte-Prüfung wird das Medium per Upsert registriert und auditiert. Patienten erhalten Video, Poster, Untertitel oder Alternativbild ausschließlich nach Prüfung ihres aktuellen Plans über kurzlebige signierte URLs. Migration `20260713120000_unique_exercise_media_kind.sql`; 69 Unit-Tests, Typecheck, Lint und Build grün. Lokaler DB-/RLS-/UI-Lauf offen, da in der Cloud weder `.env.local` noch Docker/Supabase CLI verfügbar sind.

- **13.07.2026 – Phase A/B.** Code-Einstieg auf der Startseite priorisiert, Ablaufdatum und lokal erzeugter QR-Code ergänzt; Übungsbibliothek mit Suche, Filtern, Anlegen, Bearbeiten, Duplizieren, Deaktivieren und Archivieren umgesetzt. Commits `375c70c` und `e9cb4ee`.

- **12.07.2026 – Etappen 4–8 und 10 (Warnungen, Dokumente, Markierungen, Warteliste, Angebote, RLS-Suite).** Verordnungswarnungen mit zentralen Schwellen (≤ 2 Einheiten / ≤ 14 Tage) auf Detailseite, Dashboard und Liste samt datensparsamer Benachrichtigung; Dokumente mit Kategorie-Filter, Archiv-Umschalter und endgültigem Löschen (nur archivierte, zweistufig, mit Audit); internes Patienten-Kurzprofil und Patient-Markierungen in eigenen Tabellen ohne Patienten-Policy; Warteliste `/practice/waitlist` mit Priorität und maximal einem offenen Eintrag pro Patient; Terminangebots-Workflow (frei gewordene Zeitfenster → Angebot → Patient nimmt atomar konfliktgeprüft an oder lehnt ab, Praxis kann zurückziehen); dedizierte RLS-Testsuite `pnpm test:rls` mit 36 Proben (Patient, Fremdpraxis, Selbst-Eskalation, Storage). Migrationen `20260712100000` bis `20260712180000`. Jede Etappe einzeln verifiziert (Typecheck, Lint, 61 Unit-Tests, 28 E2E, Build, UI-Durchläufe mit Negativ-Proben). Ergänzt um Etappe 9: `pnpm docs:sync` synchronisiert die Projektdoku (README, TASKS, DECISIONS, docs/) mit Hinweis-Banner in den Obsidian-Vault (`OBSIDIAN_VAULT_PATH` in `.env.local`) – Einbahnstraße Repo → Vault, nur der eigene Zielordner wird angefasst.

- **12.07.2026 – Behandlungskontingente mit Ledger und Abschluss-Rücknahme (Etappe 3).** Behandlungseinheiten werden ausschließlich ganzzahlig geführt: Ein Terminabschluss rechnet genau eine Einheit an, eine neue Aktion „Abschluss zurücknehmen" bucht genau eine zurück – dabei wird nichts gelöscht, die Anrechnung wird nur als zurückgebucht markiert (append-only Ledger mit Historie „Anfangskontingent / manuelle Erhöhung / manuelle Verringerung / Termin angerechnet / Anrechnung zurückgebucht" auf der Patientendetailseite). Der Stand wird nie negativ; manuelle Verringerungen unter 0 lehnt der Server ab. Beim Abschluss ohne verfügbare Einheit erscheint vorab eine deutliche, sachliche Warnung – der Termin bleibt abschließbar, angerechnet wird nichts. Die bekannte Inkonsistenz aus Phase E ist behoben: Patientenanzeige und Anrechnung nutzen jetzt dieselbe DB-Auswahlregel (`primary_authorization_for_patient`). Migration `20260711280000_unit_ledger_and_completion_reversal.sql`. Geprüft: `db:reset`, Seed, Typecheck, Lint, 55 Unit-Tests, 28 E2E-Tests, Build sowie ein 17-Schritte-UI-Durchlauf inkl. Negativ-Proben (Patient darf Rücknahme-Funktion nicht aufrufen, kein Doppelabschluss, kein Fremdzugriff auf Verordnungsauswahl).

- **11.07.2026 – Telefonnummer und Kalenderfarben (Etappe 2).** Patienten pflegen ihre Telefonnummer im Profil; die Praxis sieht sie in Patientenliste/-detail (als anrufbarer Link) und korrigiert sie über eine serverseitig geprüfte DB-Funktion. Jedes Praxismitglied wählt in den Einstellungen eine von 8 Kalenderfarben; der Kalender zeigt Farbpunkt, Farbrand und Legende – der Name steht immer zusätzlich dabei. Migration `20260711260000_phone_and_calendar_colors.sql`; dabei wurde das Update-Recht auf `practice_members` auf die Farbspalte eingeschränkt (Rollen-Eskalation per API jetzt auch auf Spaltenebene blockiert, per Probe verifiziert). Geprüft: Typecheck, Lint, 50 Unit-Tests, 28 E2E-Tests, Build, UI-Durchlauf mit Negativ-Proben. Einschränkung: Farbe gilt pro Mitglied (keine Kategorien-Farben).

- **11.07.2026 – Konsolidierung und lokale Verifikation von Phase E/F.** Die separat angelieferte Implementierung (`physio-check-phase-ef-updated/`) wurde in das Hauptprojekt übernommen und der Duplikat-Ordner entfernt. Die Migration `20260711230000_authorizations_and_patient_documents.sql` schlug beim ersten echten Lauf fehl (PostgreSQL-Schlüsselwort `authorization` als Alias) und wurde korrigiert. Danach erstmals vollständig lokal geprüft: `db:reset`, Seed, Typecheck, Lint, 43 Unit-Tests, 28 E2E-Tests, Production Build sowie ein UI-Durchlauf für Verordnungen (anlegen, −2 mit Grund, Terminabschluss rechnet genau 1 an) und Dokumente (PNG-Upload, signierte URL, Patient ausgesperrt). Das GitHub-Repository war versehentlich öffentlich und ist jetzt **privat**. Bekannte Einschränkung: uneinheitliche Anzeige bei mehreren aktiven Verordnungen (siehe oben).

## Technik (gepinnte Versionen)

| Baustein | Version |
|---|---|
| Node.js | 22.23.1 (per nvm) |
| pnpm | 11.11.0 |
| Next.js (App Router) | 16.2.10 |
| React | 19.2.4 |
| Tailwind CSS | 4.3.2 |
| shadcn/ui (Radix, Preset „mira") | CLI 4.13 |
| Supabase CLI | 2.109.1 |
| @supabase/ssr / supabase-js | 0.12 / 2.110 |
| Zod | 4.4 |
| Vitest / Playwright | 4.1 / 1.61 |

## Voraussetzungen

1. **Node.js 22** (empfohlen über [nvm](https://github.com/nvm-sh/nvm)): `nvm install 22`
2. **pnpm**: `npm install -g corepack@latest && corepack enable pnpm`
3. **Docker Desktop** (für die lokale Datenbank): [docker.com](https://www.docker.com/products/docker-desktop/) – muss laufen.
4. **Supabase CLI**: `brew install supabase/tap/supabase`

## Lokale Entwicklung starten

```bash
pnpm install          # Abhängigkeiten installieren
supabase start        # lokale Datenbank + Auth + Storage (Docker)
cp .env.example .env.local   # einmalig; Werte siehe unten
pnpm db:reset         # Migrationen anwenden
pnpm seed             # Demo-Daten anlegen
pnpm dev              # App auf http://localhost:3000
```

Werte für `.env.local`: `supabase status` zeigt `API URL` (→ `NEXT_PUBLIC_SUPABASE_URL`), `anon key` (→ `NEXT_PUBLIC_SUPABASE_ANON_KEY`) und `service_role key` (→ `SUPABASE_SERVICE_ROLE_KEY`). `NEXT_PUBLIC_APP_URL` bleibt `http://localhost:3000`.

## Demo-Konten (nur lokal, frei erfunden)

| Rolle | E-Mail | Passwort |
|---|---|---|
| Patientin | `patientin@demo.physiocheck.test` | `PhysioDemo2026!` |
| Therapeutin | `therapeutin@demo.physiocheck.test` | `PhysioDemo2026!` |
| Praxis-Admin | `admin@demo.physiocheck.test` | `PhysioDemo2026!` |
| Eingeladene Patientin | `eingeladen@demo.physiocheck.test` | `PhysioDemo2026!` |

Demo-Einladungscode: `DEMA-PHYS-2326`

- **Patientenansicht:** anmelden als Patientin → Startseite „Heute" mit Übungen, Sitzungsstand und nächstem Termin.
- **Therapeutenansicht:** anmelden als Therapeutin → Praxis-Dashboard.
- Am besten zwei verschiedene Browser (oder ein privates Fenster) für beide Rollen gleichzeitig.

**Demo-Daten zurücksetzen:** `pnpm db:reset && pnpm seed`

**E-Mails ansehen (Registrierung/Passwort):** Lokal werden alle Mails von Mailpit abgefangen: http://localhost:54324

## Häufigste Befehle

```bash
pnpm dev          # Entwicklungsserver
pnpm typecheck    # TypeScript prüfen
pnpm lint         # Codequalität prüfen
pnpm test         # Unit-/Komponententests (Vitest)
pnpm e2e          # End-to-End-Tests (Playwright; Supabase + Seed nötig)
pnpm build        # Production Build
pnpm db:reset     # Datenbank neu aufbauen (Migrationen)
pnpm db:types     # TypeScript-Typen aus dem DB-Schema erzeugen
pnpm seed         # Demo-Daten neu anlegen
```

## Registrierung und Verbindung testen

1. `pnpm db:reset`, `pnpm seed`, `pnpm dev`
2. Startseite → „Neues Konto erstellen“: Name, E-Mail, Passwort eingeben.
3. Bestätigungs-E-Mail in Mailpit öffnen (http://localhost:54324) und Link anklicken.
4. Anmelden → das unverbundene Konto landet im Bereich „Mit Ihrer Praxis verbinden“ und sieht sonst nichts.
5. Code `DEMA-PHYS-2326` eingeben → Praxis bestätigen → „Heute“ erscheint.

Alternativ funktioniert weiterhin der Einladungslink: Startseite → „Ich habe einen Einladungscode“. Eine neue Einladung erstellt die Therapeutin unter **Patienten → Patient anlegen**. Der Klartextcode wird nur direkt nach der Erstellung angezeigt. „Neuen Code erzeugen“ widerruft den vorherigen Code atomar.

## Übungsdokumentation testen

1. Als Patientin (`patientin@demo.physiocheck.test`) anmelden.
2. Auf „Heute“ eine Übung antippen → Detailseite mit Vorgaben (Video folgt mit der Medienverwaltung).
3. Status wählen (Erledigt / Teilweise / Zu schwierig / Nicht möglich), optional Sätze, Schmerz 0–10 und Notiz → „Dokumentation speichern“.
4. „Heute“ zeigt die Bestätigung und den aktualisierten Fortschritt; die Übung ist für heute als dokumentiert markiert.
5. Abmelden, als Therapeutin anmelden → **Patienten → Petra Beispielfrau**: Selbstauskünfte der letzten 7/30 Tage mit Status, Sätzen, Schmerzangaben und Notizen.

## Praxiskalender testen

1. Als `therapeutin@demo.physiocheck.test` anmelden.
2. **Kalender** öffnen und zwischen Monat, Woche, Tag und Liste wechseln.
3. „Termin anlegen“ wählen, Patient, Therapeut, Datum und Dauer speichern.
4. Termin öffnen, ändern, abschließen oder mit optionalem neutralem Grund stornieren.
5. Als Patient unter **Termine** eine Absage anfragen; der Kalender zeigt anschließend „Absage angefragt“.

## Sitzungen und Patientenakte testen

1. Als Therapeutin anmelden → **Patienten → Petra Beispielfrau**.
2. Eine Verordnung mit Sitzungsanzahl anlegen oder mit begründetem `+`/`-` anpassen.
3. Ein PDF/JPEG/PNG hochladen und über „Öffnen“ die kurzlebige Ansicht prüfen.
4. Im Kalender einen geplanten Termin abschließen: eine verfügbare Sitzung wird angerechnet.
5. Als Patientin anmelden: „Heute“ zeigt die verbleibenden Sitzungen.

## Wichtige Dokumente

- `CLAUDE.md` – verbindliche Projektregeln
- `docs/PRODUCT_SPEC.md` – Produktumfang und Akzeptanzkriterien
- `docs/ARCHITECTURE.md` – Architektur und Sicherheitsentscheidungen
- `docs/DATA_MODEL.md` – Datenmodell (ER-Diagramm)
- `docs/PRIVACY_SECURITY.md` – Datenschutz und Sicherheit
- `docs/ROADMAP.md` – spätere Erweiterungen
- `docs/AI_HANDOFF.md` – aktueller Übergabestand für Claude/ChatGPT
- `docs/TEST_MATRIX.md` – Anforderung-zu-Test-Zuordnung und letzter tatsächlicher Prüfstatus
- `TASKS.md` / `DECISIONS.md` – Aufgaben und Entscheidungen

## Sicherheit (Kurzfassung)

- Rollen und Rechte liegen ausschließlich in der Datenbank (Row Level Security auf jeder patientenbezogenen Tabelle).
- Der Service-Role-Schlüssel existiert nur serverseitig (`.env.local`, nie im Browser, nie im Repository).
- Interne Patientendokumente sind für Patienten unsichtbar und nur über kurzlebige signierte URLs für aktive Praxismitglieder erreichbar.
- Keine echten Personen- oder Gesundheitsdaten in Entwicklung und Tests.
