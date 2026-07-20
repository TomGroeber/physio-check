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
│   ├── (tabs)/              Heute · Termine · Profil (max. 3 Bereiche) + Unterseiten session, exercise/[planItemId]
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
- **Tab-Bar** (`components/tab-bar.tsx`) berechnet ihre Höhe aus Inhalt + `useSafeAreaInsets().bottom` – nie eine feste Höhe setzen (Ursache des früheren Croppings, D-063).
- **Jest**: `jest@~29.7.0` ist bewusst gepinnt (jest-expo 57 nutzt intern Jest 29; Jest 30 bricht mit `clearMocksOnScope`). `@types/jest@29.5.14` ebenso gepinnt (sonst meldet `expo-doctor` eine Versionsabweichung). RNTL v14: `render` ist **async** → immer `await render(...)`. Safe-Area und AsyncStorage werden global gemockt (`jest.setup.js`, offizielle Jest-Mocks der Bibliotheken).
- **Deep Links** (Dev, ohne Dev-Client nur `exp://` nutzbar – das eigene Schema `physiocheck://` wird erst in einem EAS-/Dev-Client-Build registriert): `xcrun simctl openurl booted "exp://127.0.0.1:8081/--/invite/DEMA-PHYS-2326"`. Universal/App Links benötigen eine Domain (offen, s. Checkliste).
- **Praxisrollen** werden nach Login erkannt (Mitgliedszeile via RLS) und ausgesperrt; es gibt keinen mobilen Praxisbereich.
- **Simulator-Verifikation ohne Tap-Automatisierung**: `xcrun simctl` bietet keine Tap-/Texteingabe-APIs; Tools wie `cliclick` benötigen macOS-Bedienungshilfen-Berechtigung, die nur per physischer Interaktion in den Systemeinstellungen erteilt werden kann. Für Screenshot-Verifikation ohne diese Berechtigung: Deep-Links zum Navigieren (`exp://.../--/<route>`), `xcrun simctl ui booted appearance dark|light` zum tap-freien Hell/Dunkel-Wechsel.

## Verifikation (Stand 20.07.2026)

- `pnpm mobile:typecheck` ✓ · `pnpm mobile:lint` ✓ (0 Fehler/0 Warnungen) · `pnpm mobile:test` ✓ (16 Tests, 5 Dateien) · `expo-doctor` 20/20 ✓ · `expo export --platform ios` ✓ (Hermes-Bundle)
- Integrationsprobe gegen lokale Supabase + Next-Server (15 Proben, dokumentiert in `docs/TEST_MATRIX.md`): Login, Rollen-/Linkerkennung, Heute-Berechnung, Durchgangs-RPC, Medien-Endpunkt (signierte URLs), 401-Grenzen, Code-Prüfung gültig/ungültig.
- **Echter Simulatorlauf** (iPhone 17 Pro, iOS 26.5, Metro über Expo-Tunnel): Anmeldung mit dem lokalen Demo-Patientenkonto funktioniert; Code-/Verbindungsbereich, Heute, Termine und Profil optisch und strukturell gegen die Patienten-Weboberfläche verglichen (hell und dunkel) – siehe `docs/TEST_MATRIX.md`, Abschnitt „UI-Parität“.

## Frühere Blocker – Status

1. ~~Xcode fehlt~~ **Erledigt.** Xcode ist installiert, Simulator läuft, Patientenanmeldung funktioniert.
2. **Android SDK/Emulator fehlt weiterhin**: Android Studio installieren, dann `pnpm mobile:android`. Kein Android-Simulatorlauf in dieser Sitzung.
3. **macOS-Bedienungshilfen-Berechtigung fehlt** (neu erkannt): blockiert automatisierte Taps/Texteingaben im Simulator (`cliclick`, `osascript System Events`). Erfordert einen manuellen, physischen Klick in Systemeinstellungen → Datenschutz & Sicherheit → Bedienungshilfen für das ausführende Terminal-Programm. Deshalb wurden Formularinteraktionen (Tippen/Eingeben) nicht per Tap verifiziert, nur per Deep-Link-Navigation, Systemappearance-Umschaltung und Code-Review.
4. **EAS/Store-Konten, Push-Credentials (APNs/FCM), Universal-Link-Domain**: siehe `docs/APP_STORE_CHECKLIST.md`. Nichts davon wird ohne Toms ausdrückliche Zustimmung angelegt.
