import { de } from "@/messages/de";
import { formatDateShort } from "@/lib/datetime";
import { branding } from "@/config/branding";
import type { AuthorizationWarning } from "@/lib/authorization-warnings";

/** Deutscher Anzeigetext für eine Verordnungswarnung. */
export function authorizationWarningText(warning: AuthorizationWarning): string {
  const t = de.practice.authorizations.warning;
  switch (warning.type) {
    case "no_units":
      return t.no_units;
    case "low_units":
      return t.low_units(warning.remaining);
    case "expired":
      return t.expired(formatDateShort(new Date(warning.validUntil), branding.defaultTimeZone));
    case "expires_soon":
      return t.expires_soon(
        formatDateShort(new Date(warning.validUntil), branding.defaultTimeZone),
        warning.daysLeft
      );
  }
}
