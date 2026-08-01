# PhysioCheck – Verschlüsselung

> Stand 01.08.2026. Beschreibt den tatsächlichen Stand und die getroffene Entscheidung gegen Ende-zu-Ende-Verschlüsselung für Nachrichten (Tom, 01.08.2026, nach Abwägung der Kompromisse).

## Verschlüsselung während der Übertragung

Jede Verbindung – Website ↔ Supabase, App ↔ Supabase, Browser ↔ Website – läuft über HTTPS/TLS. Das ist eine **Plattform-Garantie von Supabase/dem jeweiligen Hosting-Anbieter**, nicht etwas, das im Anwendungscode selbst implementiert oder geprüft werden kann – entsprechend hier als „von der Plattform verwaltet" dokumentiert, nicht als „im Code verifiziert".

## Verschlüsselung ruhender Daten (in der Datenbank/im Speicher)

Ebenfalls eine Plattform-Garantie von Supabase (PostgreSQL-Datenbank und Storage-Buckets werden verschlüsselt gespeichert) – kein anwendungseigener Code dafür nötig oder vorhanden.

## Was das bedeutet: Schutz vor wem?

Transport- und Ruhe-Verschlüsselung schützen zuverlässig vor **Mitlesen unterwegs** (z. B. im selben WLAN) und vor **Zugriff auf gestohlene Festplatten/Backups außerhalb von Supabase**. Sie schützen NICHT davor, dass jemand mit gültigem Datenbankzugriff (Supabase selbst im Rahmen von Support/rechtlichen Anfragen, oder jemand mit dem Service-Role-Schlüssel) den Klartext lesen könnte – dafür bräuchte es echte Ende-zu-Ende-Verschlüsselung.

## Entscheidung: keine Ende-zu-Ende-Verschlüsselung für Nachrichten (Stand 01.08.2026)

Geprüft und **von Tom bewusst abgelehnt**, nach Abwägung dieser Kompromisse:

| Kompromiss bei echter Ende-zu-Ende-Verschlüsselung | Auswirkung |
|---|---|
| Schlüsselverwaltung pro Gerät | Jedes neue Gerät (Handy-Wechsel, neuer Praxis-Rechner) bräuchte einen eigenen Schlüsselaustausch |
| Mehrere Praxismitarbeiter:innen | Alle Mitarbeitenden, die eine Unterhaltung lesen dürfen, bräuchten Zugriff auf denselben Schlüssel – zusätzlicher Verteilungsaufwand |
| Geräteverlust | Ohne besonderen Wiederherstellungsmechanismus wären alte Nachrichten auf einem neuen Gerät nicht mehr lesbar |
| Mitarbeiterwechsel | Schlüssel müssten bei Ausscheiden einer Mitarbeiterin ausgetauscht werden, sonst bliebe alter Zugriff bestehen |
| Backups | Verschlüsselte Backups wären ohne die Schlüssel selbst nutzlos – zusätzliches Schlüssel-Backup nötig, das selbst wieder abgesichert werden müsste |
| Suche | Servergestützte Suche in Nachrichteninhalten wäre nicht mehr möglich |
| Support-Fälle | Ein Support-Fall („meine Nachricht ist weg") ließe sich nicht mehr durch Einsicht klären |

Gegen diese Kompromisse steht: Nachrichten in PhysioCheck sind laut Produktentscheidung **ausdrücklich nicht für Notfälle oder Diagnosen gedacht** – der Schutzbedarf ist real (s. `docs/MESSAGING_SECURITY.md`), aber geringer als etwa bei einer reinen Krisen-Chat-App. Die bestehenden Schutzmaßnahmen (RLS, keine Plattform-Admin-Einsicht, Ratenbegrenzung, keine Inhalte in Logs/Benachrichtigungen) decken die realistische Bedrohungslage ab, ohne diese erhebliche zusätzliche Komplexität.

## Falls sich das später ändert

Sollte Tom die Entscheidung revidieren (z. B. weil Nachrichten künftig sensiblere Inhalte tragen sollen), wäre der Ansatz: etablierte, geprüfte Bibliotheken verwenden (z. B. der Signal-Protokoll-Ansatz oder eine vergleichbare, breit geprüfte Lösung), **keine selbst entworfene Kryptografie**. Das wäre ein eigenständiges, größeres Vorhaben – kein einfacher Zusatzschalter.
