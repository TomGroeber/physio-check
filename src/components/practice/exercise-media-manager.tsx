"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  discardExerciseMediaUploadAction,
  finalizeExerciseMediaUploadAction,
  prepareExerciseMediaUploadAction,
  removeExerciseMediaAction,
} from "@/server/actions/exercise-media";
import {
  MAX_CAPTIONS_KB,
  MAX_IMAGE_MB,
  MAX_VIDEO_MB,
  allowedMimeTypes,
  maxBytes,
  type UploadableMediaKind,
} from "@/config/media";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormMessage } from "@/components/auth/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { de } from "@/messages/de";

export type ExerciseMediaPreview = {
  id: string;
  kind: string;
  mimeType: string;
  sizeBytes: number;
  url: string | null;
};

const mediaKinds: UploadableMediaKind[] = [
  "video",
  "thumbnail",
  "fallback_image",
  "captions",
];

function normalizedMimeType(kind: UploadableMediaKind, file: File) {
  if (kind === "captions" && !file.type && file.name.toLowerCase().endsWith(".vtt")) {
    return "text/vtt";
  }
  return file.type;
}

/** Direkter Upload zum eng begrenzten Supabase-Ticket mit echtem Fortschritt. */
function uploadWithProgress(
  signedUrl: string,
  file: File,
  onProgress: (progress: number) => void
) {
  return new Promise<void>((resolve, reject) => {
    const body = new FormData();
    body.append("cacheControl", "3600");
    body.append("", file);
    const request = new XMLHttpRequest();
    request.open("PUT", signedUrl);
    request.setRequestHeader("x-upsert", "false");
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });
    request.addEventListener("load", () => {
      if (request.status >= 200 && request.status < 300) resolve();
      else reject(new Error("Der Upload zum Speicher ist fehlgeschlagen."));
    });
    request.addEventListener("error", () => reject(new Error("Netzwerkfehler beim Upload.")));
    request.addEventListener("abort", () => reject(new Error("Der Upload wurde abgebrochen.")));
    request.send(body);
  });
}

function ExistingPreview({
  media,
  posterUrl,
}: {
  media: ExerciseMediaPreview;
  posterUrl?: string | null;
}) {
  if (!media.url) return null;
  if (media.kind === "video") {
    return (
      <video controls preload="metadata" playsInline poster={posterUrl ?? undefined} className="w-full rounded-lg border bg-black">
        <source src={media.url} type={media.mimeType} />
        {de.patient.exercise.videoUnsupported}
      </video>
    );
  }
  if (media.kind === "thumbnail" || media.kind === "fallback_image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- signed storage URL has no stable loader host.
      <img src={media.url} alt="" className="max-h-56 w-full rounded-lg border object-contain" />
    );
  }
  return (
    <a href={media.url} target="_blank" rel="noreferrer" className="font-semibold text-primary underline">
      {de.practice.exercises.media.openCaptions}
    </a>
  );
}

function SelectedPreview({ kind, file, url }: { kind: UploadableMediaKind; file: File; url: string }) {
  if (kind === "video") {
    return <video controls preload="metadata" src={url} className="w-full rounded-lg border bg-black" />;
  }
  if (kind === "thumbnail" || kind === "fallback_image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- local blob preview.
      <img src={url} alt="" className="max-h-56 w-full rounded-lg border object-contain" />
    );
  }
  return <p className="text-sm text-muted-foreground">{file.name}</p>;
}

function MediaCard({
  exerciseId,
  kind,
  existing,
  posterUrl,
}: {
  exerciseId: string;
  kind: UploadableMediaKind;
  existing?: ExerciseMediaPreview;
  posterUrl?: string | null;
}) {
  const router = useRouter();
  const copy = de.practice.exercises.media;
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<{ error?: string; success?: string }>({});
  const [pending, startTransition] = useTransition();
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const label = copy.kind[kind];
  const limit = kind === "video" ? `${MAX_VIDEO_MB} MB` : kind === "captions" ? `${MAX_CAPTIONS_KB} KB` : `${MAX_IMAGE_MB} MB`;

  function chooseFile(nextFile: File | undefined) {
    setMessage({});
    setProgress(0);
    if (!nextFile) {
      setFile(null);
      return;
    }
    const mimeType = normalizedMimeType(kind, nextFile);
    if (!allowedMimeTypes(kind).includes(mimeType)) {
      setFile(null);
      setMessage({ error: copy.unsupportedType });
      return;
    }
    if (nextFile.size <= 0 || nextFile.size > maxBytes(kind)) {
      setFile(null);
      setMessage({ error: copy.tooLarge(limit) });
      return;
    }
    setFile(nextFile);
  }

  function upload() {
    if (!file) return;
    startTransition(async () => {
      setMessage({});
      setProgress(0);
      const mimeType = normalizedMimeType(kind, file);
      const ticket = await prepareExerciseMediaUploadAction({
        exerciseId,
        kind,
        mimeType,
        declaredBytes: file.size,
      });
      if (!ticket.ok) {
        setMessage({ error: ticket.error });
        return;
      }
      try {
        await uploadWithProgress(ticket.signedUrl, file, setProgress);
        const result = await finalizeExerciseMediaUploadAction({
          exerciseId,
          kind,
          mimeType,
          storagePath: ticket.storagePath,
        });
        if (!result.ok) {
          setMessage({ error: result.error });
          return;
        }
        setFile(null);
        setProgress(100);
        setMessage({ success: result.success });
        router.refresh();
      } catch (error) {
        await discardExerciseMediaUploadAction({ exerciseId, storagePath: ticket.storagePath });
        setMessage({ error: error instanceof Error ? error.message : copy.uploadFailed });
      }
    });
  }

  function remove() {
    if (!existing || !window.confirm(copy.removeConfirm(label))) return;
    startTransition(async () => {
      setMessage({});
      const result = await removeExerciseMediaAction({ exerciseId, mediaId: existing.id });
      setMessage(result.ok ? { success: result.success } : { error: result.error });
      if (result.ok) router.refresh();
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5">
        <div>
          <h3 className="text-lg font-bold">{label}</h3>
          <p className="text-sm text-muted-foreground">{copy.hint[kind](limit)}</p>
        </div>
        <FormMessage error={message.error} success={message.success} />
        {existing ? <ExistingPreview media={existing} posterUrl={posterUrl} /> : <p className="text-sm text-muted-foreground">{copy.none}</p>}
        <div className="flex flex-col gap-2">
          <Label htmlFor={`media-${kind}`}>{existing ? copy.chooseReplacement : copy.chooseFile}</Label>
          <Input
            id={`media-${kind}`}
            type="file"
            accept={allowedMimeTypes(kind).join(",") + (kind === "captions" ? ",.vtt" : "")}
            disabled={pending}
            onChange={(event) => chooseFile(event.target.files?.[0])}
          />
        </div>
        {file && previewUrl ? <SelectedPreview kind={kind} file={file} url={previewUrl} /> : null}
        {pending && progress > 0 ? (
          <div className="flex flex-col gap-1" aria-live="polite">
            <progress max={100} value={progress} className="h-3 w-full" />
            <p className="text-sm">{copy.progress(progress)}</p>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={upload} disabled={!file || pending}>
            {pending ? de.common.loading : existing ? copy.replace : copy.upload}
          </Button>
          {existing ? (
            <Button type="button" variant="outline" onClick={remove} disabled={pending}>
              {copy.remove}
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export function ExerciseMediaManager({
  exerciseId,
  media,
}: {
  exerciseId: string;
  media: ExerciseMediaPreview[];
}) {
  const byKind = new Map(media.map((item) => [item.kind, item]));
  const posterUrl = byKind.get("thumbnail")?.url;
  return (
    <section aria-labelledby="exercise-media-heading" className="flex flex-col gap-4">
      <div>
        <h2 id="exercise-media-heading" className="text-xl font-bold">{de.practice.exercises.media.heading}</h2>
        <p className="text-sm text-muted-foreground">{de.practice.exercises.media.securityHint}</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {mediaKinds.map((kind) => (
          <MediaCard
            key={kind}
            exerciseId={exerciseId}
            kind={kind}
            existing={byKind.get(kind)}
            posterUrl={posterUrl}
          />
        ))}
      </div>
    </section>
  );
}
