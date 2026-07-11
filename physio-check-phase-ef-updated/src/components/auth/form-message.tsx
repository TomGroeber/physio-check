import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * Einheitliche Erfolgs- und Fehlermeldungen für Formulare.
 * role="status"/"alert" sorgt dafür, dass Screenreader die Meldung
 * vorlesen, sobald sie erscheint.
 */
export function FormMessage({
  error,
  success,
}: {
  error?: string;
  success?: string;
}) {
  if (error) {
    return (
      <Alert variant="destructive" role="alert" className="text-base">
        <AlertDescription className="text-base">{error}</AlertDescription>
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
