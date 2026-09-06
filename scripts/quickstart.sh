#!/usr/bin/env bash
# Einmaliger lokaler Schnellstart zum Ausprobieren von PhysioCheck.
# Voraussetzungen (einmalig, siehe README.md "Voraussetzungen"):
# Node 22, pnpm, Supabase-CLI. Docker Desktop wird von diesem Skript bei
# Bedarf automatisch installiert (nur macOS + Homebrew) und gestartet.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "PhysioCheck – lokaler Schnellstart (nur zum Testen, keine echten Daten)"
echo ""

for tool in node pnpm supabase; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "Fehlt: $tool. Siehe README.md, Abschnitt \"Voraussetzungen\"."
    exit 1
  fi
done

echo "1/6 Docker prüfen…"
if ! command -v docker >/dev/null 2>&1; then
  echo "   Docker ist nicht installiert."
  if command -v brew >/dev/null 2>&1; then
    echo "   Installiere Docker Desktop automatisch über Homebrew (einmalig, kann einige Minuten dauern)…"
    brew install --cask docker
  else
    echo "   Homebrew wurde nicht gefunden – automatische Installation nicht möglich."
    echo "   Bitte Docker Desktop manuell installieren: https://www.docker.com/products/docker-desktop/"
    echo "   Danach diesen Befehl erneut ausführen."
    exit 1
  fi
fi

if ! docker info >/dev/null 2>&1; then
  echo "   Docker läuft noch nicht – starte Docker Desktop…"
  open -a Docker
  echo -n "   Warte, bis Docker bereit ist"
  ready=false
  for _ in $(seq 1 60); do
    if docker info >/dev/null 2>&1; then
      ready=true
      break
    fi
    echo -n "."
    sleep 2
  done
  if [ "$ready" = true ]; then
    echo " fertig."
  else
    echo ""
    echo "   Docker ist nach 2 Minuten immer noch nicht bereit."
    echo "   Bitte Docker Desktop von Hand prüfen (evtl. erste Einrichtung/Berechtigung nötig) und diesen Befehl erneut ausführen."
    exit 1
  fi
else
  echo "   Docker läuft bereits."
fi

echo "2/6 Abhängigkeiten installieren…"
pnpm install

echo "3/6 Lokale Datenbank/Auth/Storage starten (Docker)…"
supabase start

if [ ! -f .env.local ]; then
  echo "4/6 .env.local wird automatisch aus der laufenden lokalen Supabase-Instanz erzeugt…"
  cp .env.example .env.local
  STATUS_ENV="$(supabase status -o env)"
  API_URL="$(echo "$STATUS_ENV" | grep '^API_URL=' | cut -d'=' -f2- | tr -d '"')"
  ANON_KEY="$(echo "$STATUS_ENV" | grep '^ANON_KEY=' | cut -d'=' -f2- | tr -d '"')"
  SERVICE_ROLE_KEY="$(echo "$STATUS_ENV" | grep '^SERVICE_ROLE_KEY=' | cut -d'=' -f2- | tr -d '"')"
  sed -i '' "s#^NEXT_PUBLIC_SUPABASE_URL=.*#NEXT_PUBLIC_SUPABASE_URL=${API_URL}#" .env.local
  sed -i '' "s#^NEXT_PUBLIC_SUPABASE_ANON_KEY=.*#NEXT_PUBLIC_SUPABASE_ANON_KEY=${ANON_KEY}#" .env.local
  sed -i '' "s#^SUPABASE_SERVICE_ROLE_KEY=.*#SUPABASE_SERVICE_ROLE_KEY=${SERVICE_ROLE_KEY}#" .env.local
else
  echo "4/6 .env.local existiert bereits – wird nicht verändert."
fi

echo "5/6 Migrationen anwenden + Demodaten anlegen…"
pnpm db:reset
pnpm seed

echo "6/6 Entwicklungsserver wird gestartet – http://localhost:3000"
echo "Demo-Logins/Einladungscode: siehe README.md, Abschnitt \"Demo-Konten\"."
echo ""
exec pnpm dev
