# PhysioCheck – Staging und Produktion trennen

> Stand 01.08.2026. Empfehlung, wie eine Testumgebung von der echten Umgebung getrennt würde. **Noch nicht eingerichtet** – aktuell gibt es nur die lokale Entwicklungsumgebung auf Toms Rechner, keine gehostete Umgebung überhaupt.

## Warum überhaupt trennen?

Damit man neue Funktionen mit echten (aber harmlosen, erfundenen) Testdaten ausprobieren kann, ohne jemals mit echten Patientendaten zu experimentieren. Ohne Trennung müsste jede Änderung entweder ungetestet direkt in Produktion gehen, oder man würde mit echten Daten testen – beides keine gute Idee.

## Empfohlener Aufbau (für Option A, s. `docs/HOSTING_OPTIONS.md`)

| Umgebung | Supabase-Projekt | Website-Adresse (Beispiel) | Daten |
|---|---|---|---|
| Lokal (heute schon vorhanden) | lokale Docker-Instanz auf dem eigenen Rechner | `localhost:3000` | frei erfundene Seed-Daten, per `pnpm db:reset && pnpm seed` jederzeit neu |
| Staging (Vorschlag, noch nicht eingerichtet) | eigenes, zweites Supabase-Projekt | z. B. `staging.physiocheck.de` | erfundene Testdaten, dürfen jederzeit gelöscht/zurückgesetzt werden |
| Produktion (Vorschlag, noch nicht eingerichtet) | eigenes, drittes Supabase-Projekt | z. B. `app.physiocheck.de` | echte Praxis- und Patientendaten |

Jede Umgebung ist ein **komplett getrenntes** Supabase-Projekt (eigene Datenbank, eigene Nutzerkonten, eigener Speicher) – es gibt keine Möglichkeit, dass ein Test in Staging versehentlich echte Daten in Produktion verändert, weil es technisch zwei unterschiedliche Datenbanken an unterschiedlichen Adressen sind.

## Wie eine Änderung von Staging nach Produktion käme

1. Änderung wird lokal entwickelt und geprüft (wie bisher: Typecheck, Lint, Tests).
2. Änderung wird auf Staging veröffentlicht, dort noch einmal mit echten (aber Test-)Abläufen durchgeklickt.
3. Erst nach ausdrücklicher Freigabe (durch Tom) wird dieselbe, bereits auf Staging geprüfte Änderung auch auf Produktion veröffentlicht.
4. Datenbank-Migrationen (Änderungen an der Struktur, s. `supabase/migrations/`) laufen zuerst auf Staging, erst danach – nach Bestätigung, dass nichts kaputtgegangen ist – auf Produktion.

## Was das für dich bedeutet

- Für den aktuellen Entwicklungsstand (noch kein Hosting) ändert sich nichts – weiterhin lokal entwickeln wie bisher.
- Sobald ein erster Pilot ansteht (s. `docs/PRODUCTION_DEPLOYMENT_PLAN.md`), würde ich empfehlen, **direkt mit einem getrennten Staging-Projekt** zu starten, auch wenn der Pilot selbst klein ist – der Mehraufwand ist gering (ein zweites kostenloses/günstiges Supabase-Projekt), der Sicherheitsgewinn (nie versehentlich mit Test-Klicks echte Patientendaten verändern) ist es wert.
