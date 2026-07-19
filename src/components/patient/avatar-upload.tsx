"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  discardAvatarUploadAction,
  finalizeAvatarUploadAction,
  prepareAvatarUploadAction,
  removeAvatarAction,
} from "@/server/actions/avatar";
import { AVATAR_MIME_TYPES, MAX_AVATAR_MB, isAllowedAvatarSize } from "@/config/media";
import { uploadWithProgress } from "@/lib/upload-with-progress";
import { PatientAvatar } from "@/components/patient-avatar";
import { FormMessage } from "@/components/auth/form-message";
import { Button } from "@/components/ui/button";
import { de } from "@/messages/de";

const t = de.patient.profile.avatar;

/**
 * Profilbild im Patientenprofil: auswählen → Vorschau → hochladen,
 * ersetzen oder entfernen. Der Upload läuft über ein kurzlebiges
 * serverseitig autorisiertes Ticket direkt in den privaten Bucket;
 * sichtbar wird das Bild erst nach der Server-Finalisierung.
 */
export function AvatarUpload({
  avatarUrl,
  name,
}: {
  avatarUrl: string | null;
  name: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<{ error?: string; success?: string }>({});
  const [pending, startTransition] = useTransition();
  // Lokale Anzeige-URL: sofortige, zuverlässige Rückmeldung nach
  // Speichern/Entfernen, unabhängig vom Server-Re-Render (D-053).
  const [currentUrl, setCurrentUrl] = useState(avatarUrl);
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function chooseFile(nextFile: File | undefined) {
    setMessage({});
    setProgress(0);
    if (!nextFile) {
      setFile(null);
      return;
    }
    if (!(AVATAR_MIME_TYPES as readonly string[]).includes(nextFile.type)) {
      setFile(null);
      setMessage({ error: t.unsupportedType });
      return;
    }
    if (!isAllowedAvatarSize(nextFile.size)) {
      setFile(null);
      setMessage({ error: t.tooLarge(MAX_AVATAR_MB) });
      return;
    }
    setFile(nextFile);
  }

  function resetSelection() {
    setFile(null);
    setProgress(0);
    if (inputRef.current) inputRef.current.value = "";
  }

  function upload() {
    if (!file) return;
    startTransition(async () => {
      setMessage({});
      setProgress(0);
      const ticket = await prepareAvatarUploadAction({
        mimeType: file.type,
        declaredBytes: file.size,
      });
      if (!ticket.ok) {
        setMessage({ error: ticket.error });
        return;
      }
      try {
        await uploadWithProgress(ticket.signedUrl, file, setProgress);
        const result = await finalizeAvatarUploadAction({
          mimeType: file.type,
          storagePath: ticket.storagePath,
        });
        if (!result.ok) {
          setMessage({ error: result.error });
          return;
        }
        resetSelection();
        setCurrentUrl(result.avatarUrl);
        setMessage({ success: result.success });
        router.refresh();
      } catch (error) {
        await discardAvatarUploadAction({ storagePath: ticket.storagePath });
        setMessage({ error: error instanceof Error ? error.message : t.uploadFailed });
      }
    });
  }

  function remove() {
    if (!window.confirm(t.removeConfirm)) return;
    startTransition(async () => {
      setMessage({});
      const result = await removeAvatarAction();
      setMessage(result.ok ? { success: result.success } : { error: result.error });
      if (result.ok) {
        resetSelection();
        setCurrentUrl(null);
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-bold">{t.heading}</h3>
      <div className="flex items-center gap-5">
        {previewUrl ? (
          <span
            className="inline-flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted"
            role="img"
            aria-label={t.previewAlt}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- lokale Vorschau vor dem Upload. */}
            <img src={previewUrl} alt="" className="h-full w-full object-cover" />
          </span>
        ) : (
          <PatientAvatar url={currentUrl} name={name} size="lg" />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="text-base text-muted-foreground">{t.hint(MAX_AVATAR_MB)}</p>
          {previewUrl ? (
            <p className="text-base font-semibold">{t.previewHint}</p>
          ) : null}
        </div>
      </div>

      <FormMessage error={message.error} success={message.success} />
      {pending && progress > 0 ? (
        <div className="flex flex-col gap-1">
          <progress max={100} value={progress} className="h-3 w-full" />
          <p className="text-base">{t.progress(progress)}</p>
        </div>
      ) : null}

      <input
        ref={inputRef}
        id="avatar-file"
        type="file"
        accept={AVATAR_MIME_TYPES.join(",")}
        className="sr-only"
        onChange={(event) => chooseFile(event.target.files?.[0])}
        disabled={pending}
      />
      <div className="flex flex-col gap-2">
        {!file ? (
          <Button
            type="button"
            variant="outline"
            className="min-h-14 w-full text-lg"
            disabled={pending}
            onClick={() => inputRef.current?.click()}
          >
            {currentUrl ? t.replace : t.choose}
          </Button>
        ) : (
          <>
            <Button
              type="button"
              className="min-h-14 w-full text-lg"
              disabled={pending}
              onClick={upload}
            >
              {pending ? de.common.loading : t.save}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-14 w-full text-lg"
              disabled={pending}
              onClick={resetSelection}
            >
              {t.cancel}
            </Button>
          </>
        )}
        {currentUrl && !file ? (
          <Button
            type="button"
            variant="outline"
            className="min-h-14 w-full text-lg"
            disabled={pending}
            onClick={remove}
          >
            {t.remove}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
