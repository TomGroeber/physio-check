---
name: verify
description: How to build, launch, and drive PhysioCheck locally to verify changes end-to-end (Next.js + Supabase + Playwright driver).
---

# Verifying PhysioCheck locally

## Prerequisites / gotchas

- Shell needs nvm: `export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && nvm use 22` (system node is too old for pnpm 11).
- Docker Desktop + `supabase start` must be running (`supabase status` shows keys/URLs).
- Fresh state: `pnpm db:reset && pnpm seed` (seed prints the demo logins; invite code `DEMA-PHYS-2326`).
- **Prefer `pnpm build && pnpm start` over `pnpm dev`** for driving flows: the dev server (Turbopack) wedges after repeated db resets and throws ChunkLoadErrors; prod server is stable on :3000.

## Driving the app

Use a Node script with `const { chromium } = require("@playwright/test")` and run it with
`NODE_PATH=<repo>/node_modules node script.js` (script can live outside the repo).

- Login: `/login`, labels `E-Mail-Adresse` / `Passwort`, button `Anmelden`, then `waitForURL(u => !u.pathname.startsWith("/login"))`.
- Demo users: `therapeutin@` / `patientin@` / `admin@demo.physiocheck.test`, password `PhysioDemo2026!`.
- Patient detail: `/practice/patients` → click `Petra Beispielfrau`.
- Seeded data for Petra: authorization "Verordnung Rückenbehandlung" 12 sessions with 1 usage, one completed and two scheduled appointments.
- Client panels stream in after navigation: `locator.count()` races — use `click({ timeout })` / `waitFor()` instead.
- Screenshots often catch the loading skeleton; `getByText(...).waitFor()` on real content first, then wait ~800ms, then screenshot.
- Scope authorization cards with `locator('[data-slot="card"]').filter({ hasText: "X von Y" })` (multiple cards per patient).
- Appointment completion: calendar list `/practice/calendar?view=list`, open UUID link, button `Als abgeschlossen markieren`.

## Worth probing

- Patient context must NOT reach `/practice/...` pages or `/practice/patients/[id]/documents/[docId]` (expect 307 redirect).
- Session adjustments require a reason; delta 0 is rejected server-side.
- `appointment_authorization_usages.appointment_id` is unique — same appointment can never be charged twice.
