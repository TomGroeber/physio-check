import { apiBaseUrl, supabase } from "./supabase";

export type ApiError = { code: string; message: string };

/**
 * Aufruf der abgesicherten /api/mobile-Endpunkte (D-059): Bearer-Token
 * der aktuellen Supabase-Session, strukturierte Fehler. Wird NUR für
 * Vorgänge genutzt, die der Client nicht selbst darf (signierte
 * Übungsmedien, Profilbild-Upload, Einladungsprüfung, Löschantrag).
 */
export async function apiFetch<T>(
  path: string,
  init: { method?: "GET" | "POST" | "DELETE"; body?: unknown } = {}
): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: init.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const payload = (await response.json().catch(() => null)) as
    | { error?: ApiError }
    | T
    | null;
  if (!response.ok) {
    const error =
      payload && typeof payload === "object" && "error" in payload
        ? (payload as { error?: ApiError }).error
        : undefined;
    throw new ApiRequestError(
      error?.code ?? `http_${response.status}`,
      error?.message ?? "Unbekannter Fehler"
    );
  }
  return payload as T;
}

export class ApiRequestError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}
