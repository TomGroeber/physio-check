# PhysioCheck – Deployment-Vorbereitung (Web)

> Stand: 2026-07-21. Dieses Dokument bereitet das Produktions-Deployment vor, **ohne** ein Hosting/Supabase-Konto anzulegen, eine Domain zu registrieren oder Geld auszugeben – das bleibt Toms Entscheidung (Master-Prompt Abschnitt 2). Ziel: Wenn Tom Konto + Variablen bereitstellt, sind nur noch wenige, klar benannte Schritte nötig.

## 1. Was Tom entscheiden/anlegen muss (nicht vorwegnehmbar)

1. **Supabase-Projekt** (Staging + Produktion, EU-Region z. B. Frankfurt – Pflicht laut `docs/ARCHITECTURE.md` Punkt 8). Zahlung ab Pro-Plan je nach Bedarf.
2. **Hosting-Anbieter** für die Next.js-App. Next.js 16 App Router mit Server Actions läuft am reibungslosesten auf Vercel (selber Hersteller), funktioniert aber auch auf jedem Node-fähigen Host (Fly.io, Railway, eigener Server mit `pnpm build && pnpm start`). Diese Wahl ist bewusst offen gelassen.
3. **Domain** (für Produktions-URL, Redirect-Allowlist, `apple-app-site-association`/`assetlinks.json` für Universal/App Links).
4. **SMTP-Anbieter** für Supabase Auth E-Mails (z. B. Postmark, Resend) – lokal übernimmt das Mailpit.
5. **Fehlerüberwachungsdienst** (optional, siehe Abschnitt 4) – nur falls Tom einen möchte.

Keiner dieser Punkte wird ohne Toms ausdrückliche Zustimmung angelegt oder bezahlt.

## 2. Umgebungsvariablen (vollständige Liste)

Alle Variablen aus `.env.example`, gruppiert nach Sichtbarkeit. **Nie** einen `NEXT_PUBLIC_`-Prefix vor den Service-Role-Key setzen – das macht ihn browserseitig sichtbar.

| Variable | Sichtbarkeit | Quelle | Zweck |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | öffentlich | Supabase-Projekt-Dashboard | Client- und Server-Verbindung |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | öffentlich | Supabase-Projekt-Dashboard | Anon-Client (RLS-begrenzt, siehe D-012) |
| `SUPABASE_SERVICE_ROLE_KEY` | **geheim, nur Server** | Supabase-Projekt-Dashboard | Umgeht RLS; nur in eng begrenzten Server-Services verwendet (siehe Code-Kommentare an jeder Verwendungsstelle) |
| `NEXT_PUBLIC_APP_URL` | öffentlich | Domain-Entscheidung | Basis für Bestätigungs-/Einladungslinks |
| `MALWARE_SCAN_ENABLED` | serverseitig | Deployment-Entscheidung | `true`, sobald ein produktionsfähiger Scan-Weg (`clamd`-Daemon oder Cloud-AV, siehe `docs/PRIVACY_SECURITY.md`) existiert |
| `OBSIDIAN_VAULT_PATH` | nur lokal (Toms Mac) | – | **Nicht** in Produktion setzen; nur für `pnpm docs:sync` |

Zusätzlich in Supabase selbst zu konfigurieren (kein Repo-Secret, sondern Projekt-Dashboard-Einstellung): SMTP-Zugangsdaten, Redirect-URL-Allowlist (Produktionsdomain statt `localhost`), JWT-Ablaufzeiten (Standardwerte prüfen).

## 3. Rollout-Schritte (sobald Projekt + Hosting existieren)

1. Supabase-Projekt anlegen (EU-Region), lokale Migrationen anwenden: `supabase link --project-ref <ref>` dann `supabase db push` (wendet alle 25 Migrationen in derselben Reihenfolge an wie `supabase db reset` lokal – bereits reproduzierbar getestet, siehe `docs/TEST_MATRIX.md`).
2. **Keine Seed-Daten in Produktion ausführen** – `scripts/seed.ts` legt Demo-Konten mit bekanntem Passwort an und ist ausschließlich für lokale Entwicklung/CI gedacht.
3. Umgebungsvariablen aus Abschnitt 2 im Hosting-Anbieter hinterlegen (als Secret, nicht im Repo).
4. SMTP in Supabase Auth konfigurieren, Redirect-URLs auf die echte Domain setzen.
5. Deployment auslösen (`pnpm build && pnpm start` bzw. die Vercel-Standardpipeline).
6. `GET /api/health` prüfen (siehe Abschnitt 4) – muss `{"status":"ok"}` liefern, bevor DNS/Traffic umgeschaltet wird.
7. Malware-Scan-Architekturentscheidung treffen (siehe `docs/PRIVACY_SECURITY.md`, Ergänzung 2026-07-21) und erst danach `MALWARE_SCAN_ENABLED=true` setzen.

## 4. Monitoring-Konzept (anbieterneutral, jetzt vorbereitet)

- **Health-Check-Route:** `GET /api/health` (`src/app/api/health/route.ts`) – unauthentifiziert, prüft echte Datenbankerreichbarkeit über den Service-Role-Client, gibt ausschließlich `{"status":"ok"}` oder `{"status":"error"}` zurück (nie Zeileninhalte, nie Gesundheitsdaten). Für jeden Uptime-Monitor geeignet (z. B. UptimeRobot, Better Stack, oder die Health-Check-Funktion des Hosting-Anbieters selbst).
- **Fehlerüberwachung:** Kein SDK ist eingebunden (bewusst – siehe `docs/PRIVACY_SECURITY.md` Abschnitt 1a, das vereinfacht die Store-Datenschutz-Angaben). Falls Tom einen Dienst möchte (z. B. Sentry), gilt zwingend: **niemals** Gesundheitsdaten, Schmerzangaben, Übungsnamen oder Patientennamen in Fehlermeldungen/Breadcrumbs – nur technische Stacktraces und Routennamen. Das ist eine Erweiterung, kein aktueller Zustand.
- **Alarmierung:** An den gewählten Uptime-Monitor koppeln (E-Mail/SMS/Slack je nach Dienst) – Anbieterwahl bleibt offen.

## 5. Was NICHT vorbereitet werden kann ohne Kontoentscheidung

Backup-/Restore-Konfiguration (setzt gehostetes Projekt voraus), TLS-Zertifikat/Redirect-Allowlist (setzt Domain voraus), tatsächliche Secret-Ablage (setzt Hosting-Anbieter voraus). Siehe `docs/RELEASE_READINESS.md` Bereich A3 für den vollständigen Blockierstatus.
