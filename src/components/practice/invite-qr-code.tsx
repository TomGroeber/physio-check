"use client";

import { useEffect, useState } from "react";
import { toDataURL } from "qrcode";
import { de } from "@/messages/de";

/**
 * QR-Code für den Einladungslink. Wird vollständig lokal im Browser
 * erzeugt (keine externen Dienste) – der Link enthält nur den
 * Einladungscode, keine Personen- oder Gesundheitsdaten.
 */
export function InviteQrCode({ link }: { link: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    toDataURL(link, { width: 240, margin: 2 })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [link]);

  if (!dataUrl) return null;

  return (
    <figure className="flex flex-col items-center gap-2 rounded-xl border bg-white p-4">
      {/* eslint-disable-next-line @next/next/no-img-element -- lokale Data-URL, kein Optimierungsbedarf */}
      <img src={dataUrl} alt={de.practice.patients.qrAlt} width={240} height={240} />
      <figcaption className="text-center text-sm text-muted-foreground">
        {de.practice.patients.qrHint}
      </figcaption>
    </figure>
  );
}
