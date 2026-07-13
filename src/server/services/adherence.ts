import "server-only";

import {
  buildAdherenceAnalytics,
  dateRangeEnding,
  type AnalyticsLog,
  type AnalyticsPlanItem,
} from "@/lib/adherence-analytics";
import { todayInTimeZone } from "@/lib/datetime";
import { branding } from "@/config/branding";
import { de } from "@/messages/de";
import { createSupabaseServerClient } from "@/server/db/server-client";

function mapLog(log: {
  id: string;
  plan_item_id: string;
  performed_on: string;
  performed_at: string;
  status: AnalyticsLog["status"];
  pain_before: number | null;
  pain_after: number | null;
  reviewed_at: string | null;
}): AnalyticsLog {
  return {
    id: log.id,
    planItemId: log.plan_item_id,
    performedOn: log.performed_on,
    performedAt: log.performed_at,
    status: log.status,
    painBefore: log.pain_before,
    painAfter: log.pain_after,
    reviewedAt: log.reviewed_at,
  };
}

export async function getPatientAdherenceAnalytics(
  practiceId: string,
  patientId: string,
  days: number
) {
  const supabase = await createSupabaseServerClient();
  const { data: plan, error: planError } = await supabase
    .from("exercise_plans")
    .select("id, current_version_id, practices ( timezone )")
    .eq("practice_id", practiceId)
    .eq("patient_profile_id", patientId)
    .eq("status", "active")
    .maybeSingle();
  if (planError) throw new Error(de.practice.analytics.loadError);

  const timezone = plan?.practices?.timezone ?? branding.defaultTimeZone;
  const range = dateRangeEnding(todayInTimeZone(timezone), days);
  if (!plan?.current_version_id) {
    return {
      planId: null,
      range,
      latestOverallAt: null,
      ...buildAdherenceAnalytics([], [], range.start, range.end),
    };
  }

  const { data: itemRows, error: itemError } = await supabase
    .from("exercise_plan_items")
    .select("id, exercise_id, start_date, end_date, schedule, exercises ( title )")
    .eq("plan_version_id", plan.current_version_id)
    .order("sort_order");
  if (itemError) throw new Error(de.practice.analytics.loadError);
  const itemIds = (itemRows ?? []).map((item) => item.id);

  const [{ data: logRows, error: logError }, { data: latestRows }] = itemIds.length
    ? await Promise.all([
        supabase
          .from("completion_logs")
          .select(
            "id, plan_item_id, performed_on, performed_at, status, pain_before, pain_after, reviewed_at"
          )
          .eq("patient_profile_id", patientId)
          .in("plan_item_id", itemIds)
          .gte("performed_on", range.start)
          .lte("performed_on", range.end),
        supabase
          .from("completion_logs")
          .select("performed_at")
          .eq("patient_profile_id", patientId)
          .in("plan_item_id", itemIds)
          .order("performed_at", { ascending: false })
          .limit(1),
      ])
    : [{ data: [], error: null }, { data: [] }];
  if (logError) throw new Error(de.practice.analytics.loadError);

  const items: AnalyticsPlanItem[] = (itemRows ?? []).map((item) => ({
    id: item.id,
    exerciseId: item.exercise_id,
    exerciseTitle: item.exercises?.title ?? de.practice.plans.unknownExercise,
    startDate: item.start_date,
    endDate: item.end_date,
    schedule: item.schedule,
  }));
  const analytics = buildAdherenceAnalytics(
    items,
    (logRows ?? []).map(mapLog),
    range.start,
    range.end
  );
  return {
    planId: plan.id,
    range,
    latestOverallAt: latestRows?.[0]?.performed_at ?? null,
    ...analytics,
  };
}

/** Bulk dashboard overview without per-patient query fan-out. */
export async function getPracticeAdherenceOverview(practiceId: string, days: number) {
  const supabase = await createSupabaseServerClient();
  const [{ data: linkRows, error: linkError }, { data: planRows, error: planError }] =
    await Promise.all([
      supabase
        .from("patient_practice_links")
        .select("patient_profile_id, patient:profiles!inner ( full_name )")
        .eq("practice_id", practiceId)
        .eq("status", "active"),
      supabase
        .from("exercise_plans")
        .select("id, patient_profile_id, current_version_id, practices ( timezone )")
        .eq("practice_id", practiceId)
        .eq("status", "active"),
    ]);
  if (linkError || planError) throw new Error(de.practice.analytics.loadError);

  const versions = (planRows ?? [])
    .map((plan) => plan.current_version_id)
    .filter((id): id is string => Boolean(id));
  const { data: itemRows, error: itemError } = versions.length
    ? await supabase
        .from("exercise_plan_items")
        .select("id, plan_version_id, exercise_id, start_date, end_date, schedule, exercises ( title )")
        .in("plan_version_id", versions)
    : { data: [], error: null };
  if (itemError) throw new Error(de.practice.analytics.loadError);

  const itemIds = (itemRows ?? []).map((item) => item.id);
  const { data: logRows, error: logError } = itemIds.length
    ? await supabase
        .from("completion_logs")
        .select(
          "id, patient_profile_id, plan_item_id, performed_on, performed_at, status, pain_before, pain_after, reviewed_at"
        )
        .in("plan_item_id", itemIds)
        .order("performed_at", { ascending: false })
        .limit(5000)
    : { data: [], error: null };
  if (logError) throw new Error(de.practice.analytics.loadError);

  const planByPatient = new Map((planRows ?? []).map((plan) => [plan.patient_profile_id, plan]));
  const itemsByVersion = new Map<string, AnalyticsPlanItem[]>();
  for (const item of itemRows ?? []) {
    const mapped: AnalyticsPlanItem = {
      id: item.id,
      exerciseId: item.exercise_id,
      exerciseTitle: item.exercises?.title ?? de.practice.plans.unknownExercise,
      startDate: item.start_date,
      endDate: item.end_date,
      schedule: item.schedule,
    };
    itemsByVersion.set(item.plan_version_id, [
      ...(itemsByVersion.get(item.plan_version_id) ?? []),
      mapped,
    ]);
  }

  const overview = (linkRows ?? []).map((link) => {
    const plan = planByPatient.get(link.patient_profile_id);
    const timezone = plan?.practices?.timezone ?? branding.defaultTimeZone;
    const range = dateRangeEnding(todayInTimeZone(timezone), days);
    const items = plan?.current_version_id
      ? itemsByVersion.get(plan.current_version_id) ?? []
      : [];
    const itemIdSet = new Set(items.map((item) => item.id));
    const patientLogs = (logRows ?? [])
      .filter(
        (log) =>
          log.patient_profile_id === link.patient_profile_id && itemIdSet.has(log.plan_item_id)
      )
      .map(mapLog);
    const analytics = buildAdherenceAnalytics(items, patientLogs, range.start, range.end);
    return {
      patientId: link.patient_profile_id,
      patientName: link.patient?.full_name ?? de.practice.analytics.unknownPatient,
      planId: plan?.id ?? null,
      latestOverallAt: patientLogs[0]?.performedAt ?? null,
      inactive: analytics.planned > 0 && analytics.documented === 0,
      ...analytics,
    };
  });

  return overview.sort(
    (a, b) =>
      b.unread - a.unread ||
      Number(b.inactive) - Number(a.inactive) ||
      a.patientName.localeCompare(b.patientName, "de")
  );
}
