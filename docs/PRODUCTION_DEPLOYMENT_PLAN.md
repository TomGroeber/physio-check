# PhysioCheck – Plan für die erste Produktionsumgebung

> Stand 01.08.2026. Konkreter Schritt-für-Schritt-Plan für Option A (empfohlen, s. `docs/HOSTING_OPTIONS.md`). **Reine Vorbereitung – nichts hiervon wurde ausgeführt.** Jeder Schritt mit echten Kosten/Konten/Verträgen braucht vorher Toms ausdrückliche Freigabe (s. `CLAUDE.md`).

## Voraussetzung: externe Blocker (s. `docs/RELEASE_READINESS.md`)

Bevor überhaupt gestartet werden kann, muss Tom persönlich diese Dinge klären (keine davon kann/darf ich stellvertretend erledigen):

- Rechtliche Prüfung der Datenschutzerklärung (inkl. Luxemburg-spezifischer Aufbewahrungsfrist-Frage)
- Entscheidung für den endgültigen App-Namen/Bundle-Identifier (falls „PhysioCheck" nicht final bleibt)
- Apple Developer Account + Google Play Console Account
- Entscheidung für einen Domain-Namen

## Schritt-für-Schritt (Reihenfolge)

1. **Supabase-Produktionsprojekt anlegen** (EU-Region, bezahlter Tarif für tägliche Sicherungen). *Braucht Toms Freigabe – kostenpflichtig.*
2. **Migrationen + RLS auf das neue Projekt anwenden** (dieselben Dateien wie lokal, `supabase db push` o. Ä. – keine manuellen Klick-Änderungen, damit lokal/Staging/Produktion strukturell identisch bleiben).
3. **Staging-Projekt genauso anlegen** (s. `docs/STAGING_AND_PRODUCTION.md`), idealerweise vor Produktion, damit der erste echte Testlauf (inkl. Wiederherstellungstest, s. `docs/BACKUP_AND_RECOVERY.md`) dort passiert, nicht live.
4. **Domain registrieren** (z. B. über Route 53 oder einen anderen Registrar) und mit dem Website-Hosting verbinden. *Braucht Toms Freigabe – kostenpflichtig.*
5. **Website-Hosting einrichten** (Vercel oder AWS Amplify), Umgebungsvariablen (Supabase-Adresse/Schlüssel) für Staging und Produktion getrennt hinterlegen – niemals den Service-Role-Schlüssel in eine Stelle eintragen, die im Browser sichtbar wird.
6. **Echten E-Mail-Versand einrichten** (Bestätigungs-/Benachrichtigungs-Mails), statt des lokalen Test-Postfachs.
7. **Malware-Scan für den produktiven Betrieb aktivieren** (`MALWARE_SCAN_ENABLED`) und einen dauerhaften Scan-Dienst einrichten (aktuell nur lokal/in CI getestet, s. `docs/PRIVACY_SECURITY.md`).
8. **Erster echter Rauchtest auf Staging**: Registrierung, E-Mail-Bestätigung, Praxis anlegen, Termin buchen, Übung dokumentieren, Nachricht senden – der komplette Kernablauf einmal mit echten (aber Test-)Daten, nicht nur lokal.
9. **Backup-Wiederherstellung auf Staging einmal wirklich durchführen** (nicht nur dokumentieren, s. `docs/BACKUP_AND_RECOVERY.md`).
10. **Erst nach 1–9: Produktion freischalten**, mit einer einzigen Pilot-Praxis, die vorher weiß, dass es ein Pilot ist.
11. **App-Veröffentlichung** (Apple/Google) – eigener Ablauf, s. `docs/APP_STORE_CHECKLIST.md`, zeitlich unabhängig von der Website (kann parallel oder danach laufen).

## Was ich (als KI) an diesem Plan NICHT selbst tun darf/werde

- Keine Domain kaufen.
- Kein kostenpflichtiges Supabase-/Hosting-Konto anlegen.
- Keine App im Store veröffentlichen.
- Keine echten Verträge/Zahlungen auslösen.

Ich kann jeden technischen Schritt (Migrationen anwenden, Konfigurationsdateien vorbereiten, Checklisten abarbeiten) vorbereiten und – sobald die zugehörigen Konten von Tom angelegt sind – mit den von ihm bereitgestellten Zugangsdaten ausführen. Der Kontenteil selbst bleibt bei Tom.
