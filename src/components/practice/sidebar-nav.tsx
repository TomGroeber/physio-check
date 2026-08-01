"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DashboardSquare01Icon,
  UserGroupIcon,
  Dumbbell01Icon,
  Calendar03Icon,
  Clock01Icon,
  Message01Icon,
  Settings01Icon,
  HelpCircleIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { de } from "@/messages/de";

const items = [
  { href: "/practice", label: de.practice.nav.dashboard, icon: DashboardSquare01Icon, exact: true },
  { href: "/practice/patients", label: de.practice.nav.patients, icon: UserGroupIcon },
  { href: "/practice/exercises", label: de.practice.nav.exercises, icon: Dumbbell01Icon },
  { href: "/practice/calendar", label: de.practice.nav.calendar, icon: Calendar03Icon },
  { href: "/practice/waitlist", label: de.practice.nav.waitlist, icon: Clock01Icon },
  { href: "/practice/messages", label: de.practice.nav.messages, icon: Message01Icon },
  { href: "/practice/settings", label: de.practice.nav.settings, icon: Settings01Icon },
  { href: "/practice/help", label: de.practice.nav.help, icon: HelpCircleIcon },
] as const;

/**
 * Navigation des Praxisbereichs: Seitenleiste auf Desktop,
 * horizontale Leiste auf schmalen Bildschirmen.
 */
export function SidebarNav({ unreadMessages = 0 }: { unreadMessages?: number }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Praxisnavigation" className="flex md:flex-col md:gap-1">
      {items.map((item) => {
        const active =
          "exact" in item && item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
        const showBadge = item.href === "/practice/messages" && unreadMessages > 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex flex-1 items-center justify-center gap-3 rounded-lg px-3 py-3 text-base md:flex-none md:justify-start",
              "focus-visible:outline-2 focus-visible:outline-sidebar-ring",
              active
                ? "bg-sidebar-accent font-bold text-sidebar-accent-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            )}
          >
            <span className="relative">
              <HugeiconsIcon icon={item.icon} strokeWidth={2} className="size-5 shrink-0" aria-hidden />
              {showBadge && (
                <span
                  aria-hidden="true"
                  className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white"
                >
                  {unreadMessages > 9 ? "9+" : unreadMessages}
                </span>
              )}
            </span>
            <span className="hidden sm:inline">{item.label}</span>
            <span className="sr-only sm:hidden">
              {item.label}
              {showBadge ? ` (${unreadMessages} ungelesen)` : ""}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
