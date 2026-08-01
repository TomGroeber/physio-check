# PhysioCheck – Bedrohungsmodell (kurz)

> Stand 01.08.2026. Wer könnte was wollen, und was verhindert es tatsächlich – kompakt, mit Verweisen auf die Detaildokumente. Kein Ersatz für eine formale Sicherheitsprüfung durch Dritte vor einer echten Produktion.

| Bedrohung | Wer könnte das versuchen | Was es verhindert | Detail |
|---|---|---|---|
| Ein Patient liest Daten eines anderen Patienten | ein angemeldeter Nutzer | RLS: jede Abfrage ist auf `auth.uid()` beschränkt | `docs/ACCESS_CONTROL_MATRIX.md` |
| Eine Praxis liest Daten einer anderen Praxis | Praxispersonal | RLS: `is_practice_member(practice_id)`, serverseitig aus der eigenen Mitgliedschaft abgeleitet, nie aus Client-Eingabe | `docs/API_ARCHITECTURE.md` |
| Eine ehemalige Praxis liest weiter mit | Praxispersonal nach Patientenwechsel | Nachrichten: sofortiger Zugriffsverlust. Klinische Historie (Termine/Pläne/Akten): bewusst erhalten, wie eine reale Patientenakte | `docs/RETENTION_AND_DELETION.md` |
| Der Plattform-Admin liest medizinische Daten | der Betreiber selbst oder jemand mit dessen Zugang | keine Admin-Abfrage berührt patientenbezogene Inhalte – strukturell, nicht nur per Oberfläche verhindert | `docs/ADMIN_DATA_BOUNDARIES.md` |
| Selbst-Eskalation zu einer höheren Rolle | ein normaler Nutzer | Rollen ausschließlich in `practice_members`/`platform_admins`, beide ohne Client-Schreibrecht | `CLAUDE.md` D-006 |
| Manipulierte Praxis-/Patienten-ID in einer Anfrage (IDOR) | ein technisch versierter Angreifer | jede ID wird serverseitig aus der eigenen Sitzung/Mitgliedschaft neu hergeleitet, nie aus einem Client-Feld übernommen | `docs/API_ARCHITECTURE.md` |
| Hochladen einer schädlichen Datei | ein böswilliger Nutzer mit gültigem Zugang | Dateityp-/Größenprüfung + echte Dateisignatur-Prüfung (alle Uploads), Malware-Scan bei aktivierter Umgebung (Profilbild, Übungsmedien, **seit 01.08.2026 auch Patientenakten**) | `docs/PRIVACY_SECURITY.md`, D-124 |
| Nachrichten-Flut/Spam | ein angemeldeter Nutzer | Ratenbegrenzung (20 Nachrichten/Minute), Längenbegrenzung, direkt in der Datenbankfunktion geprüft | `docs/MESSAGING_SECURITY.md` |
| Mitlesen der Datenbank durch Supabase-Support/gerichtliche Anfrage | außerhalb der Anwendung | **nicht ausgeschlossen** ohne echte Ende-zu-Ende-Verschlüsselung – bewusst nicht umgesetzt (Tom-Entscheidung) | `docs/ENCRYPTION_ARCHITECTURE.md` |
| Kompromittierter Service-Role-Schlüssel | jemand mit Zugriff auf die Serverumgebung/Secrets | volle Datenbankrechte – Schlüsselverwaltung ist der entscheidende Schutz, nicht Anwendungscode | `docs/PLATFORM_ADMIN_SECURITY.md` |
| Kontoübernahme durch gestohlenes Passwort | Phishing/Wiederverwendung | Supabase-Standard-Auth-Schutz, **keine MFA aktuell implementiert** (offener Punkt) | s. unten |

## Nicht formal geprüft (ehrlich benannt)

- Keine externe Penetrationstestung durchgeführt.
- Keine formale Bedrohungsmodellierung durch Sicherheitsspezialisten (dieses Dokument ist eine interne, code-basierte Einschätzung, kein Ersatz dafür).
- MFA für Praxis-/Admin-Rollen existiert nicht.
- Kein automatisiertes Alarmsystem bei verdächtigen Zugriffsmustern (nur Audit-Ereignisse, die man manuell einsehen müsste).

## Restrisiko-Zusammenfassung

Die Anwendung ist gut gegen die realistischen, alltäglichen Bedrohungen einer Mandanten-getrennten Praxis-App abgesichert (Datentrennung, Rollenmodell, Upload-Sicherheit, Ratenbegrenzung). Sie ist **nicht** gegen einen Angreifer mit direktem Datenbank-/Infrastrukturzugriff geschützt (das würde echte Ende-zu-Ende-Verschlüsselung erfordern, bewusst nicht gewählt) und **noch nicht** formal extern geprüft. Für einen ersten Pilotbetrieb mit einer Praxis ist das ein vertretbares Risiko; vor einer größeren Produktion mit mehreren Praxen wäre eine externe Sicherheitsprüfung empfehlenswert.
