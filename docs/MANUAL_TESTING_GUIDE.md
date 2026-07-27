# PhysioCheck – Manuelle Testpfade

> Ausgelagert aus der README, damit die README kurz und einfach bleibt. Kurze Klick-Anleitungen, um einzelne Funktionen selbst auszuprobieren (nach `pnpm quickstart` bzw. `pnpm db:reset && pnpm seed && pnpm dev`). Demo-Zugänge stehen in `README.md`.

## Registrierung und Verbindung testen

1. `pnpm db:reset`, `pnpm seed`, `pnpm dev`
2. Startseite → „Neues Konto erstellen": Name, E-Mail, Passwort eingeben.
3. Bestätigungs-E-Mail in Mailpit öffnen (http://localhost:54324) und Link anklicken.
4. Anmelden → das unverbundene Konto landet im Bereich „Mit Ihrer Praxis verbinden" und sieht sonst nichts.
5. Code `DEMA-PHYS-2326` eingeben → Praxis bestätigen → „Heute" erscheint.

Alternativ funktioniert weiterhin der Einladungslink: Startseite → „Ich habe einen Einladungscode". Eine neue Einladung erstellt die Therapeutin unter **Patienten → Patient anlegen**. Der Klartextcode wird nur direkt nach der Erstellung angezeigt. „Neuen Code erzeugen" widerruft den vorherigen Code atomar.

## Übungsdokumentation testen

1. Als Patientin (`patientin@demo.physiocheck.test`) anmelden.
2. Auf „Heute" eine Übung antippen → Detailseite mit Vorgaben (Video folgt mit der Medienverwaltung).
3. Status wählen (Erledigt / Teilweise / Zu schwierig / Nicht möglich), optional Sätze, Schmerz 0–10 und Notiz → „Dokumentation speichern".
4. „Heute" zeigt die Bestätigung und den aktualisierten Fortschritt; die Übung ist für heute als dokumentiert markiert.
5. Abmelden, als Therapeutin anmelden → **Patienten → Petra Beispielfrau**: Selbstauskünfte der letzten 7/30 Tage mit Status, Sätzen, Schmerzangaben und Notizen.

## Praxiskalender testen

1. Als `therapeutin@demo.physiocheck.test` anmelden.
2. **Kalender** öffnen und zwischen Monat, Woche, Tag und Liste wechseln.
3. „Termin anlegen" wählen, Patient, Therapeut, Datum und Dauer speichern.
4. Termin öffnen, ändern, abschließen oder mit optionalem neutralem Grund stornieren.
5. Als Patient unter **Termine** eine Absage anfragen; der Kalender zeigt anschließend „Absage angefragt".

## Sitzungen und Patientenakte testen

1. Als Therapeutin anmelden → **Patienten → Petra Beispielfrau**.
2. Eine Verordnung mit Sitzungsanzahl anlegen oder mit begründetem `+`/`-` anpassen.
3. Ein PDF/JPEG/PNG hochladen und über „Öffnen" die kurzlebige Ansicht prüfen.
4. Im Kalender einen geplanten Termin abschließen: eine verfügbare Sitzung wird angerechnet.
5. Als Patientin anmelden: „Heute" zeigt die verbleibenden Sitzungen.

## Praxis anlegen und Zugangs-Wiederherstellung testen

Siehe `docs/PLATFORM_ADMIN_GUIDE.md` – dort steht der vollständige Schritt-für-Schritt-Ablauf für beides.
