import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Clock01Icon,
  Location01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { useState } from "react";
import { Linking, Text, View } from "react-native";
import { formatDateLong, formatTime } from "@physio-check/shared";
import {
  AppButton,
  Body,
  Card,
  Collapsible,
  Field,
  useTheme,
} from "@/components/ui";
import { radius, spacing, type } from "@/config/branding";
import { web } from "@/messages/de";
import { requestCancellation, type AppointmentView } from "@/data/appointments";

const t = web.patient.appointments;

function IconRow({
  icon,
  children,
  top,
}: {
  icon: typeof Clock01Icon;
  children: React.ReactNode;
  top?: boolean;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: top ? "flex-start" : "center",
        gap: spacing.sm,
      }}
    >
      <HugeiconsIcon
        icon={icon}
        size={20}
        color={theme.mutedForeground}
        style={top ? { marginTop: 4 } : undefined}
      />
      <Body size="base">{children}</Body>
    </View>
  );
}

/**
 * Terminkarte wie appointment-card.tsx der Website: Datum fett, Status-
 * Badge, Zeit-/Personen-/Adresszeilen mit Icons, Karten-Link und
 * einklappbare Absageanfrage.
 */
export function AppointmentCard({
  appointment,
  showActions = true,
  onCancellationRequested,
}: {
  appointment: AppointmentView;
  showActions?: boolean;
  onCancellationRequested?: () => void;
}) {
  const theme = useTheme();
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const start = new Date(appointment.startsAt);
  const end = new Date(appointment.endsAt);
  const tz = appointment.timezone;
  const statusLabel =
    t.status[appointment.status as keyof typeof t.status] ?? appointment.status;
  const address = [appointment.locationName, appointment.address]
    .filter(Boolean)
    .join("\n");

  return (
    <Card>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: spacing.sm,
          flexWrap: "wrap",
        }}
      >
        <Body bold size="base">{formatDateLong(start, tz)}</Body>
        {appointment.status !== "scheduled" ? (
          <View
            style={{
              backgroundColor: theme.secondary,
              borderRadius: radius.full,
              paddingHorizontal: spacing.md - 4,
              paddingVertical: 4,
            }}
          >
            <Text style={{ fontSize: type.small, fontWeight: "600", color: theme.foreground }}>
              {statusLabel}
            </Text>
          </View>
        ) : null}
      </View>
      <IconRow icon={Clock01Icon}>
        {formatTime(start, tz)} – {formatTime(end, tz)} {web.units.timeSuffix}
      </IconRow>
      {appointment.therapistName ? (
        <IconRow icon={UserIcon}>
          {web.patient.today.with} {appointment.therapistName}
        </IconRow>
      ) : null}
      {address ? (
        <IconRow icon={Location01Icon} top>
          {address}
        </IconRow>
      ) : null}
      {showActions && appointment.address ? (
        <AppButton
          label={web.patient.today.openInMaps}
          variant="outline"
          onPress={() =>
            Linking.openURL(
              `https://maps.apple.com/?q=${encodeURIComponent(appointment.address)}`
            )
          }
        />
      ) : null}
      {showActions && appointment.status === "scheduled" && onCancellationRequested ? (
        <Collapsible summary={t.cancelToggle}>
          <Field
            label={t.cancellationReason}
            value={reason}
            onChangeText={setReason}
            multiline
          />
          {error ? <Body color={theme.destructive}>{error}</Body> : null}
          <AppButton
            label={pending ? web.common.loading : t.requestCancellation}
            variant="outline"
            disabled={pending}
            onPress={async () => {
              setPending(true);
              setError(null);
              try {
                await requestCancellation(appointment.id, reason.trim());
                onCancellationRequested();
              } catch {
                setError(web.common.error);
              } finally {
                setPending(false);
              }
            }}
          />
        </Collapsible>
      ) : null}
    </Card>
  );
}
