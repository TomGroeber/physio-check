# PhysioCheck

App für Physiotherapiepraxen und ihre Patientinnen und Patienten: Heimübungspläne mit Videos, Termine und selbst dokumentierte Durchführung (Adhärenz).

> **Stand:** Phase B (sicherer Einladungs-, Registrierungs- und Praxiswechsel-Ablauf) umgesetzt. Übungsdokumentation, erweiterte Terminlogik, Benachrichtigungen und Patientenakten folgen in den nächsten Phasen. Produktumfang: `docs/PRODUCT_SPEC.md`.

## Technik (gepinnte Versionen)

| Baustein | Version |
|---|---|
| Node.js | 22.23.1 (per nvm) |
| pnpm | 11.11.0 |
| Next.js (App Router) | 16.2.10 |
| React | 19.2.4 |
| Tailwind CSS | 4.3.2 |
| shadcn/ui (Radix, Preset „mira") | CLI 4.13 |
| Supabase CLI | 2.109.1 |
| @supabase/ssr / supabase-js | 0.12 / 2.110 |
| Zod | 4.4 |
| Vitest / Playwright | 4.1 / 1.61 |

## Voraussetzungen

1. **Node.js 22** (empfohlen über [nvm](https://github.com/nvm-sh/nvm)): `nvm install 22`
2. **pnpm**: `npm install -g corepack@latest && corepack enable pnpm`
3. **Docker Desktop** (für die lokale Datenbank): [docker.com](https://www.docker.com/products/docker-desktop/) – muss laufen.
4. **Supabase CLI**: `brew install supabase/tap/supabase`

## Lokale Entwicklung starten

```bash
pnpm install          # Abhängigkeiten installieren
supabase start        # lokale Datenbank + Auth + Storage (Docker)
cp .env.example .env.local   # einmalig; Werte siehe unten
pnpm seed             # Demo-Daten anlegen
pnpm dev              # App auf http://localhost:3000
```

Werte für `.env.local`: `supabase status` zeigt `API URL` (→ `NEXT_PUBLIC_SUPABASE_URL`), `anon key` (→ `NEXT_PUBLIC_SUPABASE_ANON_KEY`) und `service_role key` (→ `SUPABASE_SERVICE_ROLE_KEY`). `NEXT_PUBLIC_APP_URL` bleibt `http://localhost:3000`.

## Demo-Konten (nur lokal, frei erfunden)

| Rolle | E-Mail | Passwort |
|---|---|---|
| Patientin | `patientin@demo.physiocheck.test` | `PhysioDemo2026!` |
| Therapeutin | `therapeutin@demo.physiocheck.test` | `PhysioDemo2026!` |
| Praxis-Admin | `admin@demo.physiocheck.test` | `PhysioDemo2026!` |
| Eingeladene Patientin | `eingeladen@demo.physiocheck.test` | `PhysioDemo2026!` |

Demo-Einladungscode: `DEMA-PHYS-2326`

- **Patientenansicht:** anmelden als Patientin → Startseite „Heute" mit Übungen und nächstem Termin.
- **Therapeutenansicht:** anmelden als Therapeutin → Praxis-Dashboard.
- Am besten zwei verschiedene Browser (oder ein privates Fenster) für beide Rollen gleichzeitig.

**Demo-Daten zurücksetzen:** `pnpm db:reset && pnpm seed`

**E-Mails ansehen (Registrierung/Passwort):** Lokal werden alle Mails von Mailpit abgefangen: http://localhost:54324

**Testvideo hochladen:** noch nicht möglich – die Übungsverwaltung mit Video-Upload folgt in Phase C. Der private Storage-Bucket (`exercise-media`) ist bereits eingerichtet.

## Häufigste Befehle

```bash
pnpm dev          # Entwicklungsserver
pnpm typecheck    # TypeScript prüfen
pnpm lint         # Codequalität prüfen
pnpm test         # Unit-/Komponententests (Vitest)
pnpm e2e          # End-to-End-Tests (Playwright; Supabase + Seed nötig)
pnpm build        # Production Build
pnpm db:reset     # Datenbank neu aufbauen (Migrationen)
pnpm db:types     # TypeScript-Typen aus dem DB-Schema erzeugen
pnpm seed         # Demo-Daten neu anlegen
```

## Einladungsablauf testen

1. `pnpm db:reset`, `pnpm seed`, `pnpm dev`
2. Startseite öffnen → „Ich habe einen Einladungscode“.
3. `DEMA-PHYS-2326` eingeben.
4. „Mit bestehendem Konto anmelden“ wählen.
5. Als `eingeladen@demo.physiocheck.test` mit `PhysioDemo2026!` anmelden.
6. Verbindung zur Demo-Praxis bestätigen.

Eine neue Einladung erstellt die Therapeutin unter **Patienten → Patient anlegen**. Der Klartextcode wird nur direkt nach der Erstellung angezeigt. „Neuen Code erzeugen“ widerruft den vorherigen Code atomar.

## Bestehende Demo-Bereiche testen

1. `supabase start`, `pnpm seed`, `pnpm dev`
2. Als Patientin anmelden → „Heute" zeigt 3 Übungen (1 gestern dokumentiert) und den nächsten Termin mit Karten-Link; Bereiche „Termine" und „Profil" über die untere Navigation.
3. Abmelden, als Therapeutin anmelden → Dashboard zeigt heutige Termine, dokumentierte Übungen und die Rückmeldung „zu schwierig" aus den Demo-Daten; Patientenliste mit Suche, Übungsbibliothek, Terminliste.
4. Eine Registrierung ist nur nach einem gültigen Einladungscode erreichbar. Nach der E-Mail-Bestätigung wird die Praxisverbindung ausdrücklich bestätigt.

## Neue Migration anwenden

Die Migration `20260711140000_secure_patient_invites.sql` ergänzt Praxiswechsel, atomare Code-Einlösung und persistentes Rate Limiting. Lokal genügt:

```bash
pnpm db:reset
pnpm seed
```

## Wichtige Dokumente

- `CLAUDE.md` – verbindliche Projektregeln
- `docs/PRODUCT_SPEC.md` – Produktumfang und Akzeptanzkriterien
- `docs/ARCHITECTURE.md` – Architektur und Sicherheitsentscheidungen
- `docs/DATA_MODEL.md` – Datenmodell (ER-Diagramm)
- `docs/PRIVACY_SECURITY.md` – Datenschutz und Sicherheit
- `docs/ROADMAP.md` – spätere Erweiterungen
- `TASKS.md` / `DECISIONS.md` – Aufgaben und Entscheidungen

## Sicherheit (Kurzfassung)

- Rollen und Rechte liegen ausschließlich in der Datenbank (Row Level Security auf jeder patientenbezogenen Tabelle).
- Der Service-Role-Schlüssel existiert nur serverseitig (`.env.local`, nie im Browser, nie im Repository).
- Keine echten Personen- oder Gesundheitsdaten in Entwicklung und Tests.
