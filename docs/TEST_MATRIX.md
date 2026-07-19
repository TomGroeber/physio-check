# PhysioCheck – Testmatrix

> Stand 19.07.2026. „Grün“ bedeutet tatsächlich lokal ausgeführt (Toms Mac, Supabase/Docker/Mailpit). Letzter vollständiger Lauf: 19.07.2026 auf Branch `claude-patient-exercise-avatar-20260719`.

## Video-first-Übungsansicht

| Anforderung | Automatisierte Abdeckung | Status |
|---|---|---|
| Video steht vor den kompakten Vorgaben | `exercise-view.test.tsx` (DOM-Reihenfolge) | Grün |
| Ausgangsposition/Schritte/Fehler/Beschreibung nicht in der Patientenansicht | `exercise-view.test.tsx` + `demo-accounts.spec.ts` | Grün (19.07.2026) |
| Daten bleiben in der Praxis-Übungsverwaltung erhalten | `demo-accounts.spec.ts`: Bibliotheksformular zeigt Ausgangsposition/Schritte mit Seed-Werten | Grün (19.07.2026) |
| Dosierung, Häufigkeit, Uhrzeiten, Hilfsmittel, Praxisnotiz sichtbar | `exercise-view.test.tsx` + E2E-Chips | Grün (19.07.2026) |
| Video mit Untertiteln/Poster, kein Autoplay | `exercise-view.test.tsx`; realer Upload+Anzeige in `phase-j-exercise-management.spec.ts` | Grün (19.07.2026) |
| Alternativbild und freundlicher Leerzustand | `exercise-view.test.tsx` + `demo-accounts.spec.ts` | Grün (19.07.2026) |
| Alle Rückmeldestatus/mehrere Durchgänge unverändert | bestehende `core-flow`-/Occurrence-Tests | Grün (19.07.2026) |
| Nur „erledigt“ erzeugt „Geschafft!“ | `success-celebration.test.tsx` + `core-flow.spec.ts` | Grün |
| Mobil kein horizontales Scrollen | `demo-accounts.spec.ts` (auch Mobile-Projekt) + manueller iPhone-Lauf | Grün (19.07.2026) |

## Patienten-Profilbild

| Anforderung | Automatisierte Abdeckung | Status |
|---|---|---|
| Gültiges Bild hochladen (mit Vorschau), bleibt nach Neuladen | `patient-avatar.spec.ts` | Grün (19.07.2026) |
| Ungültiger Typ / falsche Signatur / zu groß abgelehnt | `patient-avatar.spec.ts` + `media.test.ts` (WebP-/Mismatch-Signaturen, Limit) | Grün (19.07.2026) |
| Ersetzen: alte signierte URL wird unbrauchbar | `patient-avatar.spec.ts` (altes Objekt gelöscht → Fehlerantwort) | Grün (19.07.2026) |
| Entfernen: Datei und Verweis weg, Initialen-Platzhalter | `patient-avatar.spec.ts` | Grün (19.07.2026) |
| Aktuell verbundene Praxis sieht das Bild (Liste + Detail) | `patient-avatar.spec.ts` + RLS-Probe | Grün (19.07.2026) |
| Fremder Patient / fremde Praxis / anonym: kein Zugriff | RLS-Suite Sektion E | Grün (19.07.2026) |
| Ehemalige Praxis nach Praxiswechsel: kein Zugriff | RLS-Suite (nach C2-Wechselablauf) | Grün (19.07.2026) |
| Direkter Client-Upload/-Delete im Bucket gesperrt | RLS-Suite Sektion E | Grün (19.07.2026) |
| `avatar_path` nicht direkt vom Client beschreibbar | RLS-Suite Sektion E (Spaltenrechte) | Grün (19.07.2026) |
| Pfad-/Ordnerprüfung vor jeder Signierung | `media.test.ts` (`storagePathBelongsToProfile`) | Grün |

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
| `pnpm db:reset` | Grün: 21 Migrationen (inkl. `20260719100000_patient_avatars.sql`) |
| `pnpm seed` | Grün; deterministisch auch direkt nach E2E-Läufen (D-051) |
| `pnpm typecheck` | Grün |
| `pnpm lint` | Grün, 0 Warnungen |
| `pnpm test` | Grün: 22 Dateien, 114 Tests |
| `pnpm test:rls` | Grün: 88 Proben |
| `pnpm e2e` | Grün (Exit 0): 43 bestanden, 16 planmäßig übersprungen (Mobile-Skips mutierender Abläufe); vereinzelte bekannte Latenz-Flakes fängt der Retry |
| `pnpm build` | Grün |
| `pnpm docs:sync` | Grün (Obsidian-Vault auf Toms Mac) |
| Mobiler Browserlauf (iPhone 14) | Grün: Video volle Breite (390/390 px), kein horizontales Scrollen, Avatar-Upload mobil, Kopfzeilen-Avatar, Praxisliste/-detail mit Bild |

## Bekannte Einschränkungen

- Ein einzelner Server-Action-Roundtrip kann unter voller E2E-Parallellast selten >10 s dauern (Einladungscode-Erzeugung); der konfigurierte Retry mit Trace fängt das auf.
- Formulare mit `state`+`revalidatePath` (Praxisbereich, Telefonnummer, Erinnerungen) sind vom intermittierenden Roundtrip-Problem grundsätzlich weiter betroffen (im Test 5×/5 stabil); patientenkritische Bestätigungen nutzen deshalb das Redirect-Muster (D-053).
- Browser-Tests der E-Mail-Änderung hinterlassen ein umbenanntes Demo-Konto; vor `pnpm test:rls` neu seeden bzw. Reste löschen.
- Virenscan/Quarantäne für Uploads bleibt vor Pilotbetrieb offen.
