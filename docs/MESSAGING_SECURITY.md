# PhysioCheck – Sicherheit der Nachrichtenfunktion

> Stand 01.08.2026. Code-verifiziert (nicht angenommen), Grundlage: `supabase/migrations/20260726100000_patient_practice_messaging.sql`. Tom hat sich gegen echte Ende-zu-Ende-Verschlüsselung entschieden (s. `docs/ENCRYPTION_ARCHITECTURE.md` für die Begründung) – dieses Dokument beschreibt die tatsächlich eingesetzten Schutzmaßnahmen.

## Was gespeichert wird

Tabelle `conversations`: Praxis-ID, Patienten-ID, Zeitstempel (erstellt, letzte Nachricht, zuletzt gelesen je Seite). Tabelle `messages`: Absender-ID, Absenderrolle, **Nachrichtentext (Klartext in der Datenbank, 1–2000 Zeichen)**, Zeitstempel. **Keine** IP-Adresse, kein Geräte-Fingerabdruck, keine sonstigen Metadaten.

## Wer lesen darf (Datenbankregeln, nicht nur Oberfläche)

- Patient:in: nur die eigene Unterhaltung (`patient_profile_id = auth.uid()`).
- Praxis: nur, solange die Verknüpfung **aktuell aktiv** ist (`patient_currently_linked_to_practice`) – nach einem Praxiswechsel verliert die ehemalige Praxis sofort den Lesezugriff, auch auf bereits geführte Unterhaltungen. Das ist eine bewusste Ausnahme vom sonst üblichen Muster „Praxis behält eigene Historie" (s. `docs/RETENTION_AND_DELETION.md`), weil Tom das für Nachrichten ausdrücklich so verlangt hat.
- **Plattform-Admin: kein Zugriff.** Keine Policy, keine Ansicht, keine Datenbankfunktion im gesamten Code liest `messages`/`conversations`. Geprüft durch vollständige Codesuche, nicht nur angenommen.
- Andere Praxen, andere Patient:innen: kein Zugriff (RLS blockiert grundsätzlich alles außerhalb der eigenen Zeilen).

## Wie geschrieben wird

Keine offene Schreibberechtigung auf die Tabellen – jede Nachricht läuft über eine geprüfte Datenbankfunktion (`send_patient_message`/`send_practice_reply`), die Absender und Praxis ausschließlich aus der angemeldeten Sitzung ableitet, nie aus einem vom Client mitgeschickten Feld. Eine manipulierte Anfrage mit fremder Praxis- oder Patienten-ID würde von der Funktion selbst abgelehnt.

## Missbrauchsschutz

- **Ratenbegrenzung:** maximal 20 Nachrichten pro Minute und Unterhaltung, geprüft direkt in der Datenbankfunktion (nicht nur in der Oberfläche umgehbar).
- **Längenbegrenzung:** 1–2000 Zeichen, leere Nachrichten werden abgelehnt.
- Kein CAPTCHA/zusätzlicher Bot-Schutz über die Ratenbegrenzung hinaus – für ein System, das ausschließlich angemeldeten, bereits verifizierten Personen offensteht, ist das angemessen.

## Was NICHT passiert (bewusst geprüft)

- **Keine Nachrichteninhalte in Server-Logs.** Vollständige Codesuche nach `console.*`-Aufrufen im Server-Code ergab keinen einzigen Treffer, der Nachrichtentext protokolliert.
- **Keine Nachrichteninhalte in Benachrichtigungen.** Die ausgelöste Benachrichtigung lautet immer nur „Neue Nachricht" / „`<Name>` hat Ihnen eine Nachricht geschrieben." bzw. „Ihre Praxis hat Ihnen geantwortet." – nie der eigentliche Text.
- **Keine Nachrichteninhalte in der URL.** Formulardaten, nicht Adresszeile.

## Aktualisierung (Realtime vs. Nachfragen)

Kein Supabase-Realtime-Kanal im Einsatz (s. `docs/DATA_FLOW.md`). Website fragt alle 8 Sekunden nach (nur bei sichtbarem Tab), App beim Vordergrund-Wechsel/Ziehen-zum-Aktualisieren. Für ein System, das ausdrücklich nicht für Notfälle gedacht ist, ein vertretbarer Kompromiss.

## Ehrlich: was das NICHT bedeutet

Diese Maßnahmen schützen zuverlässig vor **unbefugtem Zugriff durch andere Nutzer:innen, andere Praxen und den Plattform-Betreiber selbst über die normale Anwendung**. Sie schützen NICHT davor, dass jemand mit direktem, autorisiertem Datenbankzugriff (z. B. bei einem Supabase-Support-Fall, oder bei einer gerichtlichen Anordnung an Supabase) die Datenbank einsehen könnte – das wäre nur durch echte Ende-zu-Ende-Verschlüsselung ausgeschlossen, die Tom bewusst nicht gewählt hat (Abwägung in `docs/ENCRYPTION_ARCHITECTURE.md`). „1000 % sicher" oder „niemand kann jemals mitlesen" wäre eine falsche Aussage – die richtige Aussage ist: technisch und organisatorisch gut abgesichert gegen die realistischen Bedrohungen einer Praxis-App, nicht kryptografisch gegen den Betreiber selbst abgesichert.
