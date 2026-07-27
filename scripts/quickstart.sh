#!/usr/bin/env bash
# Einmaliger lokaler Schnellstart zum Ausprobieren von PhysioCheck.
# Voraussetzungen (einmalig, siehe README.md "Voraussetzungen"):
# Node 22, pnpm, Docker Desktop (muss laufen), Supabase-CLI.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "PhysioCheck – lokaler Schnellstart (nur zum Testen, keine echten Daten)"
echo ""

for tool in node pnpm docker supabase; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "Fehlt: $tool. Siehe README.md, Abschnitt \"Voraussetzungen\"."
    exit 1
  fi
done

echo "1/5 Abhängigkeiten installieren…"
pnpm install

echo "2/5 Lokale Datenbank/Auth/Storage starten (Docker)…"
supabase start

if [ ! -f .env.local ]; then
  echo "3/5 .env.local wird automatisch aus der laufenden lokalen Supabase-Instanz erzeugt…"
  cp .env.example .env.local
  STATUS_ENV="$(supabase status -o env)"
  API_URL="$(echo "$STATUS_ENV" | grep '^API_URL=' | cut -d'=' -f2- | tr -d '"')"
  ANON_KEY="$(echo "$STATUS_ENV" | grep '^ANON_KEY=' | cut -d'=' -f2- | tr -d '"')"
  SERVICE_ROLE_KEY="$(echo "$STATUS_ENV" | grep '^SERVICE_ROLE_KEY=' | cut -d'=' -f2- | tr -d '"')"
  sed -i '' "s#^NEXT_PUBLIC_SUPABASE_URL=.*#NEXT_PUBLIC_SUPABASE_URL=${API_URL}#" .env.local
  sed -i '' "s#^NEXT_PUBLIC_SUPABASE_ANON_KEY=.*#NEXT_PUBLIC_SUPABASE_ANON_KEY=${ANON_KEY}#" .env.local
  sed -i '' "s#^SUPABASE_SERVICE_ROLE_KEY=.*#SUPABASE_SERVICE_ROLE_KEY=${SERVICE_ROLE_KEY}#" .env.local
else
  echo "3/5 .env.local existiert bereits – wird nicht verändert."
fi

echo "4/5 Migrationen anwenden + Demodaten anlegen…"
pnpm db:reset
pnpm seed

echo "5/5 Entwicklungsserver wird gestartet – http://localhost:3000"
echo "Demo-Logins/Einladungscode: siehe README.md, Abschnitt \"Demo-Konten\"."
echo ""
exec pnpm dev
