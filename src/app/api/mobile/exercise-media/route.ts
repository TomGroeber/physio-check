import { createSupabaseServiceClient } from "@/server/db/service-client";
import { authenticateMobileRequest, jsonError } from "@/server/services/mobile-auth";

const SIGNED_URL_SECONDS = 10 * 60;
const BUCKET = "exercise-media";

/**
 * Signierte Übungsmedien-URLs für die Patienten-App (D-059). Der
 * Storage-Bucket ist für Patienten bewusst gesperrt; hier gilt:
 * 1. Bearer-Authentifizierung.
 * 2. Das Plan-Item muss zum AKTUELLEN aktiven Plan des Benutzers
 *    gehören (Prüfung mit dem RLS-Client des Benutzers – fremde Items
 *    sind dort gar nicht sichtbar, zusätzlich wird die Zugehörigkeit
 *    explizit verifiziert).
 * 3. Erst dann signiert der Service-Client kurzlebige URLs.
 */
export async function GET(request: Request) {
  const auth = await authenticateMobileRequest(request);
  if (!auth) return jsonError("unauthorized", "Bitte melden Sie sich an.", 401);

  const planItemId = new URL(request.url).searchParams.get("planItemId");
  if (!planItemId) return jsonError("invalid_request", "planItemId fehlt.", 400);

  const { data: item } = await auth.supabase
    .from("exercise_plan_items")
    .select(
      `id, exercise_id, plan_version_id,
       exercise_plan_versions!inner (
         id,
         exercise_plans!exercise_plan_versions_plan_id_fkey!inner (
           patient_profile_id, status, current_version_id
         )
       )`
    )
    .eq("id", planItemId)
    .maybeSingle();

  const version = item?.exercise_plan_versions as unknown as {
    id: string;
    exercise_plans: {
      patient_profile_id: string;
      status: string;
      current_version_id: string | null;
    };
  } | null;
  const plan = version?.exercise_plans;
  if (
    !item ||
    !plan ||
    plan.patient_profile_id !== auth.user.id ||
    plan.status !== "active" ||
    plan.current_version_id !== version.id
  ) {
    return jsonError("not_found", "Übung nicht gefunden.", 404);
  }

  // Medienzeilen mit den RLS-Rechten des Patienten lesen.
  const { data: media } = await auth.supabase
    .from("exercise_media")
    .select("kind, storage_path")
    .eq("exercise_id", item.exercise_id)
    .in("kind", ["video", "thumbnail", "fallback_image", "captions"]);

  const service = createSupabaseServiceClient();
  const bucket = service.storage.from(BUCKET);
  const sign = async (kind: string) => {
    const path = (media ?? []).find((row) => row.kind === kind)?.storage_path;
    if (!path) return null;
    const { data } = await bucket.createSignedUrl(path, SIGNED_URL_SECONDS);
    return data?.signedUrl ?? null;
  };

  const [video, poster, alternate, captions] = await Promise.all([
    sign("video"),
    sign("thumbnail"),
    sign("fallback_image"),
    sign("captions"),
  ]);
  return Response.json({ video, poster, captions, alternate });
}
