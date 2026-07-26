import "server-only";

import { createSupabaseServerClient } from "@/server/db/server-client";
import { createSupabaseServiceClient } from "@/server/db/service-client";
import { assertPlatformAdmin } from "@/server/services/platform-admin-auth";
import type { PracticeSettings } from "@/lib/validation/platform-admin";
import { defaultFeatureFlags, featureFlagsSchema } from "@/lib/validation/platform-admin";

/**
 * Datenzugriff für das Betreiberportal. Jede exportierte Funktion
 * prüft ZUERST is_platform_admin() über die Sitzung des angemeldeten
 * Nutzers (assertPlatformAdmin) und erzeugt DANACH – nur für lesende
 * Mehr-Mandanten-Abfragen, für die es bewusst keine client-seitige
 * RLS-Policy gibt – einen Service-Role-Client. Schreibvorgänge laufen
 * dagegen über die SECURITY-DEFINER-RPCs (supabase/migrations/
 * 20260725140000_platform_admin_write_rpcs.sql) mit der normalen
 * Sitzung, nicht über Service-Role (siehe Kommentare dort).
 */

export type PracticeStatus = "trial" | "active" | "suspended" | "archived";

export type PlatformDashboard = {
  practiceCountsByStatus: Record<PracticeStatus, number>;
  trialsEndingSoon: { id: string; name: string; trialEndsAt: string }[];
  activeStaffCount: number;
  connectedPatientsCount: number;
  practicesWithoutActiveAdmin: { id: string; name: string }[];
  recentAuditEvents: {
    id: string;
    eventType: string;
    entityType: string;
    practiceId: string | null;
    practiceName: string | null;
    createdAt: string;
  }[];
};

export async function getPlatformDashboard(): Promise<PlatformDashboard> {
  await assertPlatformAdmin();
  const service = createSupabaseServiceClient();

  const [
    practicesResult,
    staffCountResult,
    patientLinksResult,
    auditResult,
  ] = await Promise.all([
    service.from("practices").select("id, name, status, trial_ends_at"),
    service
      .from("practice_members")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
    service
      .from("patient_practice_links")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    service
      .from("audit_events")
      .select("id, event_type, entity_type, practice_id, created_at, practices ( name )")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const practices = practicesResult.data ?? [];
  const practiceCountsByStatus: Record<PracticeStatus, number> = {
    trial: 0,
    active: 0,
    suspended: 0,
    archived: 0,
  };
  for (const practice of practices) {
    practiceCountsByStatus[practice.status] += 1;
  }

  const in14Days = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  const trialsEndingSoon = practices
    .filter(
      (p) =>
        p.status === "trial" &&
        p.trial_ends_at &&
        p.trial_ends_at <= in14Days
    )
    .map((p) => ({ id: p.id, name: p.name, trialEndsAt: p.trial_ends_at! }))
    .sort((a, b) => a.trialEndsAt.localeCompare(b.trialEndsAt));

  // Praxis ohne aktiven Admin: datensparsame Prüfung über eine
  // gezielte Zählabfrage statt vollständiger Mitgliederliste.
  const activePractices = practices.filter((p) => p.status !== "archived");
  const adminCounts = await Promise.all(
    activePractices.map(async (practice) => {
      const { count } = await service
        .from("practice_members")
        .select("id", { count: "exact", head: true })
        .eq("practice_id", practice.id)
        .eq("role", "admin")
        .eq("is_active", true);
      return { id: practice.id, name: practice.name, adminCount: count ?? 0 };
    })
  );
  const practicesWithoutActiveAdmin = adminCounts
    .filter((p) => p.adminCount === 0)
    .map((p) => ({ id: p.id, name: p.name }));

  const recentAuditEvents = (auditResult.data ?? []).map((event) => ({
    id: event.id,
    eventType: event.event_type,
    entityType: event.entity_type,
    practiceId: event.practice_id,
    practiceName: event.practices?.name ?? null,
    createdAt: event.created_at,
  }));

  return {
    practiceCountsByStatus,
    trialsEndingSoon,
    activeStaffCount: staffCountResult.count ?? 0,
    connectedPatientsCount: patientLinksResult.count ?? 0,
    practicesWithoutActiveAdmin,
    recentAuditEvents,
  };
}

export type PracticeListItem = {
  id: string;
  name: string;
  status: PracticeStatus;
  country: string;
  trialEndsAt: string | null;
  createdAt: string;
  activeStaffCount: number;
  connectedPatientsCount: number;
};

export async function listPracticesForAdmin(params: {
  query: string;
  status: PracticeStatus | "all";
  country: string;
}): Promise<PracticeListItem[]> {
  await assertPlatformAdmin();
  const service = createSupabaseServiceClient();

  let queryBuilder = service
    .from("practices")
    .select("id, name, status, address_city, created_at, trial_ends_at")
    .order("created_at", { ascending: false });

  if (params.status !== "all") {
    queryBuilder = queryBuilder.eq("status", params.status);
  }
  if (params.query.trim()) {
    queryBuilder = queryBuilder.ilike("name", `%${params.query.trim()}%`);
  }

  const { data } = await queryBuilder;
  const practices = data ?? [];

  const withCounts = await Promise.all(
    practices.map(async (practice) => {
      const [staffResult, patientsResult] = await Promise.all([
        service
          .from("practice_members")
          .select("id", { count: "exact", head: true })
          .eq("practice_id", practice.id)
          .eq("is_active", true),
        service
          .from("patient_practice_links")
          .select("id", { count: "exact", head: true })
          .eq("practice_id", practice.id)
          .eq("status", "active"),
      ]);
      return {
        id: practice.id,
        name: practice.name,
        status: practice.status,
        country: practice.address_city ?? "",
        trialEndsAt: practice.trial_ends_at,
        createdAt: practice.created_at,
        activeStaffCount: staffResult.count ?? 0,
        connectedPatientsCount: patientsResult.count ?? 0,
      };
    })
  );

  return withCounts;
}

export type PracticeDetailForAdmin = {
  id: string;
  name: string;
  addressStreet: string;
  addressPostalCode: string;
  addressCity: string;
  phone: string;
  timezone: string;
  supportEmail: string;
  supportUrl: string;
  status: PracticeStatus;
  trialEndsAt: string | null;
  internalNote: string;
  createdAt: string;
  settings: Partial<PracticeSettings>;
  members: {
    id: string;
    profileId: string;
    fullName: string;
    role: "admin" | "therapist";
    isActive: boolean;
  }[];
  openInvites: {
    id: string;
    email: string;
    role: "admin" | "therapist";
    expiresAt: string;
    createdAt: string;
  }[];
  connectedPatientsCount: number;
};

export async function getPracticeDetailForAdmin(
  practiceId: string
): Promise<PracticeDetailForAdmin | null> {
  await assertPlatformAdmin();
  const service = createSupabaseServiceClient();

  const [practiceResult, membersResult, invitesResult, patientsResult] = await Promise.all([
    service
      .from("practices")
      .select(
        "id, name, address_street, address_postal_code, address_city, phone, timezone, support_email, support_url, status, trial_ends_at, internal_note, created_at, settings"
      )
      .eq("id", practiceId)
      .maybeSingle(),
    service
      .from("practice_members")
      .select("id, profile_id, role, is_active, profiles ( full_name )")
      .eq("practice_id", practiceId)
      .order("created_at"),
    service
      .from("staff_invites")
      .select("id, email, role, expires_at, created_at")
      .eq("practice_id", practiceId)
      .is("revoked_at", null)
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false }),
    service
      .from("patient_practice_links")
      .select("id", { count: "exact", head: true })
      .eq("practice_id", practiceId)
      .eq("status", "active"),
  ]);

  if (!practiceResult.data) return null;
  const practice = practiceResult.data;

  return {
    id: practice.id,
    name: practice.name,
    addressStreet: practice.address_street,
    addressPostalCode: practice.address_postal_code,
    addressCity: practice.address_city,
    phone: practice.phone,
    timezone: practice.timezone,
    supportEmail: practice.support_email,
    supportUrl: practice.support_url,
    status: practice.status,
    trialEndsAt: practice.trial_ends_at,
    internalNote: practice.internal_note,
    createdAt: practice.created_at,
    settings: (practice.settings as Partial<PracticeSettings>) ?? {},
    members: (membersResult.data ?? []).map((m) => ({
      id: m.id,
      profileId: m.profile_id,
      fullName: m.profiles?.full_name ?? "",
      role: m.role,
      isActive: m.is_active,
    })),
    openInvites: (invitesResult.data ?? []).map((i) => ({
      id: i.id,
      email: i.email,
      role: i.role,
      expiresAt: i.expires_at,
      createdAt: i.created_at,
    })),
    connectedPatientsCount: patientsResult.count ?? 0,
  };
}

export async function updatePracticeProfileAsPlatformAdmin(
  practiceId: string,
  input: {
    name: string;
    addressStreet: string;
    addressPostalCode: string;
    addressCity: string;
    phone: string;
    timezone: string;
    supportEmail: string;
    supportUrl: string;
  }
): Promise<boolean> {
  await assertPlatformAdmin();
  const service = createSupabaseServiceClient();
  const { error } = await service
    .from("practices")
    .update({
      name: input.name,
      address_street: input.addressStreet,
      address_postal_code: input.addressPostalCode,
      address_city: input.addressCity,
      phone: input.phone,
      timezone: input.timezone,
      support_email: input.supportEmail,
      support_url: input.supportUrl,
    })
    .eq("id", practiceId);
  return !error;
}

export async function setPracticeLifecycle(
  practiceId: string,
  input: { status: PracticeStatus; trialEndsAt: string | null; internalNote: string }
): Promise<boolean> {
  await assertPlatformAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("set_practice_lifecycle", {
    p_practice_id: practiceId,
    p_status: input.status,
    p_trial_ends_at: input.trialEndsAt ?? undefined,
    p_internal_note: input.internalNote,
  });
  return !error;
}

export async function setPracticeMemberStatus(
  memberId: string,
  role: "admin" | "therapist",
  isActive: boolean
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("set_practice_member_status", {
    p_member_id: memberId,
    p_role: role,
    p_is_active: isActive,
  });
  if (error) {
    if (error.message.includes("last_practice_admin_protected")) {
      return { ok: false, reason: "last_admin_protected" };
    }
    return { ok: false, reason: "failed" };
  }
  return { ok: true };
}

export type PlatformConfig = {
  productName: string;
  supportEmail: string;
  supportUrl: string;
  privacyUrl: string;
  imprintUrl: string;
  maintenanceActive: boolean;
  maintenanceMessage: string;
  defaultNewPracticeTimezone: string;
  defaultNewPracticeLocale: string;
  maxUploadMb: number;
  featureFlags: ReturnType<typeof featureFlagsSchema.parse>;
  updatedAt: string;
};

export async function getPlatformConfig(): Promise<PlatformConfig> {
  await assertPlatformAdmin();
  const service = createSupabaseServiceClient();
  const { data } = await service.from("platform_config").select("*").eq("id", 1).single();

  const parsedFlags = featureFlagsSchema.safeParse(data?.feature_flags ?? {});

  return {
    productName: data?.product_name ?? "PhysioCheck",
    supportEmail: data?.support_email ?? "",
    supportUrl: data?.support_url ?? "",
    privacyUrl: data?.privacy_url ?? "",
    imprintUrl: data?.imprint_url ?? "",
    maintenanceActive: data?.maintenance_active ?? false,
    maintenanceMessage: data?.maintenance_message ?? "",
    defaultNewPracticeTimezone: data?.default_new_practice_timezone ?? "Europe/Luxembourg",
    defaultNewPracticeLocale: data?.default_new_practice_locale ?? "de",
    maxUploadMb: data?.max_upload_mb ?? 5,
    featureFlags: parsedFlags.success ? parsedFlags.data : defaultFeatureFlags,
    updatedAt: data?.updated_at ?? new Date().toISOString(),
  };
}

/** Ruft den bestehenden, unauthentifizierten Health-Check auf (kein neuer Prüfweg). */
export async function getSystemHealthStatus(): Promise<"ok" | "error"> {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const response = await fetch(`${appUrl}/api/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return "error";
    const data = (await response.json()) as { status?: string };
    return data.status === "ok" ? "ok" : "error";
  } catch {
    return "error";
  }
}

/** Öffentlich unbedenkliche Teilmenge (Wartungshinweis) für alle Layouts. */
export async function getPublicMaintenanceBanner(): Promise<{
  active: boolean;
  message: string;
} | null> {
  const service = createSupabaseServiceClient();
  const { data } = await service
    .from("platform_config")
    .select("maintenance_active, maintenance_message")
    .eq("id", 1)
    .maybeSingle();
  if (!data?.maintenance_active) return null;
  return { active: true, message: data.maintenance_message };
}

export async function updatePlatformConfig(input: {
  productName: string;
  supportEmail: string;
  supportUrl: string;
  privacyUrl: string;
  imprintUrl: string;
  maintenanceActive: boolean;
  maintenanceMessage: string;
  defaultNewPracticeTimezone: string;
  defaultNewPracticeLocale: string;
  maxUploadMb: number;
}): Promise<boolean> {
  await assertPlatformAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("update_platform_config", {
    p_config: {
      productName: input.productName,
      supportEmail: input.supportEmail,
      supportUrl: input.supportUrl,
      privacyUrl: input.privacyUrl,
      imprintUrl: input.imprintUrl,
      maintenanceActive: input.maintenanceActive,
      maintenanceMessage: input.maintenanceMessage,
      defaultNewPracticeTimezone: input.defaultNewPracticeTimezone,
      defaultNewPracticeLocale: input.defaultNewPracticeLocale,
      maxUploadMb: input.maxUploadMb,
    },
  });
  return !error;
}

export async function updatePlatformFeatureFlags(
  flags: ReturnType<typeof featureFlagsSchema.parse>
): Promise<boolean> {
  await assertPlatformAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("update_platform_feature_flags", {
    p_flags: flags,
  });
  return !error;
}
