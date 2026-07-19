/**
 * Direkter Browser-Upload zu einer eng begrenzten signierten
 * Supabase-Upload-URL mit echtem Fortschritt (XHR, weil fetch keinen
 * Upload-Fortschritt liefert). Client-sicher, ohne Schlüssel.
 */
export function uploadWithProgress(
  signedUrl: string,
  file: File,
  onProgress: (progress: number) => void
): Promise<void> {
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
