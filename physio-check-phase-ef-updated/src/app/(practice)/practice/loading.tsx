import { Skeleton } from "@/components/ui/skeleton";
import { de } from "@/messages/de";

/** Ladezustand der Praxisseiten. */
export default function PracticeLoading() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label={de.common.loading}>
      <Skeleton className="h-8 w-64" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-44 w-full" />
      </div>
      <span className="sr-only">{de.common.loading}</span>
    </div>
  );
}
