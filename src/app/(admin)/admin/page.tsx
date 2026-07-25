import type { Metadata } from "next";
import Link from "next/link";
import { getPlatformDashboard, getSystemHealthStatus } from "@/server/services/platform-admin";
import { GlassPanel, GlassPanelDescription, GlassPanelHeader, GlassPanelTitle } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";
import { de } from "@/messages/de";
import { formatDateShort } from "@/lib/datetime";
import { branding } from "@/config/branding";

export const metadata: Metadata = { title: de.admin.dashboard.title };

const t = de.admin.dashboard;

function formatAdminDate(iso: string): string {
  return formatDateShort(new Date(iso), branding.defaultTimeZone);
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <GlassPanel tinted className="flex flex-col gap-1">
      <span className="text-3xl font-bold tabular-nums text-foreground">{value}</span>
      <span className="text-sm text-muted-foreground">{label}</span>
    </GlassPanel>
  );
}

export default async function AdminDashboardPage() {
  const [dashboard, healthStatus] = await Promise.all([
    getPlatformDashboard(),
    getSystemHealthStatus(),
  ]);
  const counts = dashboard.practiceCountsByStatus;
  const totalPractices = counts.trial + counts.active + counts.suspended + counts.archived;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{t.title}</h1>
        <GlassPanel className="flex items-center gap-2 px-4 py-2">
          <span
            aria-hidden
            className={`size-2.5 rounded-full ${healthStatus === "ok" ? "bg-success" : "bg-destructive"}`}
          />
          <span className="text-sm font-medium">
            {t.systemStatusHeading}: {healthStatus === "ok" ? t.systemStatusHealthy : t.systemStatusUnreachable}
          </span>
        </GlassPanel>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label={t.practicesTotal} value={totalPractices} />
        <StatCard label={t.practicesTrial} value={counts.trial} />
        <StatCard label={t.practicesActive} value={counts.active} />
        <StatCard label={t.practicesSuspended} value={counts.suspended} />
        <StatCard label={t.practicesArchived} value={counts.archived} />
        <StatCard label={t.activeStaffCount} value={dashboard.activeStaffCount} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <GlassPanel>
          <GlassPanelHeader>
            <GlassPanelTitle>{t.trialsEndingSoonHeading}</GlassPanelTitle>
          </GlassPanelHeader>
          {dashboard.trialsEndingSoon.length === 0 ? (
            <GlassPanelDescription>{t.trialsEndingSoonEmpty}</GlassPanelDescription>
          ) : (
            <ul className="flex flex-col gap-2">
              {dashboard.trialsEndingSoon.map((practice) => (
                <li key={practice.id}>
                  <Link
                    href={`/admin/practices/${practice.id}`}
                    className="flex items-center justify-between rounded-xl px-3 py-2 text-sm hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    <span className="font-medium">{practice.name}</span>
                    <span className="text-muted-foreground">{formatAdminDate(practice.trialEndsAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </GlassPanel>

        <GlassPanel>
          <GlassPanelHeader>
            <GlassPanelTitle>{t.noAdminHeading}</GlassPanelTitle>
          </GlassPanelHeader>
          {dashboard.practicesWithoutActiveAdmin.length === 0 ? (
            <GlassPanelDescription>{t.noAdminEmpty}</GlassPanelDescription>
          ) : (
            <ul className="flex flex-col gap-2">
              {dashboard.practicesWithoutActiveAdmin.map((practice) => (
                <li key={practice.id}>
                  <Link
                    href={`/admin/practices/${practice.id}`}
                    className="flex items-center justify-between rounded-xl px-3 py-2 text-sm hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    <span className="font-medium">{practice.name}</span>
                    <Badge variant="destructive">!</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </GlassPanel>
      </div>

      <GlassPanel>
        <GlassPanelHeader>
          <GlassPanelTitle>{t.recentEventsHeading}</GlassPanelTitle>
        </GlassPanelHeader>
        {dashboard.recentAuditEvents.length === 0 ? (
          <GlassPanelDescription>{t.recentEventsEmpty}</GlassPanelDescription>
        ) : (
          <ul className="flex flex-col gap-2 text-sm">
            {dashboard.recentAuditEvents.map((event) => (
              <li
                key={event.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-2"
              >
                <span>
                  <span className="font-medium">{event.eventType}</span>
                  {event.practiceName ? (
                    <>
                      {" · "}
                      <Link href={`/admin/practices/${event.practiceId}`} className="underline">
                        {event.practiceName}
                      </Link>
                    </>
                  ) : null}
                </span>
                <span className="text-muted-foreground">{formatAdminDate(event.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </GlassPanel>
    </div>
  );
}
