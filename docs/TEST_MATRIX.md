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

## Dunkelmodus (nur Patienten)

| Anforderung | Automatisierte Abdeckung | Status |
|---|---|---|
| Umschalten wirkt sofort und wird im Cookie gemerkt | `theme-toggle.test.tsx` | Grün |
| Nur bekannte Werte, sonst hell | `theme-toggle.test.tsx` (`parsePatientTheme`) | Grün |
| Wahl gilt im ganzen Patientenbereich und übersteht Neuladen | `demo-accounts.spec.ts` (chromium + mobile) | Grün (19.07.2026) |
| Praxisbereich bleibt trotz Dunkel-Cookie hell | `demo-accounts.spec.ts` | Grün (19.07.2026) |

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

## Produktions- und Store-Reife (21.07.2026)

| Anforderung | Automatisierte Abdeckung | Status |
|---|---|---|
| CI-Pipeline reproduzierbar grün (Web/DB/Mobile/Security) | `.github/workflows/ci.yml`, 4 Jobs, mehrfach über `gh run view --log` real verifiziert (nicht nur lokal angenommen) | Grün (21.07.2026) |
| Security-Header/CSP blockiert Next.js nicht | Nonce-basierte CSP in `src/proxy.ts`; Playwright-Konsolencheck (0 Verstöße, 0 Fehler auf `/login`/`/register`) | Grün (21.07.2026) |
| Signierte Avatar-/Videobilder trotz CSP erreichbar | `img-src`/`media-src` inkl. Supabase-Origin; volle E2E-Suite nach Fix grün | Grün (21.07.2026) |
| Echte Kontolöschung (nicht nur Sperre) | 8 neue RLS-Proben (104 gesamt) + vollständiger Browser-Durchlauf mit Wegwerf-Konto (Login → Löschung → gesperrter Zweitlogin, Praxisdaten bleiben) | Grün (21.07.2026) |
| Malware-Scan lehnt in einer sonst gültigen Datei versteckte Signatur ab | E2E mit echtem ClamAV + projekteigener Testsignatur (`e2e/fixtures/clamav-test-signature.ndb`), CI installiert ClamAV real; EICAR ungeeignet (nur Dateianfang erkannt, empirisch geprüft) | Lokal grün (21.07.2026); CI-Bestätigung nach Timeout-Fix ausstehend |
| App-Icon/Splash aus der Marke statt Expo-Standard | `expo-doctor` 20/20, iOS+Android-Export grün nach Asset-Austausch | Grün (21.07.2026) |
| iOS-Fotozugriffstext gesetzt, keine unnötigen Berechtigungen | `expo config --type introspect` bestätigt Text + fehlende Kamera-/Mikrofon-Deklaration | Grün (21.07.2026) |

## Mobile Patienten-App (Teile H–M, 19.07.2026)

| Anforderung | Automatisierte Abdeckung | Status |
|---|---|---|
| Auth-Session sicher gespeichert (AES + SecureStore-Schlüssel) | Implementierung `secure-session-storage.ts`; Roundtrip implizit über Integrationsprobe (Login/Session) | Grün (19.07.2026) |
| Code vor Konto, gültiger/ungültiger Code | Jest (`invite.test.ts`, lokale Formatprüfung ohne Netz) + Integrationsprobe gegen `/api/mobile/invite/check` (200/404) | Grün (19.07.2026) |
| Einladung atomar annehmen, Praxiswechsel | bestehende RPC `redeem_patient_invite` (RLS-Suite deckt Zustände ab); App-Fluss im Simulator bis zur Codeprüfung/Anmeldung durchlaufen | Grün (20.07.2026, s. u.) |
| Praxisrollen-Aussperrung | Integrationsprobe (Mitgliedszeile via RLS erkannt) + `practice-blocked`-Screen | Grün (19.07.2026) |
| Heute: dokumentiert ≠ erledigt, Erfolg NUR bei completed | Jest `today.test.tsx` (4 Fälle inkl. Leerzustand und Web-Textparität) | Grün (20.07.2026) |
| Durchgangs-Dokumentation (alle Status, Mehrfach-Durchgänge) | Integrationsprobe (`record_exercise_occurrence` echt) + bestehende RLS-Proben (Duplikat/Fremdzugriff) | Grün (19.07.2026) |
| Video/signierte URLs nur für eigenen aktuellen Plan | Integrationsprobe: Medien-Endpunkt 200 mit Feldern, 401 ohne Token; Route prüft current_version + Besitzer | Grün (19.07.2026) |
| Profilbild Upload/Ersetzen/Entfernen (Ticket, Magic Bytes) | bestehende Avatar-Services + RLS-Sektion E (10 Proben); mobile Endpunkte 401-geprüft; Profil-Screen im Simulator mit Initialen-Platzhalter verifiziert | Grün serverseitig + Anzeige verifiziert (20.07.2026); Upload-Tap-Interaktion s. Einschränkungen |
| Kontolöschungsantrag (Audit, Zugangssperre, keine Client-Schreibrechte) | RLS-Proben (0 Zeilen lesbar, Insert abgelehnt) + Endpunkt 401-geprüft | Grün (19.07.2026) |
| Barrierefreiheit: beschriftete Buttons, Live-Regionen, Label↔Eingabe, Touch ≥ 48pt | Jest `ui.test.tsx`, `tab-bar.test.tsx` (3 Ziele, aktiver Zustand, Unterseiten-Zuordnung) | Grün (20.07.2026) |
| Sprachhygiene der App-Texte + Web-Textidentität | Jest `de.test.ts` (inkl. Stichproben-Vergleich gegen `@physio-check/shared/messages-de`) | Grün (20.07.2026) |
| Offline-/Lade-/Fehlerzustände | `useLoad` + ErrorView implementiert | Implementiert; Fehlerzustand im Simulator nicht separat provoziert |
| Untere Navigation vollständig sichtbar (Safe Area, Home Indicator) | `tab-bar.test.tsx` + Simulator-Screenshot iPhone 17 Pro | Grün (20.07.2026) – siehe UI-Parität unten |
| Großschrift/Screenreader auf echtem Gerät | – | Simulator-Screenshots bestätigen Struktur/Kontrast; echtes Gerät weiterhin offen |

## UI-Parität native App ↔ Patienten-Weboberfläche (20.07.2026)

Erster echter Simulatorlauf (iPhone 17 Pro, iOS 26.5, Metro über `exp://`-Tunnel/lokal) deckte eine abgeschnittene Tab-Bar und starke Designabweichungen auf. Ursache und Korrektur: `DECISIONS.md` D-063–D-067.

| Anforderung | Verifikation | Status |
|---|---|---|
| Tab-Bar-Cropping behoben, 3 beschriftete Ziele, aktiver Zustand | Simulator-Screenshots (Heute/Termine/Profil, hell) + `tab-bar.test.tsx` (4 Tests) | Grün |
| Design-Tokens identisch zur Web-Referenz (hell + dunkel) | Simulator-Screenshots hell/dunkel für „Heute“ und Code-Screen, Pixel-Vergleich der Farbwerte (OKLCH→Hex-Umrechnung geprüft) | Grün |
| Heute-Ansicht: Begrüßung, Fortschrittskarte, Balken, Checkliste, Chips-Format | Simulator-Screenshot mit echten Demo-Daten (3 Übungen, „0 von 3 eingetragen“) | Grün |
| Termine: Icon-Zeilen, Karten-Link, Absage-Collapsible, „N vergangene Termine“ | Simulator-Screenshot mit echtem Demo-Termin | Grün |
| Profil: Avatar-Platzhalter, Feldbeschriftungen, Hinweistexte wortgleich zum Web | Simulator-Screenshot | Grün |
| Verbindungsbereich: Kontoabschnitt mit Abmelden + rechtlicher Hinweis (echter Funktionslücken-Fund) | Simulator-Screenshot nach Fix; vorher fehlte der Abschnitt vollständig | Behoben und verifiziert |
| Gesamte Mobile+Web-Prüfkette nach dem Umbau | s. „Ausgeführte Gesamtprüfungen“ unten | Grün |

## Kalenderfarben pro Patient (D-057)

| Anforderung | Automatisierte Abdeckung | Status |
|---|---|---|
| Mitglied setzt Farbe der verbundenen Patientin | RLS-Suite (Upsert + Kontrolle) + E2E `demo-accounts.spec.ts` | Grün (19.07.2026) |
| Patientin liest/schreibt keine Farbzuordnungen | RLS-Suite (0 Zeilen + Insert abgelehnt) | Grün (19.07.2026) |
| Fremdpraxis liest nichts und kann fremdem Patienten keine Farbe zuweisen (auch nicht mit eigener practice_id) | RLS-Suite | Grün (19.07.2026) |
| Unverbundenes Konto liest nichts | RLS-Suite | Grün (19.07.2026) |
| Kalender färbt nach Patient, Legende, neutral ohne Zuordnung | E2E + Browser-Treiberlauf (Monat + Liste, „Keine Farbe“) | Grün (19.07.2026) |
| Einstellungen ohne persönliche Mitgliedsfarbe | Browser-Treiberlauf | Grün (19.07.2026) |
| Speicherbestätigung per Redirect (D-053) | E2E (`?calendar_color_saved=1`) + Browser-Treiberlauf gegen `pnpm start` | Grün (19.07.2026) |
| iPhone-Viewport: kein horizontales Scrollen, Farboptionen ≥ 48 px | Browser-Treiberlauf (390 px) | Grün (19.07.2026) |

## Ausgeführte Gesamtprüfungen (20.07.2026, Branch `claude-patient-mobile-ui-parity-20260719`, Toms Mac)

| Befehl | Ergebnis |
|---|---|
| `pnpm db:reset` | Grün: 24 Migrationen |
| `pnpm seed` | Grün; deterministisch auch direkt nach E2E-Läufen (D-051) |
| `pnpm typecheck` | Grün |
| `pnpm lint` | Grün, 0 Warnungen |
| `pnpm test` | Grün: 23 Dateien, 115 Tests |
| `pnpm test:rls` | Grün: 96 Proben |
| `pnpm e2e` | Grün (Exit 0): 49 bestanden, 0 fehlgeschlagen, 17 planmäßig übersprungen – nach `rm -rf .next` UND Beenden des parallel laufenden Metro-Bundlers/Simulators (echte Mitursache der Flakes, D-067) |
| `pnpm build` | Grün |
| `pnpm shared:typecheck` | Grün |
| `pnpm mobile:typecheck` | Grün |
| `pnpm mobile:lint` | Grün, 0 Fehler |
| `pnpm mobile:test` | Grün: 5 Dateien, 16 Tests (neu: `tab-bar.test.tsx`, erweiterte `today.test.tsx`) |
| `npx expo-doctor` | Grün: 20/20 Checks |
| `npx expo export --platform ios` | Grün: Hermes-Produktions-Bundle |
| **Simulatorlauf (iPhone 17 Pro, iOS 26.5, Metro über `exp://127.0.0.1:8081`)** | Login mit Demo-Patientin, Code-/Verbindungsbereich (inkl. neuem Kontoabschnitt), Heute, Termine, Profil – hell und dunkel; Tab-Bar vollständig sichtbar; s. „UI-Parität“ oben |
| `pnpm docs:sync` | Grün (Obsidian-Vault auf Toms Mac) |

## Bekannte Einschränkungen

- **GUI-Tap-Automatisierung im Simulator ist ohne manuelle macOS-Accessibility-Freigabe blockiert.** `cliclick`/`osascript System Events` scheitern mit „Accessibility privileges not enabled“ – das erfordert einen physischen Klick in Systemeinstellungen → Datenschutz & Sicherheit → Bedienungshilfen, den nur Tom ausführen kann (kein Code-Defekt). Verifikation erfolgte stattdessen über Expo-Deep-Links (`exp://127.0.0.1:8081/--/<route>`), `xcrun simctl ui booted appearance dark/light` (tap-frei) und einen temporären, **nie committeten** Test-Login-Screen (`_dev-login.tsx`, vor jedem Commit gelöscht, `git status` bestätigt keinen Rest). Formulareingaben (Telefonnummer ändern, Bild auswählen, Absage-Text) und Übungsdetail/geführte Sitzung wurden dadurch NICHT per Tap im Simulator geprüft, nur per Code-Review und den bestehenden Komponententests. Wenn Tom die Berechtigung erteilt, kann ein Folgelauf diese Lücke schließen.
- Nach wiederholten `db:reset`/Seed-Zyklen kann sich der Turbopack-Dev-Cache verkeilen: E2E-Navigationen hängen dann dauerhaft und der WebServer loggt ChunkLoadErrors. Abhilfe: `rm -rf .next` vor dem Lauf. **Neu (20.07.2026):** Ein zusätzlicher, bisher unbekannter Auslöser sind parallel laufende Mobile-Entwicklungsprozesse (Metro-Bundler + gebooteter Simulator) – sie konkurrieren mit dem Next-Dev-Server um lokale Ressourcen und lösten in dieser Sitzung zwei aufeinanderfolgende Fehlschläge trotz Cache-Löschung aus. Vor `pnpm e2e` immer `pnpm mobile:start` beenden und den Simulator herunterfahren.
- Ein einzelner Server-Action-Roundtrip kann unter voller E2E-Parallellast selten >10 s dauern (Einladungscode-Erzeugung); der konfigurierte Retry mit Trace fängt das auf.
- Formulare mit `state`+`revalidatePath` (Praxisbereich, Telefonnummer, Erinnerungen) sind vom intermittierenden Roundtrip-Problem grundsätzlich weiter betroffen (im Test 5×/5 stabil); patientenkritische Bestätigungen nutzen deshalb das Redirect-Muster (D-053).
- Browser-Tests der E-Mail-Änderung hinterlassen ein umbenanntes Demo-Konto; vor `pnpm test:rls` neu seeden bzw. Reste löschen.
- Virenscan/Quarantäne für Uploads bleibt vor Pilotbetrieb offen.
