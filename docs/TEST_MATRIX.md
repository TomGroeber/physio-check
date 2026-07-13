# PhysioCheck – Testmatrix Phasen A–J

> Stand 13.07.2026. „Grün“ bedeutet in dieser Umgebung tatsächlich ausgeführt. RLS- und Browser-Spezifikationen sind implementiert und syntaktisch gelistet, benötigen für die Ausführung aber Toms lokale Supabase-/Docker-Umgebung mit `.env.local`.

## Übungsbibliothek

| Anforderung | Automatisierte Abdeckung | Status |
|---|---|---|
| Anlegen, bearbeiten, duplizieren, archivieren | `e2e/phase-j-exercise-management.spec.ts`; zusätzlich echte Tabellenoperationen in `scripts/rls-tests.ts` | Spezifikation bereit, lokaler Lauf offen |
| Referenzierte Übung nicht destruktiv löschen | RLS-Suite versucht Delete einer verwendeten Übung und prüft anschließend deren Fortbestand | Spezifikation bereit, lokaler Lauf offen |
| Fremdpraxis sieht/ändert Übung nicht | RLS-Suite prüft Select und Update mit echter Fremdpraxis-Sitzung | Spezifikation bereit, lokaler Lauf offen |
| Eingabegrenzen | `src/lib/validation/exercises.test.ts` | Grün |

## Übungsmedien

| Anforderung | Automatisierte Abdeckung | Status |
|---|---|---|
| Gültiger MP4-Upload | Browser lädt Magic-Byte-validen Testinhalt über echtes Upload-Ticket hoch | Spezifikation bereit, lokaler Lauf offen |
| Ungültiger MIME-Typ / zu groß | `src/config/media.test.ts`; zentrale `isAllowedMediaSize` wird von UI, Action und Service verwendet | Grün |
| Falsche Dateisignatur | Unit-Test für Magic Bytes + Browser-Finalisierung eines getarnten MP4 | Unit grün, Browserlauf offen |
| Fremdpraxis / Patient ohne Zuweisung | RLS-Suite prüft Medium-Zeile und direkten privaten Storage-Zugriff negativ | Spezifikation bereit, lokaler Lauf offen |
| Zugewiesener Patient erhält kurzlebige URL | Browser lädt Video als Praxis hoch und öffnet es als Demo-Patientin über das aktuelle Plan-Item | Spezifikation bereit, lokaler Lauf offen |
| Ersetztes Video nicht mehr aktiv | Browser speichert alte signierte URL, ersetzt das Video und erwartet für das gelöschte Objekt eine Fehlerantwort | Spezifikation bereit, lokaler Lauf offen |

## Pläne

| Anforderung | Automatisierte Abdeckung | Status |
|---|---|---|
| Plan anlegen, neue Version, nur eine aktuelle Version | RLS-Suite veröffentlicht für temporären Patienten zwei Versionen über `publish_exercise_plan` und prüft Plan/Zeiger/Versionenzahl | Spezifikation bereit, lokaler Lauf offen |
| Alte Version bleibt erhalten | RLS-Suite liest Version 1 nach Veröffentlichung von Version 2 erneut | Spezifikation bereit, lokaler Lauf offen |
| Patientenspezifische Werte, Start-/Enddatum | Validierungs-Unit-Test + RLS-Leseprüfung des veröffentlichten Items | Unit grün, RLS-Lauf offen |
| Wochentage, N-mal täglich, N-mal wöchentlich | `src/lib/plan-schedule.test.ts`, `src/lib/validation/plans.test.ts` und veröffentlichte DB-Items | Grün auf Unit-Ebene, DB-Lauf offen |
| Ungültige Veröffentlichung rollt vollständig zurück | RLS-Suite vergleicht Versionszahl vor/nach fehlerhafter RPC | Spezifikation bereit, lokaler Lauf offen |

## Durchführungen

| Anforderung | Automatisierte Abdeckung | Status |
|---|---|---|
| Einmal / dreimal täglich / mehrfach pro Woche | `src/lib/occurrences.test.ts` | Grün |
| Fortschritt und getrennte Durchgänge | `src/lib/occurrences.test.ts`, `src/lib/adherence-analytics.test.ts` | Grün |
| Kein unbeabsichtigtes Duplikat | RLS-Suite ruft `record_exercise_occurrence` zweimal auf und erwartet Ablehnung | Spezifikation bereit, lokaler Lauf offen |
| Alter Log bleibt nach Planänderung lesbar | RLS-Suite liest bestehenden Log samt Snapshot nach Veröffentlichung einer neuen Version | Spezifikation bereit, lokaler Lauf offen |
| Patient nur eigene Daten / Fremdpraxis keine Logs | RLS-Suite mit echten Patient-/Fremdpraxis-Sitzungen | Spezifikation bereit, lokaler Lauf offen |

## Einladungen

| Anforderung | Automatisierte Abdeckung | Status |
|---|---|---|
| Code vor Kontoerstellung prüfen, Konto erstellen, bestätigen und verbinden | `e2e/phase-j-invitations.spec.ts` über UI + Mailpit | Spezifikation bereit, lokaler Lauf offen |
| Bestehendes Konto anmelden und Einladung annehmen | `e2e/phase-j-invitations.spec.ts` | Spezifikation bereit, lokaler Lauf offen |
| Code erst nach erfolgreicher Verbindung verbrauchen | Browser prüft Wiederverwendung; RLS-Suite prüft falschen Hash, unverändertes `used_at` und anschließende erfolgreiche Einlösung | Spezifikation bereit, lokaler Lauf offen |
| Abgelaufen / widerrufen / verwendet | RLS-Suite erzeugt alle drei Zustände und erwartet identische Ablehnung | Spezifikation bereit, lokaler Lauf offen |
| Praxiswechsel | RLS-Suite prüft beendeten alten und genau einen aktiven neuen Link; UI zeigt die bestehende Bestätigung | Spezifikation bereit, lokaler Lauf offen |
| Neues Gerät braucht keinen neuen Code | Browser meldet dasselbe verbundene Konto in einem frischen Context an und erwartet direkt „Heute“ | Spezifikation bereit, lokaler Lauf offen |

## Ausgeführte Gesamtprüfungen in dieser Umgebung

| Befehl | Ergebnis |
|---|---|
| `pnpm typecheck` | Grün |
| `pnpm lint` | Grün, 0 Warnungen |
| `pnpm test` | Grün: 19 Dateien, 101 Tests |
| `pnpm exec playwright test --list` | Grün: 42 Fälle in 5 Dateien erkannt |
| `pnpm build` | Grün: 28 Seiten erzeugt |
| `pnpm db:reset` | Blockiert: `sh: 1: supabase: not found` |
| `pnpm seed` | Blockiert: `node: .env.local: not found` |
| `pnpm test:rls` | Blockiert: `node: .env.local: not found` |
| `pnpm e2e` | Blockiert beim Start von Next dev: `uv_interface_addresses returned Unknown system error 1`; lokale Supabase/Seed fehlen ebenfalls |
| `pnpm docs:sync` | Blockiert: `node: .env.local: not found`; der lokale Obsidian-Vault ist in dieser Umgebung nicht erreichbar |
