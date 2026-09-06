#!/usr/bin/env bash
# EIN Befehl, der wirklich alles startet: Docker, lokale Datenbank,
# Web-Server UND (falls Xcode vorhanden) den iOS-Simulator mit der
# nativen App. Für Tom gedacht: nichts hiervon muss von Hand bedient
# werden, jeder Schritt gibt aus, was gerade passiert.
# Voraussetzungen (einmalig, siehe README.md "Voraussetzungen"):
# Node 22, pnpm, Supabase-CLI. Docker Desktop wird bei Bedarf
# automatisch installiert (nur macOS + Homebrew) und gestartet.
set -euo pipefail
cd "$(dirname "$0")/.."
REPO_ROOT="$(pwd)"

echo "PhysioCheck – lokaler Schnellstart (nur zum Testen, keine echten Daten)"
echo ""

for tool in node pnpm supabase; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "Fehlt: $tool. Siehe README.md, Abschnitt \"Voraussetzungen\"."
    exit 1
  fi
done

echo "1/7 Docker prüfen…"
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

echo "2/7 Abhängigkeiten installieren (Website + native App + geteiltes Paket)…"
pnpm install

echo "3/7 Lokale Datenbank/Auth/Storage starten (Docker)…"
supabase start
STATUS_ENV="$(supabase status -o env)"
API_URL="$(echo "$STATUS_ENV" | grep '^API_URL=' | cut -d'=' -f2- | tr -d '"')"

if [ ! -f .env.local ]; then
  echo "4/7 .env.local (Website) wird automatisch aus der laufenden lokalen Supabase-Instanz erzeugt…"
  cp .env.example .env.local
  ANON_KEY="$(echo "$STATUS_ENV" | grep '^ANON_KEY=' | cut -d'=' -f2- | tr -d '"')"
  SERVICE_ROLE_KEY="$(echo "$STATUS_ENV" | grep '^SERVICE_ROLE_KEY=' | cut -d'=' -f2- | tr -d '"')"
  sed -i '' "s#^NEXT_PUBLIC_SUPABASE_URL=.*#NEXT_PUBLIC_SUPABASE_URL=${API_URL}#" .env.local
  sed -i '' "s#^NEXT_PUBLIC_SUPABASE_ANON_KEY=.*#NEXT_PUBLIC_SUPABASE_ANON_KEY=${ANON_KEY}#" .env.local
  sed -i '' "s#^SUPABASE_SERVICE_ROLE_KEY=.*#SUPABASE_SERVICE_ROLE_KEY=${SERVICE_ROLE_KEY}#" .env.local
else
  echo "4/7 .env.local (Website) existiert bereits – wird nicht verändert."
fi

MOBILE_ENV="apps/patient-mobile/.env"
if [ ! -f "$MOBILE_ENV" ]; then
  echo "   .env (native App) wird ebenfalls automatisch erzeugt…"
  cp apps/patient-mobile/.env.example "$MOBILE_ENV"
  # Neuere Supabase-CLI-Versionen nennen den Client-Schlüssel PUBLISHABLE_KEY,
  # ältere nur ANON_KEY (lokal derselbe Zweck) - beides abdecken, statt das
  # ganze Skript abzubrechen, falls eine der beiden Bezeichnungen fehlt.
  PUBLISHABLE_KEY="$(echo "$STATUS_ENV" | grep '^PUBLISHABLE_KEY=' | cut -d'=' -f2- | tr -d '"' || true)"
  if [ -z "$PUBLISHABLE_KEY" ]; then
    PUBLISHABLE_KEY="$(echo "$STATUS_ENV" | grep '^ANON_KEY=' | cut -d'=' -f2- | tr -d '"' || true)"
  fi
  sed -i '' "s#^EXPO_PUBLIC_SUPABASE_URL=.*#EXPO_PUBLIC_SUPABASE_URL=${API_URL}#" "$MOBILE_ENV"
  sed -i '' "s#^EXPO_PUBLIC_SUPABASE_KEY=.*#EXPO_PUBLIC_SUPABASE_KEY=${PUBLISHABLE_KEY}#" "$MOBILE_ENV"
else
  echo "   $MOBILE_ENV existiert bereits – wird nicht verändert."
fi

echo "5/7 Migrationen anwenden + Demodaten anlegen…"
pnpm db:reset
pnpm seed

echo "6/7 Website-Server wird in einem neuen Terminal-Fenster gestartet (http://localhost:3000)…"
echo "   (macOS fragt hierfür beim allerersten Mal evtl. einmalig um Erlaubnis, \"Terminal\" steuern zu dürfen - bitte erlauben.)"
osascript -e "tell application \"Terminal\" to do script \"cd '${REPO_ROOT}' && pnpm dev\"" >/dev/null

echo "7/7 Native App im iOS-Simulator wird in einem weiteren Terminal-Fenster gestartet…"
if command -v xcrun >/dev/null 2>&1 && xcrun simctl list >/dev/null 2>&1; then
  osascript -e "tell application \"Terminal\" to do script \"cd '${REPO_ROOT}' && pnpm mobile:ios\"" >/dev/null
else
  echo "   Xcode/iOS-Simulator wurde nicht gefunden – dieser Schritt wird übersprungen."
  echo "   Sobald Xcode installiert ist, reicht später: pnpm mobile:ios"
fi

echo ""
echo "Fertig! Es öffnen sich jetzt (oder sind bereits offen):"
echo "  - ein Terminal-Fenster mit dem Website-Server (http://localhost:3000)"
echo "  - ein Terminal-Fenster mit dem iOS-Simulator der nativen App (falls Xcode vorhanden)"
echo "Dieses Fenster hier wird nicht mehr gebraucht und kann geschlossen werden."
echo "Demo-Logins/Einladungscode: siehe README.md, Abschnitt \"Demo-Konten\"."
