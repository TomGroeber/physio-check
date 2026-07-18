import { HugeiconsIcon } from "@hugeicons/react";
import { Location01Icon, Clock01Icon, UserIcon } from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateLong, formatTime } from "@/lib/datetime";
import { de } from "@/messages/de";
import { CancellationRequestForm } from "@/components/patient/cancellation-request-form";

export type AppointmentView = {
  id: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
  locationName: string;
  address: string;
  status: string;
  therapistName: string | null;
};

const statusLabels = de.patient.appointments.status;

/** Terminkarte mit Datum, Uhrzeit, Ort, behandelnder Person und Karten-Link. */
export function AppointmentCard({
  appointment,
  showMapLink = true,
}: {
  appointment: AppointmentView;
  showMapLink?: boolean;
}) {
  const start = new Date(appointment.startsAt);
  const end = new Date(appointment.endsAt);
  const tz = appointment.timezone;
  const mapsUrl = `https://maps.apple.com/?q=${encodeURIComponent(appointment.address)}`;
  const statusLabel =
    statusLabels[appointment.status as keyof typeof statusLabels] ??
    appointment.status;

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-lg font-bold">{formatDateLong(start, tz)}</p>
          {appointment.status !== "scheduled" && (
            <Badge variant="secondary" className="text-base">
              {statusLabel}
            </Badge>
          )}
        </div>
        <p className="flex items-center gap-2 text-lg">
          <HugeiconsIcon icon={Clock01Icon} className="size-5 shrink-0 text-muted-foreground" aria-hidden />
          {formatTime(start, tz)} – {formatTime(end, tz)} {de.units.timeSuffix}
        </p>
        {appointment.therapistName && (
          <p className="flex items-center gap-2 text-lg">
            <HugeiconsIcon icon={UserIcon} className="size-5 shrink-0 text-muted-foreground" aria-hidden />
            {de.patient.today.with} {appointment.therapistName}
          </p>
        )}
        {appointment.address && (
          <p className="flex items-start gap-2 text-lg">
            <HugeiconsIcon icon={Location01Icon} className="mt-1 size-5 shrink-0 text-muted-foreground" aria-hidden />
            <span>
              {appointment.locationName && (
                <>
                  {appointment.locationName}
                  <br />
                </>
              )}
              {appointment.address}
            </span>
          </p>
        )}
        {showMapLink && appointment.address && (
          <Button asChild variant="outline" className="min-h-14 text-lg">
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
              {de.patient.today.openInMaps}
            </a>
          </Button>
        )}
        {showMapLink && appointment.status === "scheduled" ? (
          <CancellationRequestForm appointmentId={appointment.id} />
        ) : null}
      </CardContent>
    </Card>
  );
}
