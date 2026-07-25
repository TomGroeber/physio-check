import type { Metadata } from "next";
import Link from "next/link";
import { listPracticesForAdmin } from "@/server/services/platform-admin";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { de } from "@/messages/de";
import { formatDateShort } from "@/lib/datetime";
import { branding } from "@/config/branding";

export const metadata: Metadata = { title: de.admin.practices.title };

const t = de.admin.practices;

function statusLabel(status: "trial" | "active" | "suspended" | "archived"): string {
  return {
    trial: t.statusTrial,
    active: t.statusActive,
    suspended: t.statusSuspended,
    archived: t.statusArchived,
  }[status];
}

function statusVariant(
  status: "trial" | "active" | "suspended" | "archived"
): "default" | "secondary" | "destructive" | "outline" {
  return { trial: "outline", active: "default", suspended: "destructive", archived: "secondary" }[status] as
    | "default"
    | "secondary"
    | "destructive"
    | "outline";
}

export default async function AdminPracticesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const query = await searchParams;
  const status = (query.status ?? "all") as "trial" | "active" | "suspended" | "archived" | "all";
  const practices = await listPracticesForAdmin({
    query: query.q ?? "",
    status,
    country: "",
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{t.title}</h1>
        <Button asChild>
          <Link href="/admin/practices/new">{t.newPractice}</Link>
        </Button>
      </div>

      <GlassPanel>
        <form className="flex flex-wrap items-end gap-3" method="get">
          <div className="flex flex-col gap-1">
            <label htmlFor="q" className="text-sm font-medium">
              {t.searchLabel}
            </label>
            <Input id="q" name="q" defaultValue={query.q ?? ""} placeholder={t.searchPlaceholder} className="w-56" />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="status" className="text-sm font-medium">
              {t.statusLabel}
            </label>
            <Select name="status" defaultValue={status}>
              <SelectTrigger id="status" className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.statusAll}</SelectItem>
                <SelectItem value="trial">{t.statusTrial}</SelectItem>
                <SelectItem value="active">{t.statusActive}</SelectItem>
                <SelectItem value="suspended">{t.statusSuspended}</SelectItem>
                <SelectItem value="archived">{t.statusArchived}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" variant="secondary">
            {de.common.search}
          </Button>
        </form>
      </GlassPanel>

      <GlassPanel className="p-0">
        {practices.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">{t.empty}</p>
        ) : (
          <ul className="divide-y divide-glass-border">
            {practices.map((practice) => (
              <li key={practice.id}>
                <Link
                  href={`/admin/practices/${practice.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold">{practice.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {t.columnStaff}: {practice.activeStaffCount} · {t.columnPatients}: {practice.connectedPatientsCount}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {practice.trialEndsAt ? (
                      <span className="text-sm text-muted-foreground">
                        {t.columnTrialEnd}: {formatDateShort(new Date(practice.trialEndsAt), branding.defaultTimeZone)}
                      </span>
                    ) : null}
                    <Badge variant={statusVariant(practice.status)}>{statusLabel(practice.status)}</Badge>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </GlassPanel>
    </div>
  );
}
