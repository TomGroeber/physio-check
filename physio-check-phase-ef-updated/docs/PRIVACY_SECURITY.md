# PhysioCheck – Datenschutz und Sicherheit

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
| Videoabruf durch Unbefugte | privater Bucket, signierte URLs mit kurzer Laufzeit nach serverseitiger Prüfung | Bucket + Policies fertig; Upload/Abruf Phase C |
| XSS | React-Escaping, kein `dangerouslySetInnerHTML` mit Nutzerdaten; CSP in Phase 4 | teilweise |
| CSRF | Next.js Server Actions mit Origin-Prüfung; Cookies SameSite (Supabase-Default) | umgesetzt |
| Unsichere Uploads | MIME-Typ- und Größen-Limit im Bucket (100 MB, Video/Bild/VTT) + serverseitige Validierung beim Upload (Phase C) | teilweise |
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
