# PhysioCheck – Mobile Entwicklung (Patienten-App)

> Für Toms Mac. Architektur: `docs/MOBILE_ARCHITECTURE.md` · Store: `docs/APP_STORE_CHECKLIST.md`

## Voraussetzungen

- Node 22 (`nvm use 22`), pnpm 11 (Repo-Root)
- Lokale Supabase läuft (`supabase start`), Datenbank frisch: `pnpm db:reset && pnpm seed`
- Für die wenigen Server-Endpunkte (`/api/mobile/*`, z. B. Übungsvideos und Profilbild-Upload) muss die Website laufen: `pnpm dev` **oder** stabiler `pnpm build && pnpm start`
- Einmalig: `cp apps/patient-mobile/.env.example apps/patient-mobile/.env` und die Werte aus `supabase status` eintragen (`API_URL` → `EXPO_PUBLIC_SUPABASE_URL`, `PUBLISHABLE_KEY` → `EXPO_PUBLIC_SUPABASE_KEY`). Auf einem echten Gerät statt `127.0.0.1` die LAN-IP des Macs verwenden.

## Befehle (vom Repo-Root)

| Befehl | Zweck |
|---|---|
| `pnpm mobile:start` | Expo-Dev-Server (QR-Code für Expo Go / Dev-Client) |
| `pnpm mobile:ios` | Start im iOS-Simulator (benötigt Xcode – s. Blocker) |
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
├── eas.json               EAS-Profile development/preview/production (ohne Zugangsdaten)
├── src/app/               Expo-Router-Routen (KEINE Testdateien hierhin – werden sonst Routen!)
│   ├── (auth)/            Willkommen, Login, Code, Registrierung, Aussperrung, Passwort
│   ├── (tabs)/            Heute · Termine · Profil (max. 3 Bereiche)
│   ├── exercise/[planItemId].tsx   Übung: Video + Vorgaben + Dokumentation
│   ├── auth/confirm.tsx · reset-password.tsx · invite/[code].tsx   Deep-Link-Ziele
│   └── delete-account.tsx Kontolöschungsantrag (D-062)
├── src/data/              Datenzugriff (Supabase RLS + RPCs + /api/mobile)
├── src/lib/               supabase-Client, sicherer Sessionspeicher, Session-Kontext, useLoad
├── src/components/ui.tsx  Basiskomponenten (≥48pt Touch, ≥18pt Schrift, Screenreader-Labels)
├── src/messages/de.ts     Alle App-Texte (Sprachhygiene wie Web)
└── src/config/branding.ts Name, Farben (hell/dunkel), Typografie – nie hartkodieren
```

## Wichtige Eigenheiten

- **Sessions**: AES-verschlüsselt in AsyncStorage, Schlüssel im SecureStore (`secure-session-storage.ts`, D-061). Nie zu einfachem AsyncStorage wechseln.
- **`@physio-check/shared`** wird als TypeScript-Quelle konsumiert: Next braucht `transpilePackages`, Metro/Jest transformieren es automatisch. Die Website re-exportiert die verschobenen Module unter den alten `@/lib/...`-Pfaden.
- **Jest**: `jest@~29.7.0` ist bewusst gepinnt (jest-expo 57 nutzt intern Jest 29; Jest 30 bricht mit `clearMocksOnScope`). RNTL v14: `render` ist **async** → immer `await render(...)`. Safe-Area wird global gemockt (`jest.setup.js`).
- **Deep Links** (Dev): `npx uri-scheme open "physiocheck://invite/DEMA-PHYS-2326" --ios`. Universal/App Links benötigen eine Domain (offen, s. Checkliste).
- **Praxisrollen** werden nach Login erkannt (Mitgliedszeile via RLS) und ausgesperrt; es gibt keinen mobilen Praxisbereich.

## Verifikation (Stand 19.07.2026)

- `pnpm mobile:typecheck` ✓ · `pnpm mobile:lint` ✓ (0 Fehler/0 Warnungen) · `pnpm mobile:test` ✓ (10 Tests) · `expo-doctor` 20/20 ✓ · `expo export --platform ios` ✓ (Hermes-Bundle)
- Integrationsprobe gegen lokale Supabase + Next-Server (15 Proben, Skript im Sitzungs-Scratchpad dokumentiert in `docs/TEST_MATRIX.md`): Login, Rollen-/Linkerkennung, Heute-Berechnung, Durchgangs-RPC, Medien-Endpunkt (signierte URLs), 401-Grenzen, Code-Prüfung gültig/ungültig.

## Echte externe Blocker (kein Codefehler)

1. **Xcode fehlt** (nur CommandLineTools): kein iOS-Simulator, kein nativer Build. Beheben: Xcode aus dem App Store, dann `pnpm mobile:ios`.
2. **Android SDK/Emulator fehlt**: Android Studio installieren, dann `pnpm mobile:android`.
3. **EAS/Store-Konten, Push-Credentials (APNs/FCM), Universal-Link-Domain**: siehe `docs/APP_STORE_CHECKLIST.md`. Nichts davon wird ohne Toms ausdrückliche Zustimmung angelegt.
