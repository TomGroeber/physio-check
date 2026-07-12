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
  Settings01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { de } from "@/messages/de";

const items = [
  { href: "/practice", label: de.practice.nav.dashboard, icon: DashboardSquare01Icon, exact: true },
  { href: "/practice/patients", label: de.practice.nav.patients, icon: UserGroupIcon },
  { href: "/practice/exercises", label: de.practice.nav.exercises, icon: Dumbbell01Icon },
  { href: "/practice/calendar", label: de.practice.nav.calendar, icon: Calendar03Icon },
  { href: "/practice/waitlist", label: de.practice.nav.waitlist, icon: Clock01Icon },
  { href: "/practice/settings", label: de.practice.nav.settings, icon: Settings01Icon },
] as const;

/**
 * Navigation des Praxisbereichs: Seitenleiste auf Desktop,
 * horizontale Leiste auf schmalen Bildschirmen.
 */
export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Praxisnavigation" className="flex md:flex-col md:gap-1">
      {items.map((item) => {
        const active =
          "exact" in item && item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-1 items-center justify-center gap-3 rounded-lg px-3 py-3 text-base md:flex-none md:justify-start",
              "focus-visible:outline-2 focus-visible:outline-sidebar-ring",
              active
                ? "bg-sidebar-accent font-bold text-sidebar-accent-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            )}
          >
            <HugeiconsIcon icon={item.icon} strokeWidth={2} className="size-5 shrink-0" aria-hidden />
            <span className="hidden sm:inline">{item.label}</span>
            <span className="sr-only sm:hidden">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
