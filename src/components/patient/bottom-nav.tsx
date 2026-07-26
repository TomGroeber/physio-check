"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Home01Icon,
  Calendar03Icon,
  Message01Icon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { de } from "@/messages/de";

const items = [
  { href: "/today", label: de.patient.nav.today, icon: Home01Icon },
  { href: "/appointments", label: de.patient.nav.appointments, icon: Calendar03Icon },
  { href: "/messages", label: de.patient.nav.messages, icon: Message01Icon },
  { href: "/profile", label: de.patient.nav.profile, icon: UserCircleIcon },
] as const;

/**
 * Untere Hauptnavigation der Patientenoberfläche: vier große,
 * beschriftete Ziele (Touch-Fläche deutlich über 48×48 px).
 */
export function BottomNav({ unreadMessages = false }: { unreadMessages?: boolean }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Hauptnavigation"
      className="sticky bottom-0 z-40 border-t bg-card pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto flex max-w-lg">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            pathname.startsWith(item.href + "/") ||
            (item.href === "/today" &&
              (pathname === "/session" || pathname.startsWith("/exercises/")));
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-18 flex-col items-center justify-center gap-1 px-2 py-2 text-lg",
                  "focus-visible:outline-2 focus-visible:-outline-offset-2",
                  active
                    ? "font-bold text-accent-foreground"
                    : "text-muted-foreground"
                )}
              >
                <span
                  className={cn(
                    "relative flex h-8 w-14 items-center justify-center rounded-full",
                    active && "bg-accent"
                  )}
                >
                  <HugeiconsIcon icon={item.icon} strokeWidth={2} className="size-7" />
                  {item.href === "/messages" && unreadMessages && (
                    <span
                      aria-hidden="true"
                      className="absolute top-0.5 right-2.5 size-2.5 rounded-full bg-destructive"
                    />
                  )}
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
