# PhysioCheck – Sicherheit der Plattform-Admin-Rolle

> Stand 01.08.2026. Code-verifiziert. Für die genaue Datengrenze s. `docs/ADMIN_DATA_BOUNDARIES.md`, für Bedienung s. `docs/PLATFORM_ADMIN_GUIDE.md`.

## Wie die Rolle entsteht (und wie nicht)

`platform_admins` ist eine eigene Tabelle, komplett ohne Client-Policy – sie ist über die normale Anwendung für niemanden lesbar oder schreibbar, auch nicht für den Admin selbst über die Oberfläche. Es gibt **keinen** Weg, sich selbst zur Plattform-Admin-Rolle zu machen (weder über die Website noch über die App) – die Rolle kann nur direkt in der Datenbank (also nur von jemandem mit vollem Datenbankzugriff, z. B. Tom persönlich über die Supabase-Konsole) vergeben werden.

## Wie jede Admin-Aktion geprüft wird

Jede einzelne Server-Aktion im Betreiberportal beginnt mit `assertPlatformAdmin()` – einer serverseitigen Prüfung, die bei fehlender Berechtigung sofort abbricht, bevor irgendeine Datenbankabfrage läuft. Es gibt keine „stillschweigend erlaubte" Aktion, die diese Prüfung umgeht.

## Warum der Admin technisch nicht auf medizinische Daten zugreifen kann

Nicht nur, weil die Oberfläche es nicht anzeigt – es gibt **keine Datenbankfunktion und keine Abfrage im gesamten Admin-Code**, die `messages`, `conversations`, `patient_documents`-Inhalte, Übungsplan-Notizen, Schmerzwerte oder Diagnosen abfragt. Selbst ein technisch versierter Angriff auf die Admin-Oberfläche (z. B. eine manipulierte Anfrage) könnte diese Daten nicht erreichen, weil der Code dafür schlicht keine Abfrage enthält – es ist keine Frage von „darf nicht", sondern „kann strukturell nicht" (es sei denn, jemand mit direktem Datenbankzugriff außerhalb der Anwendung greift zu, s. „Restrisiken" unten).

## Was es NICHT gibt (bewusst geprüft)

- Keine Funktion „Als Praxis anmelden" (kein Rollenwechsel/Identitätswechsel).
- Keine Funktion „Patientendaten anzeigen" oder „Nachrichten öffnen" im Admin-Bereich.
- Keine versteckte Service-Role-Route, die dem Admin-Bereich medizinische Inhalte zugänglich machen würde.

## Was Plattform-Admins auslösen dürfen (mit echten Auswirkungen)

- Praxen anlegen, Status ändern (Testphase/aktiv/gesperrt/archiviert).
- Erste Praxisadmin-Einladung erzeugen.
- Zugangs-Wiederherstellung für ein Praxismitglied auslösen (setzt Zugangsdaten zurück, ändert NIE Rolle/Zuordnung/Historie – s. D-113 ff. in `DECISIONS.md`).
- Globale Konfiguration ändern (z. B. Wartungsmodus).

Jede dieser Aktionen erzeugt ein strukturiertes Audit-Ereignis (Ereignistyp + Praxisbezug + Zeitstempel, nie Freitext) – nachvollziehbar, aber ohne Gesundheitsbezug.

## Restrisiken (ehrlich, nicht beschönigt)

- **Service-Role-Zugriff außerhalb der Anwendung:** Wer den Service-Role-Schlüssel oder direkten Datenbankzugriff besitzt (aktuell nur du, als Projektinhaber, über die Supabase-Konsole), könnte technisch jede Tabelle einsehen – das ist eine Frage der Schlüsselverwaltung/organisatorischer Disziplin, nicht des Anwendungscodes. Dieser Schlüssel darf niemals im Client oder in einem geteilten Repository landen (bereits Projektregel, s. `CLAUDE.md`).
- **Keine MFA** für Plattform-Admin-Konten aktuell implementiert (s. `docs/ACCESS_CONTROL_MATRIX.md`-Ergänzung unten) – bei nur einer Person mit dieser Rolle ein geringeres, aber nicht null Risiko.
- Aussagen wie „absolut sicher" wären falsch – die richtige Aussage ist: der Anwendungscode selbst hat keinen Weg zu medizinischen Daten für diese Rolle, unabhängig von Datenbank-Ebenen-Zugriff außerhalb der App.
