# PhysioCheck – Backup und Wiederherstellung

> Stand 01.08.2026. **Ehrlicher Stand: es gibt aktuell keine produktive Umgebung und damit auch noch keine echten Backups.** Dieses Dokument beschreibt, wie es funktionieren würde, sobald es eine gehostete Umgebung gibt (s. `docs/HOSTING_OPTIONS.md`), und was vor einem echten Pilotbetrieb noch zu tun ist.

## Was Supabase automatisch anbietet (sobald ein bezahlter Tarif läuft)

- **Tägliche automatische Sicherungen** der gesamten Datenbank.
- Bei höheren Tarifen zusätzlich **„Point-in-Time Recovery"**: man kann die Datenbank auf einen beliebigen Zeitpunkt der letzten Tage zurücksetzen (nicht nur auf den letzten Tagesstand), z. B. „Zustand von heute Morgen 8:14 Uhr, kurz bevor der Fehler passiert ist".
- Gespeicherte Dateien (Storage) sind über die normale Infrastruktur-Redundanz von Supabase abgesichert.

## Was noch fehlt (ehrlich, nicht beschönigt)

- **Kein echter Wiederherstellungs-Testlauf wurde bisher durchgeführt** – weder lokal noch (weil es sie noch nicht gibt) in einer gehosteten Umgebung. „Backups existieren" und „Backups funktionieren nachweislich" sind zwei verschiedene Aussagen; aktuell lässt sich nur die erste treffen.
- Kein dokumentierter Ablauf, WER im Ernstfall WAS tun darf (Wiederherstellung ist ein folgenreicher Schritt – sollte nicht „mal eben" von irgendwem ausgelöst werden können).
- Keine Regelung, wie lange Sicherungen aufbewahrt werden, über das hinaus, was der jeweilige Supabase-Tarif automatisch mitbringt.

## Empfohlenes Vorgehen vor einem echten Pilotbetrieb

1. Sobald ein Staging-Projekt existiert (s. `docs/STAGING_AND_PRODUCTION.md`): dort einmal bewusst eine Wiederherstellung auf einen früheren Zeitpunkt durchführen und dokumentieren, wie lange es dauert und was währenddessen mit der App passiert (kurzer Ausfall ist normal).
2. Festlegen, wer eine Wiederherstellung auslösen darf (Vorschlag: nur Tom persönlich, analog zur bereits bestehenden Regel, dass nur der Plattformadmin sensible Vorgänge auslösen darf).
3. Kurze, für Tom verständliche Anleitung schreiben: „Wenn X passiert, mache Y" (kann nach dem ersten echten Testlauf in Schritt 1 ergänzt werden).

## Was NICHT durch Backups abgedeckt ist

Backups schützen vor **versehentlichem Verlust** (z. B. eine falsche Löschung). Sie schützen **nicht** davor, dass jemand mit gültigem Zugriff absichtlich etwas falsch einträgt – dafür gibt es stattdessen die im Produkt eingebauten Schutzmechanismen: Plan-Versionierung (alte Übungsprotokolle werden nie rückwirkend verfälscht, s. `CLAUDE.md` Regel 7), Prüfprotokolle (Audit-Ereignisse) für sensible Vorgänge, und die Regel, dass dokumentierte Übungen immer Selbstauskunft bleiben, nie als „geprüft" oder „bewiesen" dargestellt werden.

## Für Dateien (Storage) – Löschung ist bewusst endgültig

Bei Kontolöschungen ist die Entfernung von Profilbildern/Dokumenten laut Produktentscheidung **absichtlich sofort und endgültig** (s. bestehende Kontolöschungs-Funktion), nicht über Backups rückholbar – das ist Datenschutz-getrieben (Löschung muss wirklich löschen), nicht ein Versehen. Für alles andere (aktive Konten) greifen die normalen Datenbank-Sicherungen oben.
