"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DashboardSquare01Icon,
  Building03Icon,
  Settings01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { de } from "@/messages/de";

const items = [
  { href: "/admin", label: de.admin.nav.dashboard, icon: DashboardSquare01Icon, exact: true },
  { href: "/admin/practices", label: de.admin.nav.practices, icon: Building03Icon },
  { href: "/admin/config", label: de.admin.nav.config, icon: Settings01Icon },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Betreiber-Navigation" className="flex md:flex-col md:gap-1">
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
              "flex flex-1 items-center justify-center gap-3 rounded-2xl px-3 py-3 text-base transition-colors md:flex-none md:justify-start",
              "focus-visible:outline-2 focus-visible:outline-ring",
              active
                ? "glass-panel-strong font-bold text-foreground"
                : "text-foreground/70 hover:bg-white/10"
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
