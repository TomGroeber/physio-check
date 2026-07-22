# PhysioCheck – Release-Readiness-Matrix

> Stand: 2026-07-21 · Branch `claude/store-release-readiness-20260721` (Basis: `main@9415660`) · Erstaudit vor der Store-Freigabephase.
>
> Zustände: **ERLEDIGT UND VERIFIZIERT** · **IMPLEMENTIERBAR – JETZT AUSFÜHREN** · **BLOCKIERT DURCH TOM/KONTO/2FA/ZAHLUNG** · **BLOCKIERT DURCH RECHTLICHE FREIGABE** · **OPTIONAL NACH V1**
>
> Diese Matrix wird nach jedem Meilenstein aktualisiert (Abschnitt 13 des Master-Prompts). Kein Punkt wird als erledigt markiert ohne Beleg (Datei/Test/Befehl).

## Ausgangsverifikation (21.07.2026)

```
HEAD:          9415660e4ac3f99714573430623ee186af3d1d28
Branch:        main → claude/store-release-readiness-20260721
origin/main:   identisch mit HEAD (git fetch --all --prune sauber)
Working Tree:  sauber
```

Alle acht in Section 4 des Master-Prompts genannten „bekannten Verdachtsstellen" wurden geprüft und **bestätigt** (keine war falsch):

| # | Verdacht | Befund |
|---|---|---|
| 1 | `docs/AI_HANDOFF.md` verweist noch auf `342fba5` statt `9415660` | Bestätigt – korrigiert in diesem Audit-Commit |
| 2 | `app.json`: `version 0.1.0`, Bundle-ID `test.physiocheck.patient` | Bestätigt, unverändert seit Erstanlage |
| 3 | App-Icon/Splash sind Expo-Platzhalter | Bestätigt – `icon.png` ist exakt das Standard-Expo-Template-Icon (blauer „A"-Haken), keine PhysioCheck-Marke |
| 4 | `eas.json` ohne echte Produktions-/Submit-Konfiguration | Bestätigt – `submit.production` ist ein leeres Objekt, keine Apple/Google-Angaben |
| 5 | Kein gehosteter Staging-/Produktions-Backendstand | Bestätigt – nur `supabase status` (lokal, `127.0.0.1:54321`) referenziert im gesamten Repo |
| 6 | GitHub Actions fehlen vollständig | Bestätigt – `.github/workflows/` existiert nicht |
| 7 | Kontolöschung sperrt nur den Zugang statt zu löschen | Bestätigt – `src/app/api/mobile/account-deletion/route.ts` schreibt eine Zeile in `account_deletion_requests`, ein Audit-Event und bannt das Konto (`ban_duration: 876000h`). Es werden **keine** Daten gelöscht oder anonymisiert (Profilbild, Telefonnummer, Erinnerungseinstellungen, Benachrichtigungen bleiben unangetastet) |
| 8 | Android-Simulator/vollständiger iOS-Tap-Durchlauf ungeprüft; signierte EAS-Builds nie erstellt | Bestätigt – kein Android SDK installiert, kein EAS-Build je ausgeführt (nur `expo export`, das JS-Bundle, kein natives Binary) |

Zusätzliche, im Master-Prompt nicht explizit genannte, aber beim Audit gefundene Lücken:

- **Keine Security-Header** (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy) in `next.config.ts` – `docs/PRIVACY_SECURITY.md` selbst vermerkt „CSP … teilweise".
- **Kein `engines`/`packageManager`-Feld** in `package.json` – Node/pnpm-Version ist nirgendwo maschinenlesbar gepinnt (nur in Doku-Text).
- ~~**Keine Malware-/Virenscan-Pipeline**~~ – behoben 2026-07-21, siehe A4.
- ~~**`docs/PRIVACY_SECURITY.md`** ... es fehlt ... App-Privacy-/Data-Safety-/Health-Declaration-Mappings~~ – Mapping-Tabelle ergänzt 2026-07-21, siehe A4/A6. Eine konsolidierte, store-taugliche **Datenschutzerklärungs-Vorlage** (Fließtext für Endnutzer, nicht das Mapping) fehlt weiterhin.

## A. Übersicht nach Bereich

### A1. Repository-Hygiene, CI, reproduzierbare Qualität (Phase 1)

| Punkt | Status | Beleg | Nächster Schritt |
|---|---|---|---|
| Node/pnpm-Version nachvollziehbar gepinnt | ERLEDIGT UND VERIFIZIERT | `package.json`: `engines.node >=22.13.0 <23`, `packageManager: pnpm@11.11.0` | – |
| `pnpm install --frozen-lockfile` funktioniert reproduzierbar | ERLEDIGT UND VERIFIZIERT | In allen 4 CI-Jobs grün, GitHub-Actions-Lauf [`29850086661`](https://github.com/TomGroeber/physio-check/actions/runs/29850086661) | – |
| Web: Typecheck/Lint/Test/Build | ERLEDIGT UND VERIFIZIERT | Lokal UND in CI grün (`docs/TEST_MATRIX.md`) | – |
| RLS-Suite | ERLEDIGT UND VERIFIZIERT | 104 Proben grün, lokal UND in CI (echte Supabase-Instanz im Runner) | – |
| E2E (Playwright) | ERLEDIGT UND VERIFIZIERT | 49/0 lokal UND in CI (Chromium + WebKit für das „mobile"-Projekt) | – |
| Mobile Typecheck/Lint/Test/expo-doctor | ERLEDIGT UND VERIFIZIERT | 16 Tests, 20/20 Checks, lokal UND in CI | – |
| Mobile Produktionsbundle-Export (JS) | ERLEDIGT UND VERIFIZIERT | `expo export --platform ios` + `android` grün in CI | ersetzt keinen signierten nativen Build (s. A5) |
| GitHub-Actions-Workflow | ERLEDIGT UND VERIFIZIERT | `.github/workflows/ci.yml`, 4 Jobs, echter grüner Lauf über `gh run view` bestätigt (nicht nur angenommen) | Branch-Protection „required checks" ist ein GitHub-Repo-Einstellungsschritt – Tom kann die 4 Jobs dort als Pflicht markieren |
| Secret-Scan (Git-Historie + Build-Output) | ERLEDIGT UND VERIFIZIERT | gitleaks-Job grün (voller Verlauf, `fetch-depth: 0`) | – |
| Dependency-/Lockfile-Audit | ERLEDIGT UND VERIFIZIERT | `pnpm audit --audit-level critical`: 2 moderate (postcss via next, uuid via expo-Tooling), beide reine Build-Zeit-Abhängigkeiten, 0 kritisch | Bei Gelegenheit auf neuere Next/Expo-Patch-Versionen aktualisieren |
| Security-Header (CSP/HSTS/…) | ERLEDIGT UND VERIFIZIERT | Nonce-basierte CSP + 5 weitere Header in `src/proxy.ts`; 0 CSP-Verletzungen in echtem Chromium-Lauf (Patient + Praxis, Login + Formulare) | – |
| Rate Limiting produktionsreif | TEILWEISE / OPTIONAL NACH V1 | Einladungscode-Rate-Limit existiert (`invite_redemption_attempts`); Login-Rate-Limit liegt bei Supabase Auth selbst | Prüfen, ob Supabase-Auth-Standardlimits für Produktion genügen |

### A2. Native Geräteprüfung (Phase 2)

| Punkt | Status | Beleg | Nächster Schritt |
|---|---|---|---|
| iOS-Simulator-Tap-Durchlauf (voller Patientenablauf) | TEILWEISE / BLOCKIERT (Umgebung) | macOS-Bedienungshilfen-Berechtigung weiterhin nicht erteilt (erneut geprüft) – Formular-Taps bleiben ungeprüft. Navigation/Authentifizierung stattdessen über einen temporären, nie committeten Dev-Login-Screen + Deep-Links verifiziert (echte Anmeldung, echte Backend-Daten, „Heute"-Screen mit 3 echten Übungen) | Tom: Systemeinstellungen → Datenschutz & Sicherheit → Bedienungshilfen, falls ein vollständiger Tap-Durchlauf gewünscht ist |
| Kleines + großes iPhone, Dark Mode, Dynamic Type, VoiceOver, Reduce Motion | ERLEDIGT UND VERIFIZIERT (ohne VoiceOver/Reduce Motion) | iPhone Air + iPad Air 11" (M4) zusätzlich zum iPhone 17 Pro geprüft: Willkommensbildschirm, Dark Mode (`simctl ui appearance dark`), größte Dynamic-Type-Stufe `accessibility-extra-extra-extra-large` (Text skaliert korrekt, kein Clipping/Überlappen), `supportsTablet: false` bestätigt korrektes phone-großes Layout auf dem iPad statt gestrecktem/kaputtem Layout | VoiceOver/Reduce Motion haben keine `simctl`-Fernsteuerung – bleiben ohne Bedienungshilfen-Berechtigung ungeprüft |
| Android-Emulator-Lauf | ERLEDIGT UND VERIFIZIERT | Command-Line-Tools + Temurin/OpenJDK 17 kostenlos installiert (kein Konto, kein Kauf); AVD „Pixel 7"-Profil mit Android 16 (API 36, arm64-v8a) erstellt und gebootet; `expo run:android` echt gebaut (Gradle, ~14 Min.) und auf dem Emulator installiert; über denselben Dev-Login-Weg echt angemeldet, „Heute"-Screen mit echten Backend-Daten in Hell **und** Dunkel geprüft | Emulator ist während der Sitzung einmal wegen Ressourcendrucks (paralleler iOS+Android-Build) abgestürzt und wurde neu gestartet – für Dauerbetrieb nicht gleichzeitig mit weiteren großen Builds laufen lassen |
| targetSdk/compileSdk für Android-16/API-36-Ziel (ab 31.08.2026) | ERLEDIGT UND VERIFIZIERT | Realer Gradle-Build bestätigt: `compileSdk 36`, `targetSdk 36`, `minSdk 24` – bereits auf dem geforderten Level, kein Upgrade nötig | – |
| Physisches Gerät (iOS/Android) | BLOCKIERT DURCH TOM/KONTO | Keine physischen Testgeräte in dieser Umgebung verfügbar | Bleibt als Blocker sichtbar, niemals als „echtes Gerät" umdeklarieren |

### A3. Produktions-Backend und Web-Deployment (Phase 3)

| Punkt | Status | Beleg | Nächster Schritt |
|---|---|---|---|
| Gehostetes Supabase-Projekt (Staging/Prod, EU-Region) | BLOCKIERT DURCH TOM/KONTO | Kein Supabase-Cloud-Konto/-Projekt im Repo referenziert; nur lokale Instanz | Tom: Supabase-Konto + Projekt(e) anlegen (Zahlung ab Pro-Plan je nach Bedarf) |
| Web-Hosting/Domain für Produktion | BLOCKIERT DURCH TOM/KONTO | Keine Domain dokumentiert | Tom: Hosting-Anbieter + Domain wählen und registrieren |
| Migrationsbasierter, reproduzierbarer Rollout | ERLEDIGT UND VERIFIZIERT (lokal) | 24 Migrationen, `supabase db reset` deterministisch | Auf Staging/Prod anwendbar, sobald Projekt existiert |
| Sichere Secret-Verwaltung (getrennt Public/Service) | ERLEDIGT UND VERIFIZIERT (Konzept) | `.env.example`, klare Trennung Publishable/Service-Role im Code | Produktions-Secret-Store (z. B. Vercel/Fly/EAS Secrets) einrichten, sobald Hosting feststeht |
| Produktiver SMTP-Versand | BLOCKIERT DURCH TOM/KONTO | Aktuell nur Mailpit lokal | Tom: SMTP-Anbieter wählen (z. B. Postmark/Resend), Zugangsdaten hinterlegen |
| TLS/Redirect-Allowlist | BLOCKIERT DURCH TOM/KONTO (Domain-abhängig) | `supabase/config.toml` hat nur `localhost`-Redirects | Nach Domain-Entscheidung produktiv konfigurieren |
| Backups/Restore-Probe | BLOCKIERT DURCH TOM/KONTO | Setzt gehostetes Projekt voraus | Nach Projektanlage: Backup-Einstellungen prüfen, Restore einmal testen |
| Monitoring/Error-Tracking/Alarmierung | ERLEDIGT (Konzept), BLOCKIERT (Betrieb) | `GET /api/health` (`src/app/api/health/route.ts`) implementiert und lokal verifiziert (echte DB-Erreichbarkeitsprüfung, keine Zeileninhalte); anbieterneutrales Konzept in `docs/DEPLOYMENT.md` Abschnitt 4 | Scharf schalten (Uptime-Monitor koppeln) erst mit echtem Hosting |
| Deployment-Skripte/Variablenliste als Vorbereitung | ERLEDIGT | `docs/DEPLOYMENT.md`: vollständige Env-Var-Liste, Rollout-Schritte, was Tom entscheiden muss vs. was schon vorbereitet ist | Tom trägt nach Kontoerstellung nur noch Werte ein |

### A4. Datenschutz, Gesundheitsdaten, Kontolöschung (Phase 4)

| Punkt | Status | Beleg | Nächster Schritt |
|---|---|---|---|
| Technische Dateninventur inkl. Store-Mapping | ERLEDIGT UND VERIFIZIERT | `docs/PRIVACY_SECURITY.md` Abschnitt 1/1a: erweiterte Datentabelle + Apple-App-Privacy-/Google-Data-Safety-Mapping pro Datentyp (erhoben/verknüpft/Tracking), gegen tatsächlichen Code geprüft (keine Analytics-/Tracking-/Crash-SDKs in `package.json`) | Formulare erst nach Kontoerstellung tatsächlich ausfüllbar (BLOCKIERT DURCH TOM/KONTO) |
| Echte Kontolöschung (nicht nur Sperre) | ERLEDIGT UND VERIFIZIERT | Migration `20260721100000_real_account_deletion.sql`, RPC `request_account_deletion`; 8 neue RLS-Proben (104 gesamt) + vollständiger Browser-Durchlauf mit Wegwerf-Konto (Login → Löschung → Redirect → gesperrter Zweitlogin, Praxisdaten bleiben erhalten) | – |
| Web-Weg zur Kontolöschung (fehlte komplett, nur mobil vorhanden) | ERLEDIGT UND VERIFIZIERT | `src/server/actions/account-deletion.ts` + `delete-account-form.tsx` in `/profile`; Reauthentifizierung per Passwort vor jeder Löschung | – |
| Konfigurierbare Aufbewahrungsregeln (ohne eigene Rechtsentscheidung) | ERLEDIGT UND VERIFIZIERT | `retained_data_note`-Spalte + Text dokumentieren pro Antrag, welche Daten aus welchem (offenen) Rechtsgrund bleiben | Endgültige Frist bleibt BLOCKIERT DURCH RECHTLICHE FREIGABE |
| Malware-Scan für Uploads | ERLEDIGT UND VERIFIZIERT | `src/server/services/malware-scan.ts` (ClamAV `clamscan`, fail-closed) in `finalizeAvatarUpload`/`finalizeUpload` hinter `MALWARE_SCAN_ENABLED`. Ein Isolations-Versuch (parallele Scan-Last mit einem separaten, seriellen Lauf begegnen) führte über mehrere CI-Läufe zu drei echten, jeweils per Log root-caused Bugs (D-079, D-080, D-081 – zuletzt: der Server startete im CI-Schritt ohne `MALWARE_SCAN_ENABLED=true`, nur der Playwright-Befehl hatte es). Zusätzlich ein einmaliger Retry für den Zwischen-Seed ergänzt (transiente Auth-Bereitschaft nach Container-Neustart, einmal beobachtet). Real in CI grün bestätigt, zweimal in Folge (`gh run view 29941832703`, `gh run view 29943326711`, jeweils alle 4 Jobs erfolgreich) | Produktions-Dauerlösung (`clamd`-Daemon oder Cloud-AV) bleibt an Toms Hosting-Wahl gebunden (siehe A3) |
| Öffentliche Datenschutz-/Support-/Löschseite | ERLEDIGT UND VERIFIZIERT (Löschseite) | `src/app/account-deletion/page.tsx`, ohne Login erreichbar (HTTP 200 verifiziert); nennt Support-E-Mail-Platzhalter | Datenschutzerklärung als eigene Seite bleibt offen (s. A6); Support-E-Mail ist Platzhalter (`branding.supportEmail`) bis Toms Entscheidung (A5) |
| Rechtliche Freigabe Aufbewahrungsfristen Luxemburg | BLOCKIERT DURCH RECHTLICHE FREIGABE | Offen seit D-062 | Bleibt offen; nur konfigurierbare Regel + Platzhalter, keine eigene Entscheidung |
| Apple/Google Health-Declaration, Data-Safety-Mapping | ERLEDIGT UND VERIFIZIERT | Siehe `docs/PRIVACY_SECURITY.md` Abschnitt 1a (inkl. expliziter Klarstellung: kein HealthKit) | Inhaltlich fertig; Übertragung in App Store Connect/Play Console braucht Toms Konto |

### A5. App-Identität und native Konfiguration (Phase 5)

| Punkt | Status | Beleg | Nächster Schritt |
|---|---|---|---|
| Finaler App-Name/Bundle-ID/Package/Domain/Publisher/Support-E-Mail | BLOCKIERT DURCH TOM (unwiderrufliche Registrierung) | Nur Platzhalter `test.physiocheck.patient`, `0.1.0` | Tom: EINE kompakte Entscheidung (siehe Abschlussbericht) |
| Echtes App-Icon/Splash/Adaptive-Icon aus PhysioCheck-Marke | ERLEDIGT UND VERIFIZIERT | Aus `logo.svg` per `rsvg-convert` neu gerendert (`icon.png`, `favicon.png`, `splash-icon.png`, Android-Adaptive-Icon-Ebenen); `app.json`-Hintergrundfarben auf Marken-Navy vereinheitlicht; `expo-doctor` 20/20, iOS+Android-Export grün (D-073) | – |
| iOS Usage Descriptions nur für genutzte Berechtigungen | ERLEDIGT UND VERIFIZIERT | `expo-image-picker`-Plugin mit deutschem `photosPermission`-Text ergänzt, `cameraPermission`/`microphonePermission` explizit `false` (nur Fotobibliothek wird genutzt); per `expo config --type introspect` bestätigt (D-074) | – |
| iOS Privacy Manifest / Required-Reason-API | ERLEDIGT UND VERIFIZIERT | `app.json` → `ios.privacyManifests` (natives Expo-Feld, kein eigenes Plugin nötig): erklärt dieselben Datentypen wie das App-Privacy-Mapping (E-Mail, Name, Telefon, Fotos, Gesundheit, Nutzer-ID), alle „nur Funktionalität", kein Tracking. Required-Reason-APIs (UserDefaults/SystemBootTime/FileTimestamp) aggregiert Expo automatisch aus den Abhängigkeiten. Per echtem `expo prebuild --clean` geprüft: erzeugte `PrivacyInfo.xcprivacy` enthält korrekt beide zusammengeführt | – |
| Android-Berechtigungen minimiert | ERLEDIGT UND VERIFIZIERT (Stichprobe) | Keine zusätzlichen Berechtigungen in `app.json` deklariert | Bei native Build-Config erneut prüfen |
| Rollenbegrenzung (App nie Praxisoberfläche) | ERLEDIGT UND VERIFIZIERT | `practice-blocked.tsx` + Tests | – |
| EAS Build-Profile produktionsreif (ohne Submit-Credentials) | TEILWEISE | `eas.json` hat 3 Profile, aber `submit.production` leer | Ergänzen, sobald Identität feststeht |

### A6. Store-Metadaten und Review-Paket (Phase 6)

| Punkt | Status | Beleg | Nächster Schritt |
|---|---|---|---|
| Store-Texte (Titel/Beschreibung/Keywords/Kategorie) | ERLEDIGT – TOM-GEGENLESEN AUSSTEHEND | Vollständiger deutscher Entwurf in `docs/APP_STORE_CHECKLIST.md` (Beschreibung, Keywords, Kategorie „Gesundheit und Fitness" statt „Medizin", Alterseinstufung, Reviewhinweis) | Von Tom vor Einreichung gegenlesen lassen |
| Altersfreigabe-Fragebogen, App-Privacy/Data-Safety/Health-Antworten | ERLEDIGT UND VERIFIZIERT (inhaltlich) | Mapping in `docs/PRIVACY_SECURITY.md` Abschnitt 1a (A4) | Übertragung in die Store-Formulare braucht Toms Konto |
| Support-/Privacy-/Deletion-URLs | BLOCKIERT DURCH TOM (Domain) | Keine Domain | Nach Domain-Entscheidung deployen |
| Screenshots (alle Pflichtgrößen) | BLOCKIERT (setzt signierten Build + Gerät/Simulator-Matrix voraus) | Nur einzelne Verifikations-Screenshots im Scratchpad, nicht store-konform erzeugt | Nach A2 + A7 systematisch erzeugen |
| Review-Demokonto | IMPLEMENTIERBAR – JETZT AUSFÜHREN | Demo-Konten existieren nur lokal (Seed) | Für Staging vorbereiten, sobald A3 steht |
| Lokalisierung | ERLEDIGT UND VERIFIZIERT (nur Deutsch) | App ist ausschließlich deutsch, keine EN/FR-Behauptung im Repo | So dokumentieren, keine weiteren Sprachen erfinden |

### A7. Signierte Builds und interne Distribution (Phase 7)

| Punkt | Status | Beleg | Nächster Schritt |
|---|---|---|---|
| EAS-Konto/Login | BLOCKIERT DURCH TOM/KONTO/2FA | Kein `eas whoami` möglich ohne Login | Tom: `eas login` einmalig |
| Apple Developer Program | BLOCKIERT DURCH TOM/ZAHLUNG | 99 $/Jahr, nicht vorhanden | Tom: Konto anlegen |
| Google Play Console | BLOCKIERT DURCH TOM/ZAHLUNG | 25 $ einmalig, nicht vorhanden; Kontotyp (privat/Organisation) klärt 12-Tage/12-Tester-Pfad | Tom: Konto anlegen, Typ mitteilen |
| iOS Preview/Dev-Build (EAS) | BLOCKIERT DURCH TOM/KONTO | Setzt EAS-Login voraus | Nach Login ausführen |
| Android Preview/Internal-Build (EAS) | BLOCKIERT DURCH TOM/KONTO | Setzt EAS-Login voraus | Nach Login ausführen |
| TestFlight-Upload | BLOCKIERT DURCH TOM/KONTO | Setzt Apple-Konto + Build voraus | – |
| Play-Internal-Test-Upload | BLOCKIERT DURCH TOM/KONTO | Setzt Google-Konto + Build voraus | – |

### A8. Release-Candidate-Abnahme (Phase 8)

| Punkt | Status | Beleg | Nächster Schritt |
|---|---|---|---|
| `docs/RELEASE_CANDIDATE_REPORT.md` | IMPLEMENTIERBAR – JETZT AUSFÜHREN | Existiert noch nicht | Nach Abschluss der erreichbaren Phasen erstellen |
| Getrennte JA/NEIN-Entscheidung iOS/Android/Web | IMPLEMENTIERBAR – JETZT AUSFÜHREN | – | Ehrlich anhand tatsächlicher Prüfungen treffen |

## B. Zusammenfassung nach Zustand (Kurzform für den Abschlussbericht)

- **ERLEDIGT UND VERIFIZIERT:** Web-Kernqualität (Typecheck/Lint/Test/RLS/E2E/Build), Mobile-Kernqualität (Typecheck/Lint/Test/expo-doctor/JS-Export), Rollenbegrenzung App↔Praxis, lokale migrationsbasierte DB, deutsche Lokalisierung ehrlich dokumentiert.
- **ERLEDIGT UND VERIFIZIERT (Ergänzung):** Privacy-Dateninventur inkl. Apple-App-Privacy-/Google-Data-Safety-/Health-Mapping (`docs/PRIVACY_SECURITY.md` Abschnitt 1a), App-Icon/Splash aus eigener Marke, iOS-Fotozugriffstext, iOS Privacy Manifest, Store-Texte (Entwurf), Health-Check-Route + Deployment-Vorbereitung (`docs/DEPLOYMENT.md`), Android-Emulator-Ersteinrichtung, erweiterte iOS-Simulator-Matrix.
- **ERLEDIGT, CI-LAUF NACH LETZTEM FIX AUSSTEHEND:** Malware-Scan-Pipeline für Uploads (siehe A4-Tabelle für die genaue Historie – war bereits einmal real grün, ein eigener Isolations-Fix führte zu einer Regression, die per Server-Log root-caused und behoben wurde).
- **IMPLEMENTIERBAR – JETZT AUSFÜHREN (kein Blocker):** Konsolidierte Datenschutzerklärungs-Vorlage (Fließtext), Store-Screenshots (nach A2/A7), Release-Candidate-Report.
- **BLOCKIERT DURCH TOM/KONTO/2FA/ZAHLUNG:** gehostetes Supabase-Projekt, Domain/Hosting, SMTP-Anbieter, Apple Developer, Google Play Console, EAS-Login, alle signierten Builds/TestFlight/Play-Internal-Uploads, finale App-Identität (Name/Bundle-ID/Package/Publisher/Support-E-Mail).
- **BLOCKIERT DURCH RECHTLICHE FREIGABE:** endgültige Aufbewahrungsfrist für Luxemburger Patientendaten, jede Aussage zu „vollständiger DSGVO-Konformität" oder Medizinprodukt-Einstufung.
- **OPTIONAL NACH V1:** weitere Lokalisierungen, Push-Benachrichtigungen (Versand), Universal/App Links (Domain-abhängig ohnehin blockiert), Realtime-Sync.
