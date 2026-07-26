import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionContext } from "@/server/services/session";
import { listPracticeConversations, type ConversationFilter } from "@/server/services/messages";
import { formatDateTime } from "@/lib/datetime";
import { branding } from "@/config/branding";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { de } from "@/messages/de";

export const metadata: Metadata = { title: de.practice.messages.title };

const t = de.practice.messages;
const FILTERS: { value: ConversationFilter; label: string }[] = [
  { value: "all", label: t.filterAll },
  { value: "unread", label: t.filterUnread },
  { value: "open", label: t.filterOpen },
  { value: "answered", label: t.filterAnswered },
];

export default async function PracticeMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string }>;
}) {
  const session = await getSessionContext();
  if (!session?.memberships[0]) redirect("/login");
  const { q = "", filter: filterParam = "all" } = await searchParams;
  const filter: ConversationFilter = (["all", "unread", "open", "answered"] as const).includes(
    filterParam as ConversationFilter
  )
    ? (filterParam as ConversationFilter)
    : "all";

  const practiceId = session.memberships[0].practiceId;
  const conversations = await listPracticeConversations(practiceId, filter, q);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <h1 className="text-2xl font-bold">{t.title}</h1>

      <GlassPanel>
        <form method="GET" className="flex items-end gap-2">
          {filter !== "all" ? <input type="hidden" name="filter" value={filter} /> : null}
          <div className="flex flex-1 flex-col gap-2">
            <Label htmlFor="q" className="text-base">
              {t.searchPlaceholder}
            </Label>
            <Input id="q" name="q" defaultValue={q} placeholder={t.searchPlaceholder} className="h-11 text-base" />
          </div>
          <Button type="submit" variant="secondary" className="h-11 text-base">
            {de.common.search}
          </Button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <form key={f.value} method="GET">
              {q ? <input type="hidden" name="q" value={q} /> : null}
              {f.value !== "all" ? <input type="hidden" name="filter" value={f.value} /> : null}
              <Button type="submit" variant={filter === f.value ? "default" : "outline"} className="h-11 text-base">
                {f.label}
              </Button>
            </form>
          ))}
        </div>
      </GlassPanel>

      <GlassPanel className="p-0">
        {conversations.length === 0 ? (
          <p className="p-6 text-base text-muted-foreground">{t.emptyList}</p>
        ) : (
          <ul className="divide-y divide-glass-border">
            {conversations.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/practice/messages/${c.id}`}
                  className="flex items-center justify-between gap-3 px-6 py-4 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="flex items-center gap-2 font-semibold">
                      {c.patientName}
                      {c.unread && <Badge>{t.filterUnread}</Badge>}
                    </span>
                    {c.lastMessagePreview && (
                      <span className="truncate text-sm text-muted-foreground">
                        {c.lastMessageSenderRole === "practice" ? "Sie: " : ""}
                        {c.lastMessagePreview}
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 text-sm text-muted-foreground">
                    {formatDateTime(new Date(c.lastMessageAt), branding.defaultTimeZone)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </GlassPanel>
    </div>
  );
}
