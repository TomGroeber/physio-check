# PhysioCheck – Release-Candidate-Report

> Stand: 22.07.2026 · Branch `claude/store-release-readiness-20260721` · Commit `a616e7e` · CI-Lauf [`29955743043`](https://github.com/TomGroeber/physio-check/actions/runs/29955743043) (alle 4 Jobs grün)
>
> Dieser Report fasst den technisch erreichbaren Reifegrad zusammen. Er ersetzt keine juristische Prüfung und ist **keine Freigabe zur Einreichung** – die Einreichung selbst bleibt an die genannten Abschnitt-2-Stopppunkte gebunden (Konto-Logins, Zahlungen, unwiderrufliche App-Identität, Rechtsentscheidungen).

## 1. Versionen und Build-Identität

| Komponente | Wert |
|---|---|
| Web-App-Version (`package.json`) | `0.1.0` |
| Mobile-App-Version (`apps/patient-mobile/app.json`) | `0.1.0` (kein `ios.buildNumber`/`android.versionCode` gesetzt – EAS `autoIncrement` übernimmt das beim ersten echten Build) |
| Node | `>=22.13.0 <23.0.0` (gepinnt, D-068), lokal getestet mit `v22.23.1` |
| pnpm | `>=11.0.0 <12.0.0` (gepinnt, D-068), lokal getestet mit `11.11.0` |
| iOS Bundle ID (Platzhalter) | `test.physiocheck.patient` – **nicht final**, siehe Abschnitt 5 |
| Android Application ID (Platzhalter) | `test.physiocheck.patient` – **nicht final** |
| Zielplattformen | Web (Next.js 16, Praxis-Dashboard), iOS/Android (Expo/React Native, Patienten-App) |

## 2. Test-Gesamtstatus (real ausgeführt, nicht nur „sollte grün sein")

| Prüfung | Ergebnis | Quelle |
|---|---|---|
| Web-Unit-Tests (Vitest) | 115/115 grün, 23 Testdateien | `pnpm test`, 22.07.2026 |
| Mobile-Unit-Tests (Jest) | 16/16 grün, 5 Testdateien | `apps/patient-mobile`, `pnpm test`, 22.07.2026 |
| RLS-Proben (`scripts/rls-tests.ts`) | 104 Proben grün | `pnpm test:rls`, s. `docs/TEST_MATRIX.md` |
| Playwright-E2E-Spezifikationen | 41 Testfälle | `e2e/*.spec.ts`, inkl. Malware-Scan-, Avatar-, Kontolöschungs- und Phase-J-Übungsverwaltungs-Suiten |
| CI-Pipeline (4 Jobs: Web Typecheck/Lint/Unit/Build, Web RLS+E2E, Mobile Typecheck/Lint/Unit/expo-doctor/Export, Security Secret-Scan+Audit) | Grün über mehrere aufeinanderfolgende reale Läufe (u. a. `29941832703`, `29954091721`, `29954798610`, `29955743043`) | `gh run view` |
| `expo-doctor` | 20/20 | Mobile-CI-Job |
| iOS-Simulator-Matrix | iPhone 17 Pro, iPhone Air, iPad Air 11" – Login, UI-Parität zur Web-Referenz, Dark Mode, größte Dynamic-Type-Stufe, Tablet-Layout (`supportsTablet: false`) alle real per Screenshot verifiziert | D-084, `docs/TEST_MATRIX.md` |
| Android-Emulator | Android 16/API 36, echter `expo run:android`-Build, echte Anmeldung + Backend-Daten in Hell/Dunkel | D-084, `docs/TEST_MATRIX.md` |
| iOS Privacy Manifest | `PrivacyInfo.xcprivacy` per echtem `expo prebuild --clean` generiert und inhaltlich geprüft | D-086 |
| Öffentliche Datenschutzerklärung | `/privacy` ohne Login erreichbar, per Playwright-Screenshot verifiziert | D-087 |
| Malware-Scan (ClamAV, fail-closed) | Real in CI verifiziert inkl. eigens gebauter Testsignatur für unerkennbare EICAR-Grenzfälle | D-071/D-072/D-077 bis D-081, `.github/workflows/ci.yml` |

## 3. Bekannte Einschränkungen (dokumentiert, kein Blocker für weitere technische Arbeit)

- **macOS-Bedienungshilfen-Berechtigung fehlt** auf Toms Mac für automatisierte Taps im Simulator (Formulareingabe wie Telefonnummer/Absagegrund/Bildauswahl konnte deshalb nicht vollautomatisch durchgespielt werden, nur direkt setzbare Zustände wie Dark Mode/Dynamic Type). Umgebungsblocker, kein Codeproblem; unverändert seit der vorherigen Sitzung.
- **Deep-Link-Navigation zu einer bereits laufenden App-Instanz** verhält sich nicht wie eine echte In-App-Navigation (`xcrun simctl openurl` löst zusätzlich einen nicht automatisch wegklickbaren System-Dialog aus). Für Kaltstart-Fälle funktioniert `xcrun simctl launch` ohne dieses Problem. Dokumentiert als D-085, nach 3 dokumentierten Fehlversuchen bewusst nicht weiterverfolgt (systematisches Debugging-Prinzip: Grenze der Testumgebung akzeptieren statt weiter zu raten).
- **VoiceOver und Reduce-Motion** lassen sich ohne Bedienungshilfen-Berechtigung nicht per `simctl` automatisiert um- oder abschalten (im Gegensatz zu Dark Mode/Dynamic Type/Kontrast, für die `simctl ui` funktioniert).
- **Kein produktionsreifer Dauer-Malware-Scanner**: Die aktuelle ClamAV-Integration ist fail-closed und in CI verifiziert, aber die Wahl zwischen einem dauerhaft laufenden `clamd`-Dienst oder einem Cloud-AV-Dienst hängt von der noch offenen Hosting-Entscheidung ab.

## 4. Externe Blocker (Abschnitt-2-Stopppunkte – benötigen Tom)

Diese Punkte sind technisch vorbereitet, aber absichtlich nicht ausgeführt:

| Blocker | Status | Vorbereitet in |
|---|---|---|
| Apple Developer Program (99 €/Jahr) | Nicht abgeschlossen | `docs/APP_STORE_CHECKLIST.md` |
| Google Play Console (25 $ einmalig) | Nicht abgeschlossen | `docs/APP_STORE_CHECKLIST.md` |
| Expo/EAS-Konto für Cloud-Builds | Nicht abgeschlossen | `eas.json` liegt fertig konfiguriert bereit |
| Finale App-Identität (Name, Bundle ID, Package-Name, Domain, Support-E-Mail) | Nicht final – aktuell Platzhalter `test.physiocheck.patient` | `app.json`, `branding.ts` |
| Gehostetes Supabase-Projekt (Region, Vertrag/DPA) | Nicht abgeschlossen – nur lokale Dev-Instanz | `docs/DEPLOYMENT.md` |
| Domain + Hosting fürs Web-Dashboard | Nicht abgeschlossen | `docs/DEPLOYMENT.md` |
| Juristische Prüfung der Datenschutzerklärung | Ausstehend | `/privacy`, D-087 |
| Offene Rechtsfrage Luxemburg (Aufbewahrungspflichten Behandlungsdaten) | Ausstehend | `docs/APP_STORE_CHECKLIST.md` |
| Store-Screenshots | Blockiert durch fehlenden signierten Build (setzt EAS-Konto voraus) | – |

## 5. Rollback-Plan

- **Web:** Deployment ist noch nicht produktiv – es gibt nichts zurückzurollen. Sobald ein Hosting-Ziel feststeht, gilt die Standard-Vorgehensweise aus `docs/DEPLOYMENT.md`: vorherigen Git-Tag/Commit erneut deployen, da Migrationen additiv sind (keine destruktiven Schema-Änderungen in `supabase/migrations/`).
- **Mobile:** Vor dem ersten echten EAS-Build gibt es keinen produktiven Rollback-Fall. Ab dem ersten TestFlight/Play-Interner-Test-Build gilt: vorherige EAS-Build-Nummer erneut als „Production"/„Internal Testing" zuweisen (EAS behält alle Builds mit fortlaufender `autoIncrement`-Nummer vor); keine Datenbankmigration ist an eine bestimmte App-Version gebunden, da die API rückwärtskompatibel gehalten wird (Zod-Validierung serverseitig, keine Breaking Changes ohne neue Server-Action).
- **Datenbank:** Migrationen in `supabase/migrations/` sind additiv und einzeln versioniert; ein Rollback bedeutet in der Praxis „keine neue Migration ausführen", nicht „Migration zurückdrehen" (kein `down`-Skript vorgesehen, konsistent mit Regel 7 „Planintegrität" aus `CLAUDE.md`).

## 6. Freigabe-Einschätzung pro Plattform

| Plattform | Technisch bereit für internen Test (TestFlight/Play interner Test)? | Technisch bereit für öffentliche Store-Einreichung? |
|---|---|---|
| **iOS** | **JA** – Build, Login, UI-Parität, Dark Mode, Dynamic Type, Privacy Manifest alle real verifiziert; fehlt nur ein Apple-Developer-Konto plus EAS-Build | **NEIN** – Datenschutzerklärung braucht juristische Prüfung, App-Identität ist nicht final, keine Store-Screenshots vorhanden |
| **Android** | **JA** – Build, Login, echte Backend-Daten in Hell/Dunkel real verifiziert; fehlt nur ein Play-Console-Konto plus EAS-Build | **NEIN** – gleiche Gründe wie iOS |
| **Web (Praxis-Dashboard)** | **JA** für einen internen/Staging-Rollout – CI durchgängig grün, Security-Header/CSP verifiziert, Malware-Scan verifiziert | **NEIN** für Produktivbetrieb – kein gehostetes Supabase-Projekt, keine Domain, kein Hosting-Ziel entschieden |

**Zusammenfassung:** Alle technisch ohne Konto/Zahlung/Rechtsentscheidung erreichbaren Punkte aus `docs/RELEASE_READINESS.md` sind abgeschlossen und verifiziert. Der verbleibende Weg zur echten Einreichung besteht ausschließlich aus Punkten, die laut Auftrag bewusst Toms Entscheidung bzw. Handlung erfordern (Abschnitt 4 oben) – keiner davon wurde umgangen, erfunden oder stillschweigend übersprungen.
