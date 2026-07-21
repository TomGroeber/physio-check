import { createSupabaseServiceClient } from "@/server/db/service-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Unauthentifizierter Health-Check für Monitoring/Uptime-Prüfungen
 * (Phase 3, Deployment-Vorbereitung). Service-Role-Client, weil eine
 * reine Erreichbarkeitsprüfung nicht von einer angemeldeten Sitzung
 * abhängen darf und RLS hier absichtlich nicht das Ziel ist – es wird
 * nichts zurückgegeben außer "ok"/"error", keine Zeileninhalte.
 */
export async function GET() {
  try {
    const service = createSupabaseServiceClient();
    const { error } = await service.from("practices").select("id").limit(1);
    if (error) throw error;
    return Response.json({ status: "ok" });
  } catch (error) {
    console.error("[health] Datenbankprüfung fehlgeschlagen", error);
    return Response.json({ status: "error" }, { status: 503 });
  }
}
