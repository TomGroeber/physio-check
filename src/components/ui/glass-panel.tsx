import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Liquid-Glass-Grundfläche für das Betreiberportal und die
 * Praxis-Einstellungen (siehe globals.css für die Tokens/Utility-
 * Klassen). Bewusst ein eigenständiges, kleines Set statt einer neuen
 * Bibliothek: reine Tailwind-Klassen + zwei CSS-Utilities.
 */
function GlassPanel({
  className,
  strong = false,
  tinted = false,
  ...props
}: React.ComponentProps<"div"> & { strong?: boolean; tinted?: boolean }) {
  return (
    <div
      data-slot="glass-panel"
      className={cn(
        strong ? "glass-panel-strong" : "glass-panel",
        tinted && "glass-tint",
        "p-6",
        className
      )}
      {...props}
    />
  );
}

function GlassPanelHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="glass-panel-header"
      className={cn("mb-4 flex flex-col gap-1", className)}
      {...props}
    />
  );
}

function GlassPanelTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="glass-panel-title"
      className={cn("text-lg font-semibold tracking-tight text-foreground", className)}
      {...props}
    />
  );
}

function GlassPanelDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="glass-panel-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export { GlassPanel, GlassPanelHeader, GlassPanelTitle, GlassPanelDescription };
