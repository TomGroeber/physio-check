# PhysioCheck – Testmatrix

> Stand 19.07.2026. „Grün“ bedeutet tatsächlich lokal ausgeführt (Toms Mac, Supabase/Docker/Mailpit). Letzter vollständiger Lauf: 19.07.2026 auf Branch `claude-patient-ui-20260718`.

## Vereinfachte Patientenoberfläche und Kontosicherheit

| Anforderung | Automatisierte Abdeckung | Status |
|---|---|---|
| Statusgerechte Erfolgsrückmeldung | `success-celebration.test.tsx`, `e2e/core-flow.spec.ts`; manueller Browserlauf für alle vier Status | Grün (19.07.2026); „Geschafft!“ nur bei `completed`, Fortschrittstext jetzt „eingetragen“ |
| Profil gegliedert | `e2e/demo-accounts.spec.ts` (chromium + mobile) | Grün (19.07.2026) |
| E-Mail normalisieren/gleiche Adresse ablehnen | `auth.test.ts`, `patient-account-security.spec.ts` | Grün (19.07.2026) |
| Passwort-Link nur an Session-Adresse | `patient-account-security.spec.ts` mit Mailpit; manueller Lauf inkl. Login mit neuem Passwort | Grün (19.07.2026) |
| E-Mail-Änderung mit Doppelbestätigung | Manueller Mailpit-Lauf: Anforderung → beide Links → Profil zeigt neue Adresse → Login mit neuer Adresse | Grün (19.07.2026); zweiter Link führt jetzt zu `/profile?email_confirmed=1` statt `/auth/error` |
| Terminabsage bestätigt zuverlässig | Manueller Browserlauf 5× (Redirect-Muster D-053) | Grün (19.07.2026) |
| Mobildarstellung | Manueller iPhone-14-Viewport-Lauf: kein horizontales Scrollen, Touch-Ziele ≥ 48 px | Grün (19.07.2026) |

## Übungsbibliothek

| Anforderung | Automatisierte Abdeckung | Status |
|---|---|---|
| Anlegen, bearbeiten, duplizieren, archivieren | `e2e/phase-j-exercise-management.spec.ts`; echte Tabellenoperationen in `scripts/rls-tests.ts` | Grün (19.07.2026) |
| Referenzierte Übung nicht destruktiv löschen | RLS-Suite | Grün (19.07.2026) |
| Fremdpraxis sieht/ändert Übung nicht | RLS-Suite | Grün (19.07.2026) |
| Eingabegrenzen | `src/lib/validation/exercises.test.ts` | Grün |

## Übungsmedien

| Anforderung | Automatisierte Abdeckung | Status |
|---|---|---|
| Gültiger MP4-Upload | Browser lädt Magic-Byte-validen Inhalt über echtes Upload-Ticket | Grün (19.07.2026) |
| Ungültiger MIME-Typ / zu groß | `src/config/media.test.ts`; zentrale `isAllowedMediaSize` | Grün |
| Falsche Dateisignatur | Unit-Test + Browser-Finalisierung eines getarnten MP4 | Grün (19.07.2026); Finalisierung hing zuvor dauerhaft (D-052) |
| Fremdpraxis / Patient ohne Zuweisung | RLS-Suite (Medium-Zeile + direkter Storage-Zugriff negativ) | Grün (19.07.2026) |
| Zugewiesener Patient erhält kurzlebige URL | Browser: Praxis lädt hoch, Demo-Patientin öffnet über Plan-Item | Grün (19.07.2026) |
| Ersetztes Video nicht mehr aktiv | Browser: alte signierte URL liefert Fehler nach Ersetzen | Grün (19.07.2026) |

## Pläne

| Anforderung | Automatisierte Abdeckung | Status |
|---|---|---|
| Plan anlegen, neue Version, nur eine aktuelle Version | RLS-Suite über `publish_exercise_plan` | Grün (19.07.2026) |
| Alte Version bleibt erhalten | RLS-Suite | Grün (19.07.2026) |
| Patientenspezifische Werte, Start-/Enddatum | Validierungs-Unit-Test + RLS-Leseprüfung | Grün (19.07.2026) |
| Wochentage, N-mal täglich, N-mal wöchentlich | `plan-schedule.test.ts`, `validation/plans.test.ts` + DB-Items | Grün (19.07.2026) |
| Ungültige Veröffentlichung rollt vollständig zurück | RLS-Suite | Grün (19.07.2026) |

## Durchführungen

| Anforderung | Automatisierte Abdeckung | Status |
|---|---|---|
| Einmal / dreimal täglich / mehrfach pro Woche | `src/lib/occurrences.test.ts` | Grün |
| Fortschritt und getrennte Durchgänge | `occurrences.test.ts`, `adherence-analytics.test.ts` | Grün |
| Kein unbeabsichtigtes Duplikat | RLS-Suite (`record_exercise_occurrence` zweimal) | Grün (19.07.2026) |
| Alter Log bleibt nach Planänderung lesbar | RLS-Suite | Grün (19.07.2026) |
| Patient nur eigene Daten / Fremdpraxis keine Logs | RLS-Suite | Grün (19.07.2026) |

## Einladungen

| Anforderung | Automatisierte Abdeckung | Status |
|---|---|---|
| Code vor Kontoerstellung prüfen, Konto erstellen, bestätigen und verbinden | `e2e/phase-j-invitations.spec.ts` über UI + Mailpit | Grün (19.07.2026) |
| Bestehendes Konto anmelden und Einladung annehmen | `e2e/phase-j-invitations.spec.ts` | Grün (19.07.2026) |
| Code erst nach erfolgreicher Verbindung verbrauchen | Browser + RLS-Suite | Grün (19.07.2026) |
| Abgelaufen / widerrufen / verwendet | RLS-Suite | Grün (19.07.2026) |
| Praxiswechsel | RLS-Suite + UI-Bestätigung | Grün (19.07.2026) |
| Neues Gerät braucht keinen neuen Code | Browser mit frischem Context | Grün (19.07.2026) |

## Ausgeführte Gesamtprüfungen (19.07.2026, Toms Mac)

| Befehl | Ergebnis |
|---|---|
| `pnpm db:reset` | Grün: 20 Migrationen |
| `pnpm seed` | Grün; jetzt deterministisch, auch direkt nach E2E-Läufen (D-051) |
| `pnpm typecheck` | Grün |
| `pnpm lint` | Grün, 0 Warnungen |
| `pnpm test` | Grün: 21 Dateien, 105 Tests |
| `pnpm test:rls` | Grün: 78 Proben |
| `pnpm e2e` | Grün (Exit 0): 35 bestanden, 12 planmäßig übersprungen (Mobile-Skips mutierender Abläufe), 1 bekannter Parallellast-Flake vom Retry aufgefangen |
| `pnpm build` | Grün |
| `pnpm docs:sync` | Grün (Obsidian-Vault auf Toms Mac) |

## Bekannte Einschränkungen

- Ein einzelner Server-Action-Roundtrip kann unter voller E2E-Parallellast selten >10 s dauern (Einladungscode-Erzeugung); der konfigurierte Retry mit Trace fängt das auf.
- Formulare mit `state`+`revalidatePath` (Praxisbereich, Telefonnummer, Erinnerungen) sind vom intermittierenden Roundtrip-Problem grundsätzlich weiter betroffen (im Test 5×/5 stabil); patientenkritische Bestätigungen nutzen deshalb das Redirect-Muster (D-053).
- Browser-Tests der E-Mail-Änderung hinterlassen ein umbenanntes Demo-Konto; vor `pnpm test:rls` neu seeden bzw. Reste löschen.
- Virenscan/Quarantäne für Uploads bleibt vor Pilotbetrieb offen.
