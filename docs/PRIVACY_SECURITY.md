# PhysioCheck – Datenschutz und Sicherheit

## Ergänzung 2026-07-19: Patienten-Profilbilder

- Profilbilder sind personenbezogene Daten und liegen ausschließlich im privaten Bucket `patient-avatars`; es gibt keine öffentliche URL. Auslieferung nur über kurzlebige signierte URLs, die erst nach serverseitiger Autorisierung (eigene Session bzw. aktive Praxisverbindung) und Pfadprüfung entstehen.
- Sichtbar ist das Bild nur für den Patienten selbst und aktive Mitglieder der aktuell verbundenen Praxis; andere Patienten, fremde Praxen, ehemalige Praxen (nach Praxiswechsel) und nicht angemeldete Personen sind per Storage-RLS und serverseitiger Prüfung ausgeschlossen (per RLS-Suite belegt).
- Upload: freiwillig, max. 5 MB, nur JPEG/PNG/WebP; der MIME-Typ wird nicht allein geglaubt, die Dateisignatur wird serverseitig geprüft. Dateinamen sind zufällige UUIDs im eigenen Profilordner. Ersetzen löscht das alte Objekt (alte signierte URLs laufen zusätzlich zeitlich ab), Entfernen löscht Datei und Verweis; beides wird ohne Dateinamen auditiert.
- Ohne Bild zeigt die App einen neutralen Initialen-Platzhalter, niemals ein fremdes Personenfoto. Ein Profilbild ist keine Nutzungsvoraussetzung. Seeds und Tests verwenden ausschließlich generierte 1×1-Pixel-Bilder.
- Malware-Scan siehe Ergänzung 2026-07-21 unten.

## Ergänzung 2026-07-21: Malware-Scan für Uploads

- Implementiert in `src/server/services/malware-scan.ts`: scannt den vollständigen Dateiinhalt mit ClamAV (`clamscan`), bevor `finalizeAvatarUpload`/`finalizeUpload` die Datei registrieren. Schlägt bei jedem Fehler (Scanner fehlt, Timeout, unerwarteter Exit-Code) **geschlossen** fehl – eine nicht scannbare Datei gilt nie als sauber.
- Schalter `MALWARE_SCAN_ENABLED` (Standard: aus). Grund: lokale Entwicklung und die aktuelle CI haben keinen dauerhaften `clamd`-Dienst; ein erzwungener Scan würde dort jeden Upload ablehnen. Das ist kein Platzhalter, der Erfolg vortäuscht – der Scan-Code ist echt und wird in CI real durchlaufen (`web-database`-Job installiert ClamAV und setzt `MALWARE_SCAN_ENABLED=true` für den E2E-Lauf).
- **Produktionsarchitektur-Lücke, ehrlich benannt:** `clamscan` lädt bei jedem Aufruf die komplette Signaturdatenbank neu (lokal gemessen: ~4,6 s). Für eine Serverless-Produktionsumgebung (z. B. Vercel) ist das unpraktikabel. Zwei produktionsfähige Alternativen, beide mit derselben Schnittstelle (`scanBufferForMalware`) umsetzbar, ohne Aufrufer anzupassen:
  1. Dauerhafter `clamd`-Daemon (eigener Host/Container) über Unix-Socket/TCP – `clamdscan` statt `clamscan`, Millisekunden statt Sekunden pro Scan.
  2. Verwalteter Cloud-AV-Dienst (z. B. über eine Storage-Trigger-Funktion).
  Diese Entscheidung braucht ein tatsächliches Hosting-Ziel (Phase 3) und ist daher nicht vor Tom entscheidbar ohne dessen Hosting-Wahl.
- **Testbarkeits-Erkenntnis:** Die eingebaute EICAR-Testdatei erkennt ClamAV nachweislich nur, wenn sie exakt am Dateianfang steht (Offset 0 erkannt, Offset 1 bereits nicht mehr – empirisch mit `clamscan` geprüft, keine Annahme). Für einen echten Ende-zu-Ende-Test „Schadsoftware versteckt in einer sonst gültigen Datei" reicht EICAR daher nicht aus. Stattdessen definiert `e2e/fixtures/clamav-test-signature.ndb` eine harmlose, projekteigene Testsignatur, die – wie echte Virensignaturen – an beliebiger Stelle im Dateiinhalt erkannt wird. Die CI kopiert sie zusätzlich zur echten ClamAV-Datenbank in deren Datenbankverzeichnis; die Anwendung selbst kennt diese Datei nicht und lädt nie eine andere Datenbank als die ClamAV-Standarddatenbank.
- E2E-Abdeckung: `e2e/patient-avatar.spec.ts` und `e2e/phase-j-exercise-management.spec.ts` laden je eine Datei mit gültigen Magic Bytes und eingebetteter Testsignatur hoch und erwarten Ablehnung – nur ausgeführt, wenn `MALWARE_SCAN_ENABLED=true` gesetzt ist (lokal per `test.skip` übersprungen, in CI real geprüft).

## Ergänzung Phase D/E: Planintegrität und Praxiswechsel

- Pläne werden nur über atomare, serverseitig autorisierte Datenbankfunktionen veröffentlicht oder archiviert; halbfertige Versionen können nicht aktiv werden.
- Notifications enthalten nur den neutralen Hinweis, dass ein Plan aktualisiert oder beendet wurde – keine Übungsnamen, Dosierungen oder gesundheitlichen Notizen.
- Nach einem Praxiswechsel begrenzen RLS-Helfer den Patientenzugriff auf Pläne und Übungsmedien der aktuell verbundenen Praxis. Historische Daten bleiben bei der früheren Praxis und werden nicht übertragen.
- Audit-Metadaten speichern ausschließlich Plan-ID und Versionsnummer, keine Inhalte des Übungsplans.

## Ergänzung Phase F: sichere Selbstauskunft je Durchgang

- Durchgangsnummer, Praxiskalendertag und Vorgaben-Snapshot entstehen serverseitig. Patienten können weder fremde/alte Items noch zusätzliche erfundene Occurrences direkt einfügen.
- Eine Transaktionssperre plus Unique-Index verhindert unbeabsichtigte Doppelanlage bei parallelen Klicks.
- Schmerzwerte und Notizen bleiben ausschließlich im geschützten Completion-Log; sie gelangen nicht in Audit-Metadaten oder Notifications.

## Ergänzung Phase H: Auswertung und Review

- Fortschrittswerte werden nur serverseitig aus Daten der verifizierten Praxis berechnet. Sie sind organisatorische Selbstauskunftsauswertungen, keine medizinische Bewertung oder Überwachung.
- Das Audit beim Lesen speichert nur Log-ID und Ereignistyp; Gesundheitsinhalt, Schmerzwerte und Notizen werden nicht kopiert.
- Die frühere Praxis kann ihre eigene historische Dokumentation behalten; neue Praxen erhalten durch einen Praxiswechsel keinen Zugriff darauf.

## Ergänzung Phase I: freiwillige In-App-Hinweise

- Reminder-Präferenzen sind Daten des Patienten und ausschließlich über eigene RLS-Policies sichtbar. Praxismitglieder können sie weder lesen noch ändern.
- Übungshinweise werden nur innerhalb der angemeldeten App angezeigt. Plan-Notifications nennen weder Übung, Dosierung, Schmerz noch andere Gesundheitsdetails.
- Der Empfänger kann ausschließlich `read_at` setzen; servererzeugte Notification-Inhalte sind nicht überschreibbar.
- Push und E-Mail sind nicht implementiert. Bei späterer Einführung müssen Vorschau und Betreff weiterhin vollständig ohne Gesundheitsdaten bleiben und die freiwilligen Einstellungen respektieren.

## Ergänzung Phase C: Registrierung und Übungsdokumentation

- Ein registriertes, unverbundenes Konto besitzt keinerlei Zugriff auf Praxis- oder Patientendaten – weder über die Oberfläche noch über direkte URLs oder die Datenbank (RLS greift ohne Praxis-Link nicht).
- Übungsvideos werden nur über kurzlebige signierte URLs ausgeliefert, die erst NACH der serverseitigen Prüfung „Item gehört zum eigenen aktuellen Plan" erzeugt werden.
- Durchführungsprotokolle sind Selbstauskünfte, unveränderlich und nur lesbar für den Patienten selbst und Mitglieder der Praxis, zu deren Plan sie gehören. Nach einem Praxiswechsel sieht die neue Praxis keine alte Dokumentation (D-019).
- Schmerzangaben und Notizen erscheinen nur in der Anwendung, nie in Logs, Audit-Metadaten oder E-Mails. Hohe Schmerzwerte lösen ausschließlich einen neutralen Hinweis aus – keine Diagnose, keine automatische Therapieentscheidung.

## Ergänzung Phase B: Einladungssystem

- Einladungscodes werden nur als SHA-256-Hash gespeichert und im Klartext genau einmal angezeigt.
- Der Hash ist durch Spaltenrechte auch für normale Praxisclients nicht lesbar.
- Nach erfolgreicher Prüfung hält der Browser nur eine kurzlebige, HMAC-signierte HttpOnly-Sitzung.
- Rate-Limit-Ereignisse speichern einen HMAC-Fingerabdruck, nicht IP-Adresse oder User-Agent im Klartext.
- Einlösung und Praxiswechsel erfolgen in einer atomaren Datenbankfunktion mit Zeilensperre und Audit-Ereignis.
- Die Daten alter Praxisverbindungen werden nicht zur neuen Praxis übertragen.

> Stand: 2026-07-11 (Erstfassung Phase 1; wird bis Phase 4 vervollständigt).
> Diese Datei behauptet **nicht**, dass das Produkt „DSGVO-zertifiziert" oder rechtlich vollständig konform ist. Punkte mit ⚖️ müssen von einer Datenschutzbeauftragten / einem Juristen geprüft werden.

## 1. Welche Daten verarbeitet die App?

| Kategorie | Beispiele | Sensibilität |
|---|---|---|
| Kontodaten | E-Mail, Name, Passwort-Hash (bei Supabase Auth) | mittel |
| Praxisverknüpfung | wer ist Patient welcher Praxis | hoch (lässt Behandlung erkennen) |
| Übungspläne | verordnete Übungen, Dosierung | hoch (Gesundheitsbezug) |
| Durchführungsprotokolle | Selbstauskunft, Schmerzangaben 0–10, Notizen | **hoch (Gesundheitsdaten)** |
| Termine | Zeit, Ort, behandelnde Person | hoch |
| Audit-Ereignisse | wer hat wann was geändert (ohne Gesundheitsdetails) | mittel |

Grundsatz **Datenminimierung**: Patientendatensätze starten mit einem Anzeigenamen; keine Geburtsdaten, Adressen oder Diagnosen im MVP.

## 2. Datenfluss (lokal / später Produktion)

```
Browser (Patient/Therapeut)
  │ TLS (Produktion; lokal http://localhost)
  ▼
Next.js Server (Server Actions / Route Handler)
  │ Zod-Validierung, Rollenprüfung, Audit-Events
  ▼
Supabase (PostgreSQL + Auth + Storage)
  │ Row Level Security auf jeder patientenbezogenen Tabelle
  └ privater Storage-Bucket, Zugriff nur über kurzlebige signierte URLs
```

- Kein direkter Tabellenzugriff aus dem Browser; der Anon-Key kann nur, was RLS erlaubt.
- Service-Role-Key nur in Server-Umgebungsvariablen (`SUPABASE_SERVICE_ROLE_KEY`), Verwendung eng begrenzt und im Code begründet.

## 3. Bedrohungsmodell (Auszug) und Gegenmaßnahmen

| Bedrohung | Gegenmaßnahme | Status |
|---|---|---|
| Patient A liest Daten von Patient B (IDOR) | RLS `patient_profile_id = auth.uid()` auf allen Patiententabellen; E2E-/RLS-Tests | RLS aktiv; dedizierte RLS-Tests Phase 2 |
| Praxis X liest Daten von Praxis Y | RLS über `practice_members`-Mitgliedschaft | RLS aktiv; Tests Phase 2 |
| Selbst-Eskalation zur Therapeutenrolle | Rollen nur in `practice_members`, ausschließlich serverseitig beschreibbar; kein Frontend-Weg | umgesetzt |
| Einladungscode erraten | 12 Zeichen ohne leicht verwechselbare Zeichen, nur Hash gespeichert, 7 Tage gültig, einmalig, widerrufbar, persistentes Rate Limiting | Phase B umgesetzt; lokaler DB-/E2E-Test offen |
| Videoabruf durch Unbefugte | privater Bucket, signierte URLs mit kurzer Laufzeit erst nach Prüfung des aktuellen Patientenplans | umgesetzt; erweiterte RLS-Proben lokal noch auszuführen |
| XSS | React-Escaping, kein `dangerouslySetInnerHTML` mit Nutzerdaten; CSP in Phase 4 | teilweise |
| CSRF | Next.js Server Actions mit Origin-Prüfung; Cookies SameSite (Supabase-Default) | umgesetzt |
| Unsichere Uploads | eng begrenztes Upload-Ticket; zufälliger Pfad; Bucket-Limit; serverseitige Pfad-, Größen- und Magic-Byte-Prüfung vor Registrierung; Malware-Scan (ClamAV) vor Registrierung, sofern `MALWARE_SCAN_ENABLED=true` | technische Prüfung umgesetzt; Scan-Pipeline implementiert und per E2E verifiziert; produktionsreife Dauerlösung (`clamd`/Cloud-AV) offen (siehe Ergänzung 2026-07-21) |
| Datenabfluss über Logs | keine Gesundheitsdaten in Logs/Audit-Metadaten (Projektregel); Review in Phase 4 | Regel aktiv |

## 4. Technische Sicherheitsentscheidungen

- **RLS überall**: jede Tabelle hat `enable row level security`; Tabellen ohne Schreib-Policy sind für Clients schreibgeschützt (nur Server/Service-Role).
- **Grants nach Minimalprinzip**: `anon` hat keinerlei Datenrechte; `authenticated` nur durch RLS gefilterte Rechte.
- **Passwörter**: mindestens 10 Zeichen (Client, Server und Supabase-Konfiguration identisch).
- **E-Mail-Bestätigung** ist aktiv (lokal über Mailpit testbar).
- **Antwortverhalten ohne Orakel**: „Passwort vergessen" antwortet immer gleich; Code-Einlösung wird „ungültig oder abgelaufen" melden, ohne den Grund preiszugeben.

## 5. Offene Punkte vor einem echten Pilotbetrieb (Checkliste)

- [ ] ⚖️ Rechtsgrundlage der Verarbeitung (Art. 9 DSGVO – Gesundheitsdaten) und Einwilligungstexte
- [ ] ⚖️ Auftragsverarbeitungsvertrag (AVV) mit Supabase bzw. Hosting-Anbieter; EU-/EWR-Region verbindlich wählen (z. B. Frankfurt)
- [ ] ⚖️ Datenschutzerklärung + Impressum in der App (versioniert über `consent_records`)
- [ ] ⚖️ Aufbewahrungs- und Löschfristen festlegen (Kontolöschung, Datenexport sind im Datenmodell vorgesehen, aber noch nicht umgesetzt)
- [ ] ⚖️ Prüfung, ob die App im Zielmarkt als Medizinprodukt gelten könnte (sie trifft bewusst keine Diagnosen/Therapieentscheidungen)
- [ ] Rate Limiting produktionsreif (Code-Einlösung, Login) und getestet
- [ ] Content-Security-Policy und Security-Header (Phase 4)
- [ ] RLS-Testsuite deckt alle Tabellen ab (Phase 2/4)
- [ ] Fehlerüberwachung datensparsam konfigurieren (ohne Patientendaten), falls eingesetzt
- [ ] Backups/Restore-Prozess des Hosting-Anbieters dokumentieren
- [ ] TLS erzwungen, HSTS (Deployment)

## 6. Bewusste Nicht-Funktionen

Keine Analyse-/Tracking-/Werbedienste. Keine Gesundheitsdaten in Push-Vorschauen oder E-Mail-Betreffzeilen (Regel für Phase 3+). Keine automatischen Diagnosen oder Therapieempfehlungen.
