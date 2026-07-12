import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * Einheitliche Erfolgs- und Fehlermeldungen für Formulare.
 * role="status"/"alert" sorgt dafür, dass Screenreader die Meldung
 * vorlesen, sobald sie erscheint.
 */
export function FormMessage({
  error,
  success,
  warning,
}: {
  error?: string;
  success?: string;
  warning?: string;
}) {
  if (error) {
    return (
      <Alert variant="destructive" role="alert" className="text-base">
        <AlertDescription className="text-base">{error}</AlertDescription>
      </Alert>
    );
  }
  if (warning) {
    return (
      <Alert role="alert" className="border-amber-600/50 bg-amber-500/10 text-foreground">
        <AlertDescription className="text-base font-semibold text-foreground">
          {warning}
        </AlertDescription>
      </Alert>
    );
  }
  if (success) {
    return (
      <Alert
        role="status"
        className="border-success/40 bg-success/10 text-foreground"
      >
        <AlertDescription className="text-base text-foreground">
          {success}
        </AlertDescription>
      </Alert>
    );
  }
  return null;
}
