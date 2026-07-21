import type { NextConfig } from "next";

/**
 * Sicherheits-Header: Die Content-Security-Policy braucht eine pro
 * Request neue Nonce (Next-eigene Hydrations-Skripte sind inline) und
 * wird deshalb in `src/proxy.ts` gesetzt, nicht hier statisch – siehe
 * Kommentar dort. Diese Konfiguration bleibt bewusst ohne `headers()`,
 * damit es nur EINE Quelle der Wahrheit für Sicherheits-Header gibt.
 */
const nextConfig: NextConfig = {
  // Das geteilte Paket liegt als TypeScript-Quelle im Workspace (D-059).
  transpilePackages: ["@physio-check/shared"],
};

export default nextConfig;
