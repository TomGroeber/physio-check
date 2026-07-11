import { Skeleton } from "@/components/ui/skeleton";
import { de } from "@/messages/de";

/** Ladezustand der Patientenseiten. */
export default function PatientLoading() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label={de.common.loading}>
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-28 w-full" />
      <span className="sr-only">{de.common.loading}</span>
    </div>
  );
}
