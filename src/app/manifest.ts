import type { MetadataRoute } from "next";
import { branding } from "@/config/branding";

/**
 * PWA-Manifest (installierbare Web-App). Richtige App-Icons in
 * mehreren Größen folgen in Phase 4 (siehe docs/ROADMAP.md).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: branding.appName,
    short_name: branding.appShortName,
    description: branding.appDescription,
    start_url: "/",
    display: "standalone",
    background_color: "#faf8f3",
    theme_color: "#243b60",
    icons: [
      {
        src: branding.logoPath,
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
