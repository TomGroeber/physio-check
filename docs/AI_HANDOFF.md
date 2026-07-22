# PhysioCheck – AI Handoff

> Stand: 2026-07-21 · `main@9415660` (PR #3 gemergt als `342fba5`, danach Doku-Korrektur `9415660`) enthält ALLE bisherigen Aufträge inkl. der UI-Parität der nativen App · Arbeitszweig für die Store-Release-Vorbereitung: `claude/store-release-readiness-20260721` · GitHub-Remote: `TomGroeber/physio-check` (öffentlich, D-036; keine Secrets/echten Daten)

## Aktueller Auftrag (21.07.2026, siebter): Produktions- und Store-Reife

Vollständiger Audit gegen den tatsächlichen Repository-Zustand (nicht gegen frühere Berichte) durchgeführt – alle acht im Auftrag genannten Verdachtsstellen bestätigt plus zusätzliche Funde (fehlende Security-Header, fehlendes Engines-Pinning, keine Malware-Scan-Pipeline). Vollständige, belegte Matrix: `docs/RELEASE_READINESS.md`. Diese Sitzung arbeitet die dort als „IMPLEMENTIERBAR – JETZT AUSFÜHREN" markierten Punkte ab und dokumentiert alle Konto-/Zahlungs-/Rechtsblocker exakt, ohne sie zu erfinden oder zu umgehen.

**Bisher umgesetzt und real verifiziert (nicht nur „sollte funktionieren"):**

- **CI-Pipeline** (`.github/workflows/ci.yml`, 4 Jobs) – über mehrere echte `gh run view --log`-Läufe verifiziert, drei reale Fehlerursachen dabei gefunden und behoben (Node-Version, Gitleaks-Token, WebKit für das „mobile"-Playwright-Projekt). `engines`/`packageManager` in `package.json` gepinnt (D-068).
- **Security-Header/CSP** – nonce-basiert in `src/proxy.ts` (eine statische CSP hätte Next.js' eigene Inline-Skripte blockiert, per Playwright-Konsolencheck belegt); `img-src`/`media-src` erlauben zusätzlich die Supabase-Origin (sonst brechen signierte Avatar-/Videobilder, per E2E-Regression gefunden) (D-069).
- **Echte Kontolöschung** statt reiner Zugangssperre, inkl. Web-Weg (fehlte vorher komplett) und öffentlicher Info-Seite `/account-deletion` – Migration `20260721100000_real_account_deletion.sql`, 104 RLS-Proben, vollständiger Browser-Durchlauf mit Wegwerf-Konto (D-070).
- **Malware-Scan-Pipeline** für Übungsmedien und Profilbilder (`src/server/services/malware-scan.ts`, ClamAV, fail-closed) hinter `MALWARE_SCAN_ENABLED` – **real in CI grün verifiziert** (`gh run view 29941832703`, alle 4 Jobs). Ein isolierter, serieller CI-Verifikationslauf (um Parallel-Worker-Konkurrenz bei `clamscan` zu vermeiden) schlug über mehrere Iterationen fehl; jede Ursache wurde per echtem Server-/Scanner-Log gefunden statt vermutet (D-071/D-072/D-077 bis D-081) – die letzte und tatsächliche Ursache: der CI-Schritt startete den Webserver ohne `MALWARE_SCAN_ENABLED=true`, nur der Playwright-Befehl hatte die Variable gesetzt.
- **App-Icon/Splash/Adaptive-Icon aus der Marke** (`logo.svg`) statt Expo-Standard-Icon, plus deutscher iOS-Fotozugriffstext ohne unnötige Kamera-/Mikrofon-Deklaration (D-073/D-074) – `expo-doctor` 20/20, iOS+Android-Export grün.
- **Store-Datenschutz-Mappings und Store-Texte**: Apple-App-Privacy-/Google-Data-Safety-/Health-Mapping direkt aus dem Code abgeleitet (kein Tracking/Analytics/Crash-SDK vorhanden, siehe D-075); deutscher Entwurf für Beschreibung/Keywords/Kategorie/Alterseinstufung, bewusst „Gesundheit und Fitness" statt „Medizin" (D-076).
- **Health-Check-Route + Deployment-Vorbereitung**: `GET /api/health`, vollständige Env-Var-Liste/Rollout-Schritte/Monitoring-Konzept in `docs/DEPLOYMENT.md` – alles ohne Konto-/Domain-Entscheidung Machbare.
- **Nebenbefund behoben**: Expo-SDK-Patch-Drift (`expo-doctor` scheiterte an veralteten Paketen, unabhängig vom eigentlichen Auftrag) – `@expo/metro-runtime` fehlte als direkte Abhängigkeit (D-082).
- **Phase 2 (Android-Emulator + erweiterte iOS-Matrix)**: Android-Emulator kostenlos lokal eingerichtet (Command-Line-Tools + OpenJDK 17, kein Konto), `expo run:android` echt gebaut auf Android 16/API 36, echte Anmeldung + echte Backend-Daten in Hell/Dunkel geprüft (D-084). iOS-Matrix um iPhone Air + iPad Air 11" erweitert, Dark Mode + größte Dynamic-Type-Stufe + `supportsTablet: false`-Layout bestätigt. VoiceOver/Reduce Motion/vollständiger Tap-Durchlauf bleiben ohne Bedienungshilfen-Berechtigung offen (Umgebungsblocker auf Toms Mac, nicht neu). Erkenntnis zu einer Grenze der Deep-Link-Navigationsverifikation dokumentiert (D-085).

**Offen für die nächste Etappe:** Phase 5 Rest (iOS Privacy Manifest, finale App-Identität – Toms Entscheidung), Phase 3 Rest (gehostetes Supabase-Projekt/Domain/Hosting – BLOCKIERT DURCH TOM/KONTO), Phase 6 Rest (Screenshots, blockiert durch A2/A7), Phase 7–8, Release-Candidate-Report.

## Letzter Auftrag (20.07.2026, sechster): UI-Parität der nativen App mit der Patienten-Weboberfläche

**Ausgangslage:** Erster echter Test der Expo-App im iPhone-17-Pro-Simulator (iOS 26.5) zeigte drei Probleme: abgeschnittene untere Navigation, schlecht sichtbare Tab-Beschriftungen, und ein Design, das deutlich von der bereits abgestimmten Patienten-Weboberfläche abwich. **Der Xcode-/Simulator-Blocker früherer Sitzungen ist damit überholt** – Xcode 26.6 ist installiert, der Simulator läuft, die Anmeldung mit dem Demo-Patientenkonto funktioniert.

**Root Cause des Croppings:** `(tabs)/_layout.tsx` setzte `tabBarStyle.height` fest auf 64 pt (ignorierte den Home-Indicator-Inset) und lieferte keine Icons (`tabBarIcon: () => null`). Behoben durch eine neue `PatientTabBar`-Komponente, die ihre Höhe aus Inhalt + `useSafeAreaInsets().bottom` berechnet (D-063).

**Umgesetzt:** Vollständige visuelle und strukturelle Neuausrichtung an der Patienten-Weboberfläche (D-064): Design-Tokens 1:1 aus `globals.css` (OKLCH→Hex) in `branding.ts`, App-Header mit Logo+Avatar, alle 13 Patientenstrecken (Willkommen/Code/Registrierung/Login, Verbindung+Aussperrung, Heute, geführte Sitzung, Übungsdetail+Video, Termine/Absage/Angebote, Verordnung, Profilbild, Telefon/Erinnerungen, Darstellung, E-Mail/Passwort, Abmelden/Kontolöschung) nach Web-Vorbild neu gebaut. Deutsche Texte, Erinnerungslogik und Dokumentationsvalidierung liegen jetzt gemeinsam in `packages/shared` (D-065) – App und Website verwenden wortgleiche Texte. Dark Mode folgt dem Systemschema mit persistenter Gerätewahl wie im Web (D-066).

**Echter Funktionslücken-Fund beim Simulatortest:** Der native Code-/Verbindungsbildschirm hatte keinen Kontoabschnitt (Name/E-Mail/„Abmelden“) wie der Web-Verbindungsbereich (`/connect`) – ohne ihn gab es keinen Ausweg, wenn die Sitzung nach einem `pnpm seed`-Reset ungültig wurde. Ergänzt: Kontoabschnitt mit Abmelden + rechtlichem Hinweis, plus die korrekten Hub-Texte (verbunden/unverbunden), identisch zum Web.

**Simulator-Verifikation ohne Tap-Automatisierung:** `xcrun simctl` bietet keine Tap-/Texteingabe-APIs. `cliclick` wurde installiert (lokal, kostenlos, reversibel), scheiterte aber an fehlender macOS-Bedienungshilfen-Berechtigung, die nur Tom manuell in den Systemeinstellungen erteilen kann (echtes Hindernis, kein Codefehler). Alternative, tap-freie Verifikation: Expo-Deep-Links (`exp://127.0.0.1:8081/--/<route>`) zum Navigieren, `xcrun simctl ui booted appearance dark|light` zum Hell/Dunkel-Wechsel, ein temporärer Test-Login-Screen (`_dev-login.tsx`, signiert mit Demo-Patientin und leitet weiter) – **vor dem Commit gelöscht, nie im Git-Index** (`git status` bestätigt). Ergebnis: Tab-Bar vollständig sichtbar, Heute/Termine/Profil stimmen strukturell und textlich mit der Web-Referenz überein (Screenshots im Sitzungs-Scratchpad, nicht im Repo), Dunkelmodus exakt wie Web-Tokens.

**Nebenfund:** Die zwei bereits dokumentierten, gelegentlich flakenden Mobile-E2E-Fälle scheiterten zweimal in Folge trotz `rm -rf .next`. Root-Cause-Analyse (drittes Scheitern hätte laut Debugging-Regel eine Architekturfrage ausgelöst) ergab eine konkrete Mitursache: der parallel laufende Metro-Bundler + gebooteter Simulator konkurrierten um lokale Ressourcen mit dem Next-Dev-Server. Nach deren Beenden lief die Suite sofort grün (D-067).

**Prüfstand:** Mobile Typecheck/Lint (0 Fehler)/16 Tests (5 Dateien, neu `tab-bar.test.tsx` + erweiterte `today.test.tsx`)/expo-doctor 20:20/iOS-Export ✓. Web nach Umbau (geteilte Texte/Reminder/Validierung verschoben) komplett grün: Typecheck, Lint, 115 Tests, 96 RLS-Proben, E2E 49 bestanden/0 fehlgeschlagen, Build, shared:typecheck.

**Bewusst verbliebene Lücke:** Formulareingaben (Tippen: Telefonnummer, Absagegrund, Bildauswahl-Dialog) und Übungsdetail/geführte-Sitzung-Screens wurden NICHT per echtem Tap im Simulator geprüft (Accessibility-Blocker), nur per Code-Review gegen die Web-Referenz und bestehende Komponententests. Wenn Tom die Bedienungshilfen-Berechtigung erteilt, kann ein Folgelauf das schließen.

**Merge-Status:** PR #3 wurde mit Toms Freigabe gemergt (`342fba5`, 20.07.2026, regulärer Merge-Commit wie PR #2). `main` enthält damit die vollständige UI-Parität. Nach dem Merge erneut verifiziert: Web-Typecheck ✓, 115 Web-Tests ✓, Mobile-Typecheck ✓, 16 Mobile-Tests ✓.

**Nächster konkreter Schritt:** (1) optional: Bedienungshilfen-Berechtigung erteilen (Systemeinstellungen → Datenschutz & Sicherheit → Bedienungshilfen) für einen vollständigen Tap-Durchlauf inkl. Formularen; (2) Android-Emulator-Lauf (Android Studio fehlt weiterhin); (3) danach Store-Checkliste. Startbefehle: `supabase start && pnpm db:reset && pnpm seed && pnpm build && pnpm start` (Backend) + `pnpm mobile:start` bzw. `expo start --tunnel` (App). Testbefehle: `pnpm mobile:test`, `pnpm test:rls`, `pnpm e2e` (vorher Metro/Simulator beenden, D-067).

## Vorheriger Auftrag (19.07.2026, fünfter): Native Patienten-App (Expo)

**Merge-Status:** Die Branch-Kette Dark Mode (`52e6c47`) → Kalenderfarben (`28ee792`) → Mobile (`389c53c`) wurde mit Toms Freigabe über **PR #2 vollständig nach `main` gemergt (`a776f23`, 19.07.2026)**. Es warten keine Feature-Branches mehr auf einen Merge.

**Was existiert:** Vollständige Expo-App unter `apps/patient-mobile` (SDK 57, Expo Router, TS strict, deutsch) mit Code-/Konto-Einstieg, Deep Links, Praxisrollen-Aussperrung, Heute/Übung(Video)/Terminen/Angeboten/Einheiten/Profil(Bild)/Erinnerungen/E-Mail-Änderung/Abmelden/Kontolöschungsantrag; `packages/shared` mit plattformneutraler Logik (Website re-exportiert unter alten Pfaden); Bearer-geschützte `/api/mobile`-Endpunkte in der Website; Migration 24 (`account_deletion_requests`). Details: `docs/MOBILE_ARCHITECTURE.md` (Architektur), `docs/MOBILE_DEVELOPMENT.md` (Betrieb/Eigenheiten inkl. Jest-29-Pinning und async `render`), `docs/APP_STORE_CHECKLIST.md` (Store-Readiness).

**Prüfstand mobile:** `pnpm mobile:typecheck` ✓ · `pnpm mobile:lint` 0 Fehler ✓ · `pnpm mobile:test` 10/10 ✓ · `expo-doctor` 20/20 ✓ · `expo export --platform ios` (Hermes-Bundle) ✓ · Integrationsprobe 15/15 gegen lokale Supabase + `pnpm start` (Login, Rollen/Link, Heute-Berechnung, `record_exercise_occurrence`, Medien-Endpunkt mit signierten URLs, 401-Grenzen, Code-Prüfung, Aussperrung). **Web nach Umbau komplett grün:** Typecheck, Lint, 115 Tests, db:reset (24 Migrationen), Seed, 96 RLS-Proben, E2E 49 bestanden/0 fehlgeschlagen, Build.

**Echte Blocker (kein Codefehler):** kein Xcode/Android SDK auf Toms Mac (kein Simulator-/Emulatorlauf, kein nativer Build), keine EAS-/Store-Konten, keine Push-Credentials, keine Universal-Link-Domain, keine Datenschutzerklärungs-URL, offene Aufbewahrungsrechtsfrage Luxemburg (D-062).

**Nächster konkreter Schritt:** (1) Xcode installieren; (2) `pnpm mobile:ios`; (3) vollständiger Simulator-Durchlauf aller Patientenflüsse (Checkliste in `docs/TEST_MATRIX.md`, Abschnitt Mobile); (4) danach die Store-Checkliste (`docs/APP_STORE_CHECKLIST.md`) Punkt für Punkt mit Toms Freigaben. Startbefehle: `supabase start && pnpm db:reset && pnpm seed && pnpm build && pnpm start` (Backend) + `pnpm mobile:start` (App, `.env` nach `.env.example`). Testbefehle: `pnpm mobile:test`, `pnpm test:rls`, `pnpm e2e`.

## Letzter Auftrag (19.07.2026, vierter): Kalenderfarben pro Patient (aus Unterbrechung gerettet)

Die Vorsitzung wurde mitten in diesem Feature durch das Nutzungslimit beendet; 11 Dateien lagen uncommittet im Working Tree. Vorgehen der Übernahme: Zustand vollständig nur lesend analysiert, nichts verworfen, alles als ehrlicher `WIP:`-Commit `96e61bf` gesichert und gepusht, danach fertiggestellt.

**Wichtig zur Einordnung:** Die `calendarColor`-Erweiterung des `Promise.all` auf der Praxis-Patientendetailseite gehört NICHT zum Avatar-Platzhalter (der Avatar-Auftrag war bereits fertig auf `main`), sondern ist Teil dieses eigenständigen Features D-057.

**Feature (D-057):** Kalenderfarben wandern vom Praxismitglied zum Patienten. Migration `20260719120000_patient_calendar_colors.sql` (22. Migration): neue Tabelle `patient_calendar_colors` (Farbe je Praxis+Patient, Muster `pinned_patients`: keine Patienten-Policy), `practice_members.calendar_color` entfernt. Farbwahl auf der Patientendetailseite (`PatientColorPicker`, 8 Farben + „Keine Farbe“), Kalender färbt nach Patient, Legende nur zugeordnete Patienten im sichtbaren Zeitraum.

**Bei der Fertigstellung ergänzt/repariert:** (1) Migration gehärtet – Insert/Update verlangen `member_can_view_patient` (aktive Verbindung) wie bei `pinned_patients`, fehlende `grant`-Rechte ergänzt; (2) Scope-Fehler in `AppointmentList` (nutzte Helfer aus `CalendarPage`) – Farbzuordnung jetzt als Prop; (3) `calendar_color` aus den drei Selects in `appointments.ts`, aus `database.types.ts` (von Hand, kein Voll-Regen! s. u.), Seed (Demo-Patientin „Petrol“), alter `CalendarColorPicker` + Schema + Test entfernt; (4) Legende in `de.ts` von „Farben der Behandelnden“ auf „Farben der Patienten“ korrigiert; (5) 4 neue RLS-Proben (94 gesamt) und E2E-Fall „Kalenderfarbe zuweisen“ in `demo-accounts.spec.ts`.

**Zwei Debugging-Erkenntnisse dieser Sitzung:**

1. **D-053 trifft auch dieses Formular – auf dem Produktionsserver reproduzierbar.** Der ursprüngliche Rückgabezustand (`success` + `revalidatePath`) erreichte den Client beim Browserlauf gegen `pnpm start` in 2 von 2 Versuchen nicht (Button blieb auf „Wird geladen …“, serverseitig war korrekt gespeichert). Die Action bestätigt jetzt per `redirect(…?calendar_color_saved=1)`, die Detailseite zeigt das Banner. Beim Testen solcher Redirects beachten: Nach einem `goBack` steht der Query-Parameter schon in der URL, `waitForURL` wäre sofort erfüllt – für Wiederherstellungs-Schritte immer eine frische URL ohne Parameter ansteuern.
2. **E2E-Hänger = verkeilter Turbopack-Cache, nicht Last.** Zwei Mobile-Navigationstests hingen über mehrere Läufe dauerhaft (`page.goto` lud nie fertig, auch mit 60 s Timeout; WebServer-Log voller ChunkLoadErrors). Ursache ist das im `verify`-Skill dokumentierte Verkeilen des Turbopack-Dev-Caches nach wiederholten DB-Resets/Seeds: Nach `rm -rf .next` lief die komplette Suite grün und mit 49 s so schnell wie nie. Betriebsregel: Hängen E2E-Navigationen und erscheinen ChunkLoadErrors im WebServer-Log → `.next` löschen, nicht an Timeouts drehen. Der auf 60 s angehobene Testtimeout in `playwright.config.ts` bleibt als Reserve für echte Lastspitzen.

## Vorheriger Auftrag (19.07.2026, dritter): Dunkelmodus für Patienten

Branch `claude-patient-dark-mode-20260719`: Die vorbereitete `.dark`-Token-Palette ist jetzt für Patienten aktivierbar (D-056). `src/lib/theme.ts` (Cookie `pc-theme`, Parsing, `applyPatientTheme`), Umschalter `src/components/patient/theme-toggle.tsx` im Profilbereich „Darstellung“, Patienten-Layout liest das Cookie serverseitig und setzt `.dark` + `color-scheme` NUR auf dem Wrapper (`data-patient-theme-root`) – der Praxisbereich liest das Cookie nie und bleibt hell. Tailwinds `dark:`-Variante greift dank `@custom-variant dark (&:is(.dark *))` auch unter dem Wrapper. Geprüft: Typecheck, Lint, 116 Tests, Build, E2E Exit 0 (45 bestanden), mobiler Dunkel-Screenshot-Lauf.

## Vorheriger Auftrag (19.07.2026, zweiter): Video-first-Übungsansicht und Patienten-Profilbild

Fünf Commits auf `claude-patient-exercise-avatar-20260719`; mit Toms Freigabe nach `main` gemergt (Fast-Forward `4723363..91591df`, 19.07.2026).

**Übungsansicht (D-055):** Neue gemeinsame Komponente `src/components/patient/exercise-view.tsx` für `/exercises/[planItemId]` und `/session`: randloses 16:9-Video (Container `aspect-video`, auf Mobil `-mx-4`), Poster, WebVTT-Untertitel, nie Autoplay; ohne Video Alternativbild, sonst freundlicher Leerzustand. Darunter eine Vorgabenfläche mit Dosierungs-Chips (inkl. Hilfsmittel), Schedule-Zeile, Uhrzeiten und hervorgehobener Praxisnotiz. Beschreibung/Ausgangsposition/Schritte/häufige Fehler werden Patienten nicht mehr gezeigt – Daten, Praxis-Formular (`exercise-form.tsx`) und Snapshots unverändert. Komponententests in `exercise-view.test.tsx`.

**Profilbild (D-054):** Migration `20260719100000_patient_avatars.sql` (21. Migration): `profiles.avatar_path` + enge Spaltenrechte (`grant update (full_name, phone, locale)`), privater Bucket `patient-avatars` (5 MB, JPEG/PNG/WebP), einzige Storage-Policy = Lesen für sich selbst oder `member_can_view_patient` (Ex-Praxis verliert Zugriff automatisch). Neuer Service `src/server/services/patient-avatar.ts` + Actions `src/server/actions/avatar.ts` nach dem Ticket-Muster (zufälliger Pfad `<profile_id>/<uuid>.<ext>`, Größen-/Magic-Byte-Prüfung inkl. neuer WebP-Signatur in `src/config/media.ts`, Ersetzen/Entfernen löschen Objekte, Audit ohne Dateinamen). UI: `avatar-upload.tsx` (Vorschau, Fortschritt, bestätigtes Entfernen; Finalize-Action gibt die frische signierte URL zurück → deterministische Anzeige) und gemeinsames `src/components/patient-avatar.tsx` (rund, feste Größe, Initialen-Platzhalter, onError-Fallback) in Patienten-Kopfzeile, Profil, Praxis-Patientenliste und -detail (`listPatients`/`getPatientDetail` signieren nach Scope- und Pfadprüfung).

**Tests:** RLS-Sektion E mit 10 Proben (eigener/fremder Patient, aktuelle/fremde/ehemalige Praxis, anonym, direkter Upload/Delete gesperrt, Spalte nicht beschreibbar) → 88 Proben gesamt. Neues `e2e/patient-avatar.spec.ts` (4 serielle Strecken) und zwei neue `demo-accounts`-Fälle (video-first-Seite ohne Langtexte + Bibliothek behält Felder) → 59 gelistete Fälle. Playwright: `workers: 4`, `expect.timeout: 15s`; drei Spezifikationen gegen Klickverlust vor der Hydration gehärtet (networkidle bzw. direkte Link-URL).

**Prüfstand (alles lokal, 19.07.2026):** db:reset 21 Migrationen ✓ · Seed ✓ · Typecheck ✓ · Lint ✓ · 114 Unit-/Komponententests ✓ · 88 RLS-Proben ✓ · E2E Exit 0 (43 bestanden, 16 planmäßig übersprungene Mobile-Duplikate mutierender Strecken, vereinzelt bekannte Latenz-Flakes vom Retry gefangen) · Build ✓ · mobiler Browserlauf (iPhone 14: Video volle Breite 390 px, kein horizontales Scrollen, Avatar-Upload mobil, Kopfzeilen-Avatar, Praxisliste/-detail mit Bild) ✓.

**Wichtig für Nachfolger:** `src/server/db/database.types.ts` wurde bewusst NUR um `avatar_path` von Hand ergänzt – ein voller `pnpm db:types`-Regen erzeugt striktere RPC-Argumenttypen, die bestehenden Code brechen (bei Gelegenheit gesammelt angehen). Vor `pnpm e2e` immer frisch seeden; `pnpm`-Befehle aus dem Repo-Root.

## Vorheriger Auftrag (19.07.2026): Lokale Prüfungen und Fehlerbehebung auf Toms Mac

Alle bisher offenen lokalen Prüfungen wurden ausgeführt und sind grün: `pnpm db:reset` (20 Migrationen), `pnpm seed` (jetzt deterministisch, auch direkt nach E2E), Typecheck, Lint, 105 Unit-Tests, `pnpm test:rls` (78 Proben), `pnpm e2e` (Exit 0: 35 bestanden, 12 planmäßig übersprungen, 1 bekannter Parallellast-Flake vom eingebauten Retry aufgefangen), `pnpm build`. Zusätzlich manuelle Playwright-Browser-Durchläufe der Patientenflüsse (Desktop + iPhone-14-Viewport) inklusive Mailpit.

Behobene Fehler (Details in `DECISIONS.md` D-051–D-053 und README „Letzte Änderungen“):

1. **Medien-Finalisierung hing dauerhaft** (`src/server/services/exercise-media.ts`): `reader.cancel()` kehrt im Next-Server nie zurück → Range-Antwort wird jetzt vollständig gelesen. Damit läuft der Phase-J-Video-E2E-Test erstmals wirklich durch (ungültige Signatur abgelehnt, Ersetzen entwertet die alte URL, Patientin erhält nur die kurzlebige signierte URL).
2. **Terminabsage/E-Mail-Änderung bestätigten unzuverlässig** (`state`+`revalidatePath`-Antwort erreicht den Client intermittierend nicht): beide Actions leiten jetzt nach Erfolg weiter (`?cancellation_requested=1` / `?email_change_requested=1`), die Zielseiten zeigen die Bestätigung (D-053). Terminabsage 5×/5 in ~230 ms verifiziert.
3. **Zweiter Bestätigungslink der E-Mail-Änderung** landete auf `/auth/error` (PKCE-Code beim zweiten Link nicht mehr tauschbar, Änderung aber längst vollzogen): `/auth/confirm` leitet bei bestehender Session jetzt zum internen Ziel weiter.
4. **Seed war nicht deterministisch** (`scripts/seed.ts`): stille FK-Blocker (Einladungen, Verordnungen/Anrechnungen, Dokumente, Selbstauskünfte) werden jetzt in fester Reihenfolge gelöscht, Fehler nie mehr verschluckt (D-051). `seed → e2e → seed` läuft ohne Fehlversuch.
5. **Sprachhygiene:** Tagesfortschritt „X von Y geschafft“ zählte auch nicht erledigte Rückmeldungen → jetzt „eingetragen“ (D-041/D-049-konform). Vier hartkodierte Patiententexte nach `src/messages/de.ts` verschoben (`pastToggle`, `coverageHintTitle`, `optionalToggle`, `cancelToggle`, `cancellationRequestedBanner`).
6. **E2E-Spezifikationen repariert:** Login-Race in `demo-accounts` (fehlendes `waitForURL`), mehrdeutige Selektoren („Passwort ändern“ Heading vs. Button, „Wandsitz“ auf dem Dashboard, „Schmerz nachher: 2/10“ auch im Seed von gestern), Ersetzen-Race im Video-Test (`expect.poll` auf neue signierte URL).

Browser-verifiziert (Screenshots im Sitzungs-Scratchpad, nicht im Repo): Heute-Checkliste mit „Geschafft!“ nur bei `completed`; neutrale Rückmeldung bei „teilweise“/„zu schwierig“/„nicht möglich“ (nie als Erfolg dargestellt, Abschluss „Für heute alles eingetragen“); Terminübersicht mit eingeklappten vergangenen Terminen und Absage; Profil (4 Bereiche, Telefonnummer, Erinnerungen); Passwortänderung über Mailpit-Recovery-Link inkl. Login mit neuem Passwort; E-Mail-Änderung mit Doppelbestätigung inkl. Login mit neuer Adresse; `next=//…`-Redirect-Schutz; Praxisbereich-Aussperrung; iPhone-Viewport ohne horizontales Scrollen, Touch-Ziele ≥ 48 px.

**Wichtige Betriebshinweise:**
- Vor `pnpm e2e` immer frisch `pnpm seed` ausführen und sicherstellen, dass kein veralteter Server auf Port 3000 läuft (`reuseExistingServer: true` übernimmt sonst alten Code – genau das erzeugte anfangs 5 Scheinfehler).
- Browser-Tests der E-Mail-Änderung hinterlassen ein umbenanntes Konto (`petra-neu-*@demo.physiocheck.test`); vor `pnpm test:rls` solche Reste löschen oder neu seeden, sonst findet die Suite Petra doppelt.
- Die übrigen Formulare mit `state`+`revalidatePath` (u. a. Praxisbereich, Telefonnummer, Erinnerungen) zeigten im Test 5×/5 korrektes Verhalten, bleiben aber grundsätzlich vom intermittierenden Roundtrip-Problem betroffen (bekannter Punkt 5/6 unten); bei Wiederauftreten auf das Redirect-Muster D-053 umstellen.

## Vorheriger Auftrag: Claudes Patienten-UI fertigstellen

Ausgangspunkt war der auf GitHub gesicherte Claude-WIP `e9868fa`. Er enthält den Seed-Fix, die Notification-RPC-Migration, pending E-Mail-Anzeige, Doppelbestätigung und erste kosmetische Vereinfachungen. Commit `7ef8fae` vervollständigt diesen Stand ohne Funktionsverlust:

- statusgerechte Erfolgsrückmeldung; schwierige/nicht mögliche Selbstauskünfte werden nie als „Geschafft“ dargestellt;
- einklappbare optionale Übungsangaben, vergangene Termine und Absage;
- größere Patientennavigation, Aktionen und Texte;
- Konto-Actions nur für die eigene Patientensession, Passwort-Recovery über `/auth/confirm`, Validierungs-/Komponenten-/Mailpit-Spezifikationen.

Verifiziert: Typecheck, Lint, 105/105 Tests, Production Build und Playwright-Testliste mit 48 Fällen. Nicht ausgeführt: `db:reset`, Seed, RLS und echte Browserläufe, weil in der Cloud Supabase CLI und `.env.local` fehlen.

Nächster Schritt auf Toms Mac: den Konsolidierungs-Bundle-Commit auf Branch `claude-patient-ui-20260718` fast-forwarden, dann `pnpm db:reset && pnpm seed && pnpm test:rls && pnpm e2e`, Mailpit-/Mobil-/Desktopdurchlauf, Dokumentation nach Ergebnissen aktualisieren, `git push origin main` und `pnpm docs:sync`.

## Laufender Auftrag (13.07.2026): Phasen A–J

Übungs-/Videoverwaltung, individuelle Pläne, flexible Häufigkeiten, geführter Patientenmodus, optimierter Einladungseinstieg. Fortschritt in `TASKS.md` (Abschnitt „Auftrag vom 13.07.2026") und `NEXT_TASK.md`.

- **Phase J Testabdeckung implementiert (Cloud-Prüfstand, 2026-07-13, Commit `3216cef`):** `e2e/phase-j-exercise-management.spec.ts` prüft Bibliotheks-CRUD, falsche/valide MP4-Signatur, private Patientenauslieferung und Entfernen eines ersetzten Videos. `e2e/phase-j-invitations.spec.ts` prüft Code vor Konto, Registrierung/Mailpit/Annahme, bestehendes Konto und frischen Browser-Context. `scripts/rls-tests.ts` erzeugt temporäre Bibliotheksobjekte, einen Patienten, zwei Planversionen und alle Einladungszustände; es prüft Fremdpraxis, alte Logs, atomare Versionen, Praxiswechsel und räumt auf. Unit-Grenzen ergänzt; `docs/TEST_MATRIX.md` ordnet jede Masterprompt-Anforderung zu. Tatsächlich grün: Typecheck, Lint, 101 Tests, Playwright `--list` (42 Fälle), Build. Nicht ausgeführt: `db:reset` (`supabase: not found`), Seed/RLS (`.env.local: not found`), E2E (Next-dev-Start scheitert zusätzlich an `uv_interface_addresses ... Unknown system error 1`).

- **Phase I implementiert (Cloud-Prüfstand, 2026-07-13, Commit `af38d13`):** Migration `20260713200000_patient_reminder_preferences.sql` ergänzt eigene RLS-Präferenzen für Übungs-/Planhinweise und Ruhezeiten. `src/lib/reminders.ts` behandelt Ruheintervalle über Mitternacht; `src/server/services/reminders.ts` verbindet sie mit der offenen Occurrence-Zahl und ungelesenen, datensparsamen Plan-Notifications. Profil und „Heute“ bieten große patientengerechte Steuerung; `mark_notification_read` ersetzt das breite Tabellen-Update-Recht und setzt ausschließlich den eigenen Lesestatus. RLS-Suite um Eigen-/Fremdzugriffe und Inhaltsmanipulation ergänzt. Cloud-geprüft: Typecheck, Lint, 97 Tests, Build. DB/RLS/E2E/UI lokal offen. Kein Push/E-Mail; bewusst späterer Ausbau. Push und Obsidian-Sync bleiben wegen fehlender Cloud-Anmeldung beziehungsweise fehlendem lokalen Vault blockiert.

- **Phase H implementiert (Cloud-Prüfstand, 2026-07-13, Commit `71d4a93`):** `src/lib/adherence-analytics.ts` berechnet Soll je Schedule/Zeitraum sowie dokumentiert, completed, Status-, Schmerz- und ungelesene Zähler. `src/server/services/adherence.ts` liefert Patientendetail und Bulk-Dashboard ohne Patient-N+1. Beide Ansichten filtern 7/30 Tage, zeigen letzte Aktivität/inaktive Patienten und verlinken Patient, Plan und Übung. Migration `20260713180000_completion_feedback_review.sql` ergänzt getrennte Review-Metadaten und eine autorisierte/auditierte RPC; Action/Button markieren ungelesene Logs. RLS-Suite prüft Patient/Fremdpraxis/eigene Praxis. Cloud-geprüft: Typecheck, Lint, 88 Tests, Build. DB/RLS/E2E/UI lokal offen. Push und Obsidian-Sync bleiben wegen fehlender Cloud-Anmeldung beziehungsweise fehlendem lokalen Vault blockiert.

- **Phase G implementiert (Cloud-Prüfstand, 2026-07-13, Commit `441fc80`):** Neue Patientenseite `/session` und Start/Fortsetzen-CTA auf `/today`. Sie zeigt genau den nächsten offenen Durchgang mit privaten Medien, großen individuellen Vorgaben, Schedule/Uhrzeiten, Schritten und optionalem Timer. Das wiederverwendbare `ExerciseLogForm` unterstützt einen streng validierten Guided-Return; nach dem Speichern wird die Queue serverseitig neu geladen. Wenn nichts offen ist, erscheint eine neutrale Tageszusammenfassung. Neue Dateien: `src/app/(patient)/session/page.tsx`, `src/components/patient/{exercise-log-form,exercise-timer}.tsx`, `src/lib/exercise-timer.ts`. Cloud-geprüft: Typecheck, Lint, 83 Tests, Build. Browser-/WCAG-Test offen. Push und Obsidian-Sync bleiben wegen fehlender Cloud-Anmeldung beziehungsweise fehlendem lokalen Vault blockiert.

- **Phase F implementiert (Cloud-Prüfstand, 2026-07-13, Commit `3ffa797`):** Migration `20260713160000_completion_occurrences.sql` ergänzt `occurrence_index`, nummeriert alle alten Logs deterministisch und erzwingt eindeutige Tagesdurchgänge. `record_exercise_occurrence` prüft aktuellen Plan/Praxislink, Tages-/Wochen-Schedule und vergibt den nächsten Index atomar; der Snapshot entsteht in der DB, direkte Inserts wurden entzogen. `src/lib/occurrences.ts` berechnet Soll, dokumentiert und als erledigt gemeldet getrennt. Heute-/Detail-/Praxisansicht zeigen Einzeldurchgänge und Wochenstand. RLS-Suite um Direktinsert, Doppelanlage und Fremdzugriff ergänzt. Cloud-geprüft: Typecheck, Lint, 79 Tests, Build. DB-Reset/RLS/E2E/UI mangels lokaler Supabase offen. GitHub-Push scheitert weiterhin mangels Schreibanmeldung; Obsidian-Sync mangels `.env.local`/Vault.

- **Phase D/E implementiert (Cloud-Prüfstand, 2026-07-13, Commit `16a166a`):** `ExercisePlanBuilder` im Praxis-Patientendetail verwaltet Übungsauswahl, Reihenfolge, Dosierung, Zeitraum und typisierte Häufigkeiten (feste Wochentage mit 1–6 Durchgängen/Uhrzeiten oder 1–7 frei gewählte Tage pro Woche). Migration `20260713140000_publish_exercise_plans.sql` ergänzt Schedule-Constraint, einen partiellen Unique-Index und atomare RPCs für Veröffentlichen/Archivieren. Direkte Plan-Tabellenmutationen sind entfernt; Patientenzugriff verlangt den aktiven Link zur aktuellen Praxis. Neue Services/Actions/Validierungen und RLS-Proben. Cloud-geprüft: Typecheck, Lint, 74 Unit-Tests, Build. Nicht ausgeführt: DB-Reset, RLS, E2E und UI-Durchlauf (keine `.env.local`/lokale Supabase). GitHub-Push weiterhin mangels Schreibanmeldung blockiert; `pnpm docs:sync` weiterhin mangels `.env.local`/lokalem Vault blockiert. Branch `main` enthält alle lokalen Commits und darf nicht überschrieben werden.

- **Phase C implementiert (2026-07-13, Commit `61638bd`, lokaler Zwischenstand aus Claude übernommen):** `src/config/media.ts` und `src/server/services/exercise-media.ts` wurden fertig angeschlossen und gehärtet. Neue Server-Actions autorisieren jede Übung über die aktuelle Praxis-Mitgliedschaft. `ExerciseMediaManager` bietet Video, Poster, Alternativbild und WebVTT-Untertitel mit Vorschau, echtem XHR-Uploadfortschritt, Ersetzen und Entfernen. Finalisierung liest nur den ersten Stream-Chunk, prüft Größe und Magic Bytes, registriert per eindeutigem `(exercise_id, kind)`-Upsert und auditiert ohne Dateinamen. Patienten erhalten die vier Medienarten erst nach Prüfung ihres aktuellen Plans über 10 Minuten gültige URLs. Migration `20260713120000_unique_exercise_media_kind.sql`; RLS-Suite um nicht zugewiesene/fremde Übungsmedien und direkte Storage-Zugriffe ergänzt. Cloud-geprüft: Typecheck, Lint, 69 Unit-Tests, Build. Nicht ausgeführt: DB-Reset, RLS, E2E und UI-Upload (keine `.env.local`, Docker/Supabase CLI in der Cloud). Malware-Scan bleibt Pilot-Blocker.

### Synchronisationsstatus nach Phase C

- GitHub-Push von `main`: blockiert, weil in der Cloud keine GitHub-Schreibanmeldung vorhanden ist (`fatal: could not read Username for 'https://github.com': No such device or address`). Der öffentliche Remote ist lesbar; lokale Commits bleiben erhalten und dürfen nicht per Force-Push ersetzt werden.
- Obsidian: `pnpm docs:sync` ist in der Cloud mit `node: .env.local: not found` abgebrochen. Der Vault liegt nur auf Toms Mac; nach Übernahme des Commits dort erneut ausführen.

- **Phase B fertig (2026-07-13):** Übungsbibliothek komplett verwaltbar: `/practice/exercises` mit Suche + Filtern (Kategorie, Hilfsmittel, Archiv), Anlegen/Bearbeiten (`/new`, `/[exerciseId]`), Duplizieren (ohne Medien), Deaktivieren (nicht in neuen Plänen) und Archivieren (aus Bibliothek ausgeblendet; Übungen werden nie hart gelöscht – es existiert keine Delete-Policy, alte Pläne/Logs bleiben lesbar). Migration `20260713100000_exercise_library_fields.sql` (category, default_total_duration_seconds, archived_at). practice_id stammt immer aus der verifizierten Mitgliedschaft. Neue Dateien: `src/server/services/exercises.ts`, `src/server/actions/exercises.ts`, `src/lib/validation/exercises.ts` (+ 4 Unit-Tests), `src/components/practice/exercise-form.tsx`, `exercise-admin-actions.tsx`. Geprüft: Typecheck, Lint, 65 Unit-Tests, Build, 8-Schritte-UI-Durchlauf (anlegen, bearbeiten, suchen/filtern, duplizieren, deaktivieren, archivieren, Roundtrip, aufräumen).
- **Phase A fertig (2026-07-13):** Startseite führt primär zum Code-Einstieg; `/invite/continue` zeigt Ablaufdatum + Hinweis (Konto selbst erstellen, Code bleibt bis zur endgültigen Verbindung gültig); QR-Code zum Einladungslink lokal erzeugt (`src/components/practice/invite-qr-code.tsx`, neues Paket `qrcode`, keine externen Aufrufe). Einladungssicherheit unverändert. Geprüft: Typecheck, Lint, 61 Unit-Tests, Build, 7-Schritte-UI-Durchlauf (frischer Code, QR sichtbar, Deep-Link, neutrale Fehlermeldung, Aufräumen).

## Produkt und Stack

PhysioCheck verbindet Physiotherapiepraxen mit Patienten: Praxiscode, Heimübungen als Selbstauskunft, Termine, Verordnungen und interne Patientenakten. Stack: Next.js 16, React 19, TypeScript strict, Tailwind, shadcn/ui, Supabase Auth/PostgreSQL/Storage/RLS, pnpm, Vitest und Playwright.

## Wichtig: Konsolidierung am 2026-07-11

Die Phase-E/F-Implementierung lag zuvor als kompletter Parallelordner `physio-check-phase-ef-updated/` im Repo (Commit `40a1b02`). Sie wurde in den Projektstamm übernommen, der Ordner gelöscht (D-030). Dabei wurde die bis dahin **nie ausgeführte** Migration `20260711230000_authorizations_and_patient_documents.sql` repariert: `authorization` ist ein reserviertes PostgreSQL-Schlüsselwort und wurde als Tabellen-Alias durch `auth_rec` ersetzt. Außerdem war das GitHub-Repo versehentlich öffentlich und wurde damals auf privat gestellt (D-031); inzwischen ist es für die Zusammenarbeit bewusst wieder öffentlich (D-036).

## Fertig (und am 2026-07-11 lokal verifiziert)

- Phase C: freie Registrierung, unverbundenes Konto auf `/connect` beschränkt, sichere einmalige Codes und Praxiswechsel. *(E2E grün)*
- Phase C: Übungsdetail und Dokumentation mit Status, Sätzen, Schmerz, Notiz und Snapshot; Praxisansicht 7/30 Tage. *(E2E grün)*
- Phase D: `/practice/calendar` mit Monat/Woche/Tag/Liste und Filtern; Termin anlegen/bearbeiten/stornieren/abschließen; GiST-Konfliktschutz; Absageanfrage + Notifications. *(Migration und Abschluss-Aktion lokal geprüft; kein E2E für Anlegen/Bearbeiten/Stornieren)*
- Phase E: Verordnungen (integer-Sitzungen), Adjustment-Historie mit Pflichtgrund, terminbezogene Usage (`appointment_id unique` = keine Doppelanrechnung), Patientenanzeige mit neutralem Kostenhinweis. *(UI-Durchlauf: anlegen 9 → −2 mit Grund → Terminabschluss rechnet genau 1 an → Patient sieht Stand)*
- Phase F: interne PDF/JPEG/PNG-Dokumente pro Patient, privater Bucket `patient-records`, Signatur-/Größenprüfung, kurzlebige signierte URL, Audit. *(UI-Durchlauf: PNG-Upload, Öffnen über signierte URL 200; Patient auf Dokumentroute/Praxisseite → Redirect, kein Zugriff)*
- Etappe 2: `profiles.phone` (Patient pflegt selbst; Praxis korrigiert via SECURITY-DEFINER `set_patient_phone`; Anzeige in Liste/Detail als tel-Link) und `practice_members.calendar_color` (8er-Palette, Spaltenrecht nur für die Farbspalte, Auswahl in den Einstellungen, Kalender mit Farbpunkt/-rand + Legende). Migration `20260711260000_phone_and_calendar_colors.sql`. *(UI-Durchlauf + API-Proben: Patient kann RPC nicht aufrufen, Mitglied kann Rolle nicht ändern, Patient kann fremde Profile nicht ändern)*
- Etappe 3: Behandlungskontingente strikt ganzzahlig mit append-only Ledger. `appointment_authorization_usages` bekommt `reversed_at`/`reversed_by` (nie löschen, nur markieren), `sessions_used = 1` erzwungen, partieller Unique-Index `appointment_usages_active_appointment_key` (höchstens eine aktive Anrechnung pro Termin, nach Rücknahme erneut anrechenbar). Neue DB-Funktionen: `reverse_appointment_completion` (Termin → „geplant", bucht genau 1 Einheit zurück; 23P01 bei inzwischen belegtem Zeitraum wird in der Action abgefangen) und `primary_authorization_for_patient` (gemeinsame Auswahlregel für Patientenanzeige und Anrechnung – Phase-E-Inkonsistenz behoben). `authorization_remaining` ignoriert stornierte Anrechnungen, nie negativ; manuelle Verringerung unter 0 lehnt der Server ab. UI: Ledger-Historie auf der Patientendetailseite (`src/lib/authorization-ledger.ts` + Tests), Formular „Abschluss zurücknehmen", gelbe Warnung beim Abschluss mit 0 Einheiten (`FormMessage` hat jetzt `warning`). Migration `20260711280000`. *(17-Schritte-UI-Durchlauf inkl. Negativ-Proben)*
- Etappe 4: Verordnungswarnungen. Schwellen zentral in `src/lib/authorization-warnings.ts` (≤ 2 Einheiten bzw. ≤ 14 Tage bis `valid_until`; Toms Freigabe „sinnvolle Standardwerte"), DB-Funktion `list_authorization_warnings` (nutzt `primary_authorization_for_patient`), Warnbanner Patientendetail, Dashboard-Karte, Filter+Badge Patientenliste, datensparsame Notification an aktive Mitglieder genau beim Erreichen von 2 bzw. 0 Einheiten. Migration `20260712100000`. *(11-Schritte-UI-Durchlauf + RPC-Negativ-Probe)*
- Etappe 5: Dokumente vervollständigt (Kategorie-Filter, Archiv-Umschalter, endgültiges Löschen NUR archivierter Dokumente mit Bestätigung; RLS-Delete-Policy + Action löschen Zeile und Storage-Objekt, Audit-Event) und internes Kurzprofil `patient_internal_profiles` (kein Patienten-Policy → nie für Patienten lesbar, max. 2000 Zeichen, Upsert je Praxis+Patient). Migration `20260712120000`. *(UI-Durchlauf + 5 RLS-Proben)*
- Etappe 6: Markierte Patienten `pinned_patients` (kein Patienten-Policy; Markieren/Entfernen mit optionaler Notiz, Badge Liste+Detail, markierte zuerst + Filter, Dashboard-Karte). Migration `20260712140000`. *(UI-Durchlauf + RLS-Proben)*
- Etappe 7: Warteliste `/practice/waitlist` (Seitenleiste): `practice_waitlist_entries` mit Wunschzeiten/Priorität/Notiz, max. 1 offener Eintrag pro Patient (partieller Unique-Index → verständliche Meldung), erledigen (Historie) und löschen. Migration `20260712160000`. *(UI-Durchlauf + RLS-Proben)*
- Etappe 8: Frei gewordene Zeitfenster + Angebotsworkflow: Wartelisten-Seite zeigt zukünftige stornierte Slots; Praxis erstellt/zieht Angebote zurück (`appointment_offers`, nie löschen – Status offered/accepted/declined/withdrawn); Patient antwortet unter „Termine": `accept_appointment_offer` bucht atomar unter dem GiST-Überlappungsschutz (23P01 → verständliche Meldung), schließt offenen Wartelisten-Eintrag, benachrichtigt Mitglieder; `decline_appointment_offer` ebenso. Migration `20260712180000`. *(15-Schritte-UI-Durchlauf inkl. Konfliktfall)*
- Etappe 10: Dedizierte RLS-Suite `pnpm test:rls` (`scripts/rls-tests.ts`, 36 Proben: Patientin nur eigene Daten, Fremdpraxis nichts, keine Selbst-Eskalation, unverbundenes Konto nichts, Storage-Download/Signed-URL verweigert). Legt temporäre Fremdpraxis via Service-Key an (Sicherheitsstopp: nur lokal) und räumt auf.

## Prüfstand (alles am 2026-07-12 auf Toms Mac ausgeführt)

- `pnpm db:reset`: grün (alle 12 Migrationen)
- `pnpm seed`: grün
- `pnpm typecheck`, `pnpm lint`: grün
- `pnpm test`: 61 Tests grün
- `pnpm e2e`: 28 bestanden, 6 planmäßig übersprungen (Kernablauf läuft nur auf Chromium)
- `pnpm test:rls`: 36 Proben grün
- `pnpm build`: grün
- UI-Durchläufe je Etappe (Playwright-Treiberskripte mit Screenshots) inkl. Negativ-/Konflikt-Proben

## Bekannte Probleme / offene Punkte in Priorität

1. Praxisentscheidung für Absageanfragen (annehmen/ablehnen) fehlt; `decideCancellationSchema` existiert bereits ungenutzt in `src/lib/validation/appointments.ts`.
3. Virenscan/Quarantäne für Uploads vor Pilotbetrieb; aktuell nur Dateityp, Signatur und Größe.
4. ~~Phase C–J lokal prüfen~~ – am 19.07.2026 vollständig erledigt (db:reset, Seed, RLS, E2E, Browser); Ergebnisse in `docs/TEST_MATRIX.md`.
5. UX-Beobachtung: Erfolgs-/Fehlermeldungen von Server-Actions gehen verloren, wenn `revalidatePath` die Formular-Komponente neu aufbaut (Abschließen/Zurücknehmen, Angebot annehmen). Der Zustandswechsel selbst ist die Rückmeldung; ein Toast-System wäre die saubere Lösung.
6. E2E: seltener Hänger eines einzelnen Server-Action-Roundtrips nur unter voller Parallellast (untersucht 2026-07-12: keine blockierten DB-Queries, isoliert nie reproduzierbar). Handling: `expect`-Timeout 10 s, 1 Retry mit `trace: on-first-retry` – bei erneutem Auftreten liegt ein Trace in `test-results/`.

## Relevante Dateien

- Kalender: `src/app/(practice)/practice/calendar/` · Logik `src/lib/calendar.ts`
- Termine: `src/server/services/appointments.ts`, `src/server/actions/appointments.ts`, `src/lib/validation/appointments.ts`
- Einheiten/Warnungen: `src/server/{actions,services}/authorizations.ts`, `src/lib/authorization-ledger.ts`, `src/lib/authorization-warnings.ts`, `src/lib/authorization-warning-text.ts`, `src/components/practice/{authorization-panel,reverse-completion-form}.tsx`
- Dokumente/Kurzprofil: `src/server/{actions,services}/documents.ts`, `src/server/services/internal-profile.ts`, `src/components/practice/{document-panel,internal-profile-form}.tsx`
- Markierungen/Warteliste/Angebote: `src/server/{actions,services}/{pinned-patients,waitlist,offers}.ts`, `src/components/practice/{pin-patient-form,waitlist-panel,offer-panel}.tsx`, `src/components/patient/offer-response.tsx`, Seite `src/app/(practice)/practice/waitlist/page.tsx`
- RLS-Tests: `scripts/rls-tests.ts` (`pnpm test:rls`)
- Phase-J-Browsertests: `e2e/phase-j-{exercise-management,invitations}.spec.ts`
- Testmatrix: `docs/TEST_MATRIX.md`
- Plan-Builder: `src/components/practice/exercise-plan-builder.tsx`, `src/server/{actions,services}/plans.ts`, `src/lib/{plan-schedule,validation/plans}.ts`
- Durchgänge: `src/lib/occurrences.ts`, `src/server/services/exercise-log.ts`, `src/server/services/patient.ts`
- Geführter Modus: `src/app/(patient)/session/page.tsx`, `src/components/patient/{exercise-log-form,exercise-timer}.tsx`
- Auswertung: `src/lib/adherence-analytics.ts`, `src/server/services/adherence.ts`, `src/server/actions/adherence.ts`
- Erinnerungen: `src/lib/reminders.ts`, `src/server/{services,actions}/reminders.ts`, `src/components/patient/{reminder-preferences-form,plan-notification-card}.tsx`
- Neueste Migration: `supabase/migrations/20260713200000_patient_reminder_preferences.sql`
- UI-Texte: `src/messages/de.ts`

## Lokaler Start

```bash
cd ~/physio-check
supabase start
pnpm db:reset
pnpm seed
pnpm dev
```

Demo-Logins stehen im README. Keine echten Patientendaten verwenden.

## GitHub

Remote `origin` ist `https://github.com/TomGroeber/physio-check.git` (öffentlich, D-036 – deshalb erst recht: nie Secrets oder echte Daten). Vor jedem Push Status und Diff auf Secrets prüfen; `.env.local`, lokale Supabase-Daten und Patientendaten niemals pushen.

## Gesamtstatus und nächste Schritte (20.07.2026, Stand nach Merge `342fba5`)

**1. Implementiert und getestet:** komplette Praxis-Website (Phasen A–J, Etappen 1–10, Kalenderfarben D-057), komplette Patienten-Weboberfläche inkl. Dunkelmodus, native Patienten-App mit visueller/struktureller Parität zur Web-Referenz (Auth/Code/Deep Links inkl. Kontoabschnitt+Abmelden, Heute, geführte Sitzung, Übung mit Video, Termine/Angebote, Einheiten, Profil/Bild/Erinnerungen/Darstellung, Kontolöschungsantrag), `/api/mobile`-Endpunkte, 24 Migrationen. Prüfstand: Web Typecheck/Lint/115 Tests/96 RLS-Proben/E2E 49:0/Build grün; Mobile Typecheck/Lint 0 Fehler/16 Jest-Tests/expo-doctor 20:20/iOS-JS-Bundle grün; Integrationsprobe 15:15 gegen lokale Supabase + Next; **echter Simulatorlauf** (iPhone 17 Pro, iOS 26.5) mit Login, Screenshot-Vergleich Heute/Termine/Profil hell+dunkel gegen die Web-Referenz; Obsidian-Sync grün.

**2. Nur als Konzept vorbereitet:** Push-Benachrichtigungen (Architektur + datensparsame Inhalte definiert, kein Versand), Universal/App Links (Schema läuft, Domain-Verifikation dokumentiert), EAS-Build-Profile (Konfiguration liegt, nie gebaut).

**3. Durch externe Konten/Hardware/Berechtigungen blockiert:** Android-Emulator (kein SDK/Android Studio), EAS-/Apple-/Google-Konten, APNs-/FCM-Credentials, Universal-Link-Domain, Datenschutzerklärungs-URL, Rechtsfrage Aufbewahrung Luxemburg (D-062), **macOS-Bedienungshilfen-Berechtigung für Tap-Automatisierung im iOS-Simulator** (neu erkannt 20.07.2026 – nur Formulareingaben/Taps betroffen, kein Blocker für Codequalität oder Kernfunktionen). iOS-Simulator selbst ist seit dieser Sitzung **kein Blocker mehr** (Xcode installiert, verifiziert).

**4. Offene Produktfunktionen:** Praxisentscheidung über Absageanfragen, Benachrichtigungszentrum, Virenscan vor Pilot, Terminvorschlags-Workflow nach Absage, `docs/CUSTOMIZATION_GUIDE.md`, konfigurierbare Medienformate, Toast-System für Praxisformulare (D-053-Beobachtung).

**Nächster Schritt in Reihenfolge:** (1) optional Bedienungshilfen-Berechtigung erteilen für vollständigen Tap-Durchlauf inkl. Formularen → (2) Android-Emulator-Lauf → (3) Store-Checkliste mit Toms Freigaben abarbeiten.
