# PhysioCheck – Funktionsstatus

> Ausgelagert aus der README, damit die README kurz und einfach bleibt. Diese Datei listet jede Funktion mit Prüfstatus – für die Kurzübersicht siehe `README.md`.

Statuswerte: ✅ Funktioniert und getestet · 🟡 Teilweise umgesetzt · 🧪 Implementiert, lokal noch zu testen · ❌ Noch nicht umgesetzt · 🛑 Bewusst nicht vorgesehen

| Bereich | Funktion | Status | Getestet durch | Hinweise |
|---|---|---|---|---|
| Authentifizierung | Registrierung, Login, E-Mail-Bestätigung, Passwort zurücksetzen | ✅ | E2E-Tests (28, 11.07.2026) | Registrierung erzeugt nur unverbundene Patientenkonten |
| Praxiscode | Code erzeugen, einlösen, widerrufen, erneuern | ✅ | E2E-Kernablauf (11.07.2026) | Nur Hash gespeichert, einmalig, 7 Tage gültig |
| Praxiswechsel | Wechsel per Code neuer Praxis mit Warnhinweis | 🟡 | Unit-Tests, kein eigener E2E-Test | Alte Verbindung bleibt als Historie; kein Datenübertrag |
| Patientenverwaltung | Liste, Suche, Patient anlegen, Detailseite | ✅ | E2E + UI-Durchlauf (11.07.2026) | Detailseite mit Terminen, Sitzungen, Dokumenten, Plan |
| Telefonnummer | Patient pflegt eigene Nummer; Praxis sieht und korrigiert sie | ✅ | UI-Durchlauf + API-Proben (11.07.2026) | Optional, nur Ziffern/übliche Zeichen; Anzeige in Liste und Detail |
| Heimübungen | Übungsanzeige „Heute“ + Detailseite mit Vorgaben | ✅ | E2E-Tests (11.07.2026) | Übungen stammen aus Demo-Seed |
| Heimübungen | Video-first-Übungsansicht für Patienten | ✅ | 6 Komponententests + E2E + mobiler Browserlauf (19.07.2026) | Randloses 16:9-Video mit Untertiteln/Poster, Alternativbild, Leerzustand; Langtexte nur noch in der Praxis-Bibliothek |
| Profil | Dunkelmodus für Patienten (Hell/Dunkel im Profil) | ✅ | 3 Unit-/Komponententests + E2E hell/dunkel/Praxis (19.07.2026) | Cookie pro Gerät; Praxisbereich bleibt immer hell (D-056) |
| Profil | Patienten-Profilbild (hochladen, ersetzen, entfernen) | ✅ | 10 RLS-Proben + 4 E2E-Strecken + Browserlauf (19.07.2026) | Privater Bucket `patient-avatars`, kurzlebige signierte URLs, Magic-Byte-Prüfung, nur aktuell verbundene Praxis sieht das Bild |
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
| Betreiberportal | Praxen anlegen/verwalten (Lebenszyklus, Einstellungen, Mitarbeitende), globale Konfiguration | ✅ | Manueller Portal-Durchlauf (25.07.2026) | Eigene `platform_admin`-Rolle, nie selbst zuweisbar; keine medizinischen Patientendaten sichtbar; Schritt-für-Schritt-Anleitung in `docs/PLATFORM_ADMIN_GUIDE.md` |
| Betreiberportal | Zugangs-Wiederherstellung für Praxismitglieder (Passwort + alte E-Mail verloren) | ✅ | 136 RLS-Proben + echter Playwright-Durchlauf (26.07.2026) | Nur Plattformadmin; hängt bestehende Mitgliedschaft auf neues Konto um, keine Praxisdaten gehen verloren; PR #7 gemergt (27.07.2026) |
| Nachrichten | Textnachrichten Patient ↔ aktuell verbundene Praxis | ✅ | 21 RLS-Proben + `e2e/messaging.spec.ts` (26.07.2026) | Vierter Patienten-Tab; ehemalige Praxis verliert nach Wechsel Lese- und Schreibrecht; kein Realtime (Polling) |
| PWA | Installierbares Manifest | 🟡 | manuell (frühere Phase) | Kein Offline-Modus, keine Push-Benachrichtigungen |
| Sicherheit | RLS auf allen Patiententabellen, serverseitige Autorisierung, private Buckets, strikt getrennte Plattform-Admin-Rolle | ✅ | 136 RLS-Proben `pnpm test:rls` (27.07.2026) | Patient/Fremdpraxis/Selbst-Eskalation/Storage/Betreiberportal/Nachrichten negativ getestet; Virenscan vor Pilot weiterhin offen |
| Tests | Typecheck, Lint, 115 Unit-/Komponententests, Playwright-E2E, 136 RLS-Proben, Build | ✅ | Vollständig lokal ausgeführt (27.07.2026) | 4 Worker + 15-s-Expect gegen Parallellast-Flakes; einzelne bekannte Latenz-Flakes fängt der eingebaute Retry |
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
