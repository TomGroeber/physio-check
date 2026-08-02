# PhysioCheck – Mobile Entwicklung (Patienten-App)

> Für Toms Mac. Architektur: `docs/MOBILE_ARCHITECTURE.md` · Store: `docs/APP_STORE_CHECKLIST.md`

## Voraussetzungen

- Node 22 (`nvm use 22`), pnpm 11 (Repo-Root)
- Xcode ist installiert (verifiziert: Xcode 26.6, iOS-Simulator-Laufzeiten inkl. iPhone 17 Pro) – **kein Blocker mehr**, s. Verifikation unten
- Lokale Supabase läuft (`supabase start`), Datenbank frisch: `pnpm db:reset && pnpm seed`
- Für die wenigen Server-Endpunkte (`/api/mobile/*`, z. B. Übungsvideos und Profilbild-Upload) muss die Website laufen: `pnpm dev` **oder** stabiler `pnpm build && pnpm start`
- Einmalig: `cp apps/patient-mobile/.env.example apps/patient-mobile/.env` und die Werte aus `supabase status` eintragen (`API_URL` → `EXPO_PUBLIC_SUPABASE_URL`, `PUBLISHABLE_KEY` → `EXPO_PUBLIC_SUPABASE_KEY`). Auf einem echten Gerät statt `127.0.0.1` die LAN-IP des Macs verwenden.

## Lokal starten (verifizierter Ablauf)

```bash
supabase start
pnpm db:reset && pnpm seed
pnpm build && pnpm start            # Next-Server für /api/mobile-Endpunkte (Port 3000)
pnpm mobile:start                   # Metro-Bundler (Port 8081)
```

Im iOS-Simulator (App „Simulator“ vorher öffnen, z. B. `open -a Simulator`):

- Am einfachsten: im Metro-Terminal `i` drücken (öffnet automatisch im zuletzt gebooteten Simulator).
- Falls Metro und Simulator sich nicht direkt finden (z. B. Netzwerk-/Firewall-Eigenheiten): Expo-Tunnel verwenden – `pnpm --dir apps/patient-mobile exec expo start --tunnel` und den angezeigten QR-Code bzw. die `exp://`-URL im Simulator über `xcrun simctl openurl booted "exp://<tunnel-host>"` öffnen. **So wurde die App in dieser Sitzung erstmals erfolgreich geladen** (Toms Netzwerk brauchte den Tunnel).
- Direktes Ansteuern einer Route ohne Tippen (nützlich zum Nachvollziehen von Screenshots): `xcrun simctl openurl booted "exp://127.0.0.1:8081/--/<route>"`, z. B. `--/today`, `--/appointments`, `--/profile`.

## Befehle (vom Repo-Root)

| Befehl | Zweck |
|---|---|
| `pnpm mobile:start` | Expo-Dev-Server (QR-Code für Expo Go / Dev-Client) |
| `pnpm mobile:ios` | Start im iOS-Simulator |
| `pnpm mobile:android` | Start im Android-Emulator (benötigt Android Studio) |
| `pnpm mobile:typecheck` | TypeScript strict |
| `pnpm mobile:lint` | `expo lint` (eslint-config-expo, inkl. React-Compiler-Regeln) |
| `pnpm mobile:test` | Jest + Testing Library (jest-expo) |
| `pnpm shared:typecheck` | Typprüfung des geteilten Pakets |

Direkt in `apps/patient-mobile`: `npx expo export --platform ios` erzeugt das Produktions-JS-Bundle (guter Schnelltest, ob alles bündelt), `npx expo-doctor` prüft die Projektkonfiguration.

## Struktur

```
apps/patient-mobile/
├── app.json               Expo-Konfiguration (Schema physiocheck://, Bundle-IDs als Vorschlag)
├── eas.json                EAS-Profile development/preview/production (ohne Zugangsdaten)
├── src/app/                Expo-Router-Routen (KEINE Testdateien hierhin – werden sonst Routen!)
│   ├── (auth)/              Willkommen, Login, Code/Verbindung (Kontoabschnitt+Abmelden), Registrierung, Aussperrung, Passwort
│   ├── (tabs)/              Heute · Termine · Nachrichten · Profil (max. 4 Bereiche, CLAUDE.md Regel 9) + Unterseiten session, exercise/[planItemId]
│   ├── auth/confirm.tsx · reset-password.tsx · invite/[code].tsx   Deep-Link-Ziele
│   └── delete-account.tsx  Kontolöschungsantrag (D-062)
├── src/data/                Datenzugriff (Supabase RLS + RPCs + /api/mobile)
├── src/lib/                 supabase-Client, sicherer Sessionspeicher, Session-Kontext, Theme, useLoad
├── src/components/          ui.tsx (Basiskomponenten), tab-bar.tsx, app-header.tsx, exercise-view.tsx, exercise-log-form.tsx, appointment-card.tsx
├── src/messages/de.ts       App-spezifische Texte + Re-Export der Web-Texte (`web`) aus `@physio-check/shared`
└── src/config/branding.ts   Design-Tokens 1:1 aus der Web-Referenz (OKLCH→Hex) – nie hartkodieren
```

## Wichtige Eigenheiten

- **Sessions**: AES-verschlüsselt in AsyncStorage, Schlüssel im SecureStore (`secure-session-storage.ts`, D-061). Nie zu einfachem AsyncStorage wechseln.
- **`@physio-check/shared`** wird als TypeScript-Quelle konsumiert: Next braucht `transpilePackages`, Metro/Jest transformieren es automatisch. Die Website re-exportiert die verschobenen Module unter den alten `@/lib/...`-Pfaden. Seit dem UI-Paritäts-Auftrag (20.07.2026) liegen auch `messages-de.ts`, `reminders.ts` und `exercise-log-validation.ts` dort (D-065) – die App verwendet **dieselben** deutschen Texte wie die Website, nie eine zweite Übersetzung.
- **Design ist an die Patienten-Weboberfläche gebunden** (D-064): Farben, Radien, Abstände, Typografie kommen aus `branding.ts` und spiegeln exakt `src/app/globals.css`. Bei Web-Design-Änderungen `branding.ts` synchron halten.
- **Tab-Bar** (`components/tab-bar.tsx`) berechnet ihre Höhe aus Inhalt + `useSafeAreaInsets().bottom` – nie eine feste Höhe setzen (Ursache des früheren Croppings, D-063). Seit 26.07.2026 (D-106–D-111) eine schwebende, randabgesetzte Glaskapsel (`position: absolute`, `@callstack/liquid-glass`) statt randlosem Balken; die Screens reservieren dafür über `Screen`'s `bottomInset={TAB_BAR_CONTENT_HEIGHT}` Platz. Eine einzelne `Animated.Value`-Hervorhebung gleitet zwischen den Zielen (Feder-Animation beim Antippen, direktes Folgen der Fingerposition beim Ziehen). Auf Android und älterem iOS: einfache, transluzente Fläche ohne Animation der Hervorhebungsfarbe (kein `isLiquidGlassSupported`).
- **Jest**: `jest@~29.7.0` ist bewusst gepinnt (jest-expo 57 nutzt intern Jest 29; Jest 30 bricht mit `clearMocksOnScope`). `@types/jest@29.5.14` ebenso gepinnt (sonst meldet `expo-doctor` eine Versionsabweichung). RNTL v14: `render` ist **async** → immer `await render(...)`. Safe-Area und AsyncStorage werden global gemockt (`jest.setup.js`, offizielle Jest-Mocks der Bibliotheken).
- **Deep Links** (Dev, ohne Dev-Client nur `exp://` nutzbar – das eigene Schema `physiocheck://` wird erst in einem EAS-/Dev-Client-Build registriert): `xcrun simctl openurl booted "exp://127.0.0.1:8081/--/invite/DEMA-PHYS-2326"`. Universal/App Links benötigen eine Domain (offen, s. Checkliste).
- **Praxisrollen** werden nach Login erkannt (Mitgliedszeile via RLS) und ausgesperrt; es gibt keinen mobilen Praxisbereich.
- **Simulator-Tap-Automatisierung**: `xcrun simctl` bietet keine Tap-/Texteingabe-APIs; `cliclick`/`osascript System Events` brauchen dafür macOS-Bedienungshilfen-Berechtigung für das ausführende Terminal-Programm (Systemeinstellungen → Datenschutz & Sicherheit → Bedienungshilfen, nur per physischem Klick durch Tom erteilbar – seit 02.08.2026 erteilt). Koordinatenbasiertes Tippen per `cliclick` ist selbst mit Berechtigung fehleranfällig (Fensterposition/Skalierung muss exakt vermessen werden, jede Abweichung trifft die falsche Stelle) und kostet auf Claudes Seite viele Tokens für wenig Nutzen – der praktikablere Weg für echte Formularinteraktion ist, dass Tom selbst im Simulator tippt und Bildschirmfotos schickt, während die KI Ergebnisse auswertet und die nächsten Schritte ansagt. Für reine Navigation ohne Tippen bleiben Deep-Links (`exp://.../--/<route>`) und `xcrun simctl ui booted appearance dark|light` nützlich.

## Verifikation (Stand 02.08.2026, Phase N)

- `pnpm mobile:typecheck` ✓ · `pnpm mobile:lint` ✓ · `pnpm mobile:test` ✓ · `expo-doctor` (bekannter, unabhängiger Blocker: SDK-Patch-Versionsabweichung gegen die npm-Registry, s. `docs/AI_HANDOFF.md`) · `expo export --platform ios` ✓
- Integrationsprobe gegen lokale Supabase + Next-Server (15 Proben, dokumentiert in `docs/TEST_MATRIX.md`): Login, Rollen-/Linkerkennung, Heute-Berechnung, Durchgangs-RPC, Medien-Endpunkt (signierte URLs), 401-Grenzen, Code-Prüfung gültig/ungültig.
- **Echter Simulatorlauf mit echten Taps** (iPhone 17 Pro, iOS 26.5, nativer Dev-Client via `npx expo run:ios` – erstmals mit erteilter Bedienungshilfen-Berechtigung, Tom hat die Taps im Simulator selbst ausgeführt, Screenshots ausgewertet): Rollen-Aussperrung (Praxis-Login wird erkannt und abgemeldet, „Diese App ist für Patientinnen und Patienten"), Patienten-Login, Heute-Übersicht, Übungsansicht (korrekter „Kein Video hinterlegt"-Leerzustand), **Übung dokumentieren** (Fortschritt aktualisiert sich sofort, Liste ordnet sich um), Termine-Liste, **echte Nachricht senden** (erscheint sofort mit Zeitstempel), Profil (Name/E-Mail/Telefon/Passwort ändern), **Hell/Dunkel-Umschaltung** (wirkt sofort). Alles funktioniert wie erwartet, keine Abweichung zur Web-Oberfläche gefunden.
- Zusätzlich per Code-Review geprüft (nicht nur angenommen): die native Terminangebot-Ansicht (`apps/patient-mobile/src/app/(tabs)/appointments.tsx`) hat **nicht** denselben Fehler wie die Web-Komponente vor D-145 – die Erfolgsmeldung ist dort ein eigener, von der Angebotsliste unabhängiger Zustand, kein gemeinsames „leere Liste → return null"-Muster.
- **Noch nicht getestet** (Toms eigene Priorisierung für eine spätere Sitzung): Profilbild-Upload (Malware-Scan-Pfad auf echtem Gerät), Terminabsage-Anfrage, Terminangebot annehmen/ablehnen auf nativ (kein Angebot in den Demo-Daten vorhanden, müsste erst über die Praxis-Weboberfläche angelegt werden).

## Frühere Blocker – Status

1. ~~Xcode fehlt~~ **Erledigt.** Xcode ist installiert, Simulator läuft.
2. **Android SDK/Emulator fehlt weiterhin**: Android Studio installieren, dann `pnpm mobile:android`. Kein Android-Simulatorlauf möglich, solange das fehlt.
3. ~~macOS-Bedienungshilfen-Berechtigung fehlt~~ **Erledigt (02.08.2026).** Tom hat sie erteilt; echte Tap-Interaktion im Simulator funktioniert jetzt (s. Verifikation oben).
4. **EAS/Store-Konten, Push-Credentials (APNs/FCM), Universal-Link-Domain**: siehe `docs/APP_STORE_CHECKLIST.md`. Nichts davon wird ohne Toms ausdrückliche Zustimmung angelegt.
5. **Docker-VM-Datenträger kann volllaufen** (neu erkannt, 02.08.2026): `supabase start` schlug mit „No space left on device" fehl, obwohl der Mac selbst noch reichlich freien Speicher hatte – Dockers eigene virtuelle Festplatte war voll (u. a. durch ein großes, unabhängiges Docker-Image eines anderen Projekts). Behoben durch `docker builder prune -f` (löscht nur Build-Cache, keine Images/Container). Bei erneutem Auftreten: `docker system df` prüfen, gezielt aufräumen statt pauschal `docker system prune -a` (könnte fremde, noch benötigte Images anderer Projekte treffen).
