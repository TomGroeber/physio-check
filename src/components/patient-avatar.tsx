"use client";

import { useState } from "react";
import { de } from "@/messages/de";

const sizeClasses = {
  sm: "size-10 text-sm",
  md: "size-14 text-lg",
  lg: "size-28 text-3xl",
} as const;

/** Initialen aus dem Namen, z. B. „Petra Beispielfrau“ → „PB“. */
export function avatarInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

/**
 * Rundes Profilbild mit fester Größe (kein Layout-Springen). Ohne Bild
 * oder bei einem Ladefehler erscheint automatisch ein neutraler
 * Platzhalter mit den Initialen – niemals ein fremdes Personenfoto.
 */
export function PatientAvatar({
  url,
  name,
  size = "md",
}: {
  url: string | null;
  name: string;
  size?: keyof typeof sizeClasses;
}) {
  // Fehlgeschlagene URL merken: eine neue URL (z. B. nach Ersetzen)
  // bekommt automatisch eine neue Ladechance, ohne Effekt-Reset.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = url !== null && url !== failedUrl;

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 font-bold text-primary ${sizeClasses[size]}`}
      role="img"
      aria-label={de.common.avatarAlt(name)}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- kurzlebige signierte Storage-URL.
        <img
          src={url}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFailedUrl(url)}
        />
      ) : (
        <span aria-hidden>{avatarInitials(name) || "•"}</span>
      )}
    </span>
  );
}
