/**
 * Texte der Patienten-App: Die App verwendet DIESELBEN deutschen Texte
 * wie die Patienten-Weboberfläche (Paritätsauftrag) aus dem geteilten
 * Paket. Hier stehen nur zusätzliche, app-spezifische Texte, für die es
 * kein Web-Gegenstück gibt (nativer Einstieg, Kontolöschung, Offline).
 * Sprachhygiene wie im Web: Selbstauskunft, nie „verifiziert“.
 */
import { de as web } from "@physio-check/shared/messages-de";

export { web };

export const app = {
  common: {
    appName: "PhysioCheck",
    loading: web.common.loading,
    retry: "Erneut versuchen",
    save: web.common.save,
    cancel: web.common.cancel,
    back: web.common.back,
    error: "Das hat leider nicht geklappt. Bitte versuchen Sie es erneut.",
    offlineBody:
      "Wir können Ihre Daten gerade nicht laden. Bitte prüfen Sie Ihre Internetverbindung und versuchen Sie es dann erneut.",
    pullToRefresh: "Zum Aktualisieren nach unten ziehen",
  },
  welcome: {
    title: "Willkommen bei PhysioCheck",
    subtitle: "Ihre Übungen und Termine – einfach auf Ihrem Handy.",
    withCode: "Ich habe einen Code",
    withCodeHint: "Sie haben von Ihrer Praxis einen Einladungscode bekommen.",
    withAccount: "Ich habe bereits ein Konto",
    withAccountHint: "Sie haben sich schon einmal angemeldet.",
  },
  auth: {
    emailLabel: "E-Mail-Adresse",
    passwordLabel: "Passwort",
    passwordHint: "Mindestens 10 Zeichen.",
    nameLabel: "Ihr Name",
    login: "Anmelden",
    loginTitle: "Anmelden",
    loginFailed:
      "Anmeldung nicht möglich. Bitte prüfen Sie E-Mail-Adresse und Passwort.",
    emailNotConfirmed:
      "Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse. Wir haben Ihnen dazu eine E-Mail geschickt.",
    forgotPassword: "Passwort vergessen?",
    resetSent:
      "Wenn ein Konto mit dieser E-Mail-Adresse existiert, haben wir Ihnen einen Link zum Zurücksetzen geschickt.",
    resetTitle: "Passwort zurücksetzen",
    resetSend: "Link anfordern",
    newPasswordTitle: "Neues Passwort festlegen",
    newPasswordLabel: "Neues Passwort",
    logout: web.common.signOut,
    logoutConfirm: "Möchten Sie sich wirklich abmelden?",
  },
  invite: {
    checkCode: "Code prüfen",
    expired:
      "Dieser Code ist abgelaufen. Bitte fragen Sie in Ihrer Praxis nach einem neuen Code.",
    connected: web.connect.success,
    switchWarning:
      "Achtung: Sie sind bereits mit einer Praxis verbunden. Wenn Sie fortfahren, wechseln Sie zur neuen Praxis. Ihre bisherige Praxis sieht Ihre neuen Einträge dann nicht mehr.",
    registerDone:
      "Fast geschafft! Wir haben Ihnen eine E-Mail geschickt. Bitte tippen Sie dort auf den Bestätigungslink und melden Sie sich danach hier an.",
  },
  offers: {
    accepted: "Der Termin ist verbindlich gebucht. Sie finden ihn unter „Kommende Termine“.",
    declined: "Sie haben das Angebot abgelehnt.",
    conflict:
      "Dieses Zeitfenster ist leider inzwischen vergeben. Ihre Praxis meldet sich mit einem neuen Vorschlag.",
  },
  practiceBlocked: {
    title: "Diese App ist für Patientinnen und Patienten",
    body:
      "Sie sind mit einem Praxis-Zugang angemeldet. Die Praxis-Funktionen finden Sie auf der PhysioCheck-Website am Computer. Sie wurden abgemeldet.",
    ok: "Verstanden",
  },
  deleteAccount: {
    title: "Konto löschen",
    body:
      "Sie können die Löschung Ihres Kontos beantragen. Ihr Zugang wird sofort gesperrt; Profilbild, Telefonnummer und Erinnerungseinstellungen werden sofort gelöscht. Praxisbezogene Behandlungsdaten (Termine, Übungspläne, Selbstauskünfte, Verordnungen) bleiben gespeichert, bis die gesetzliche Aufbewahrungsfrist rechtlich bestätigt ist – das ist eine offene Rechtsfrage, keine technische Lücke.",
    confirmLabel: "Ja, ich möchte mein Konto löschen",
    submit: "Löschung beantragen",
    doubleCheckTitle: "Sind Sie sicher?",
    doubleCheckBody:
      "Ihr Antrag wird an uns übermittelt und Ihr Konto wird abgemeldet. Dieser Schritt kann nicht in der App rückgängig gemacht werden.",
    done: "Ihr Löschantrag wurde gespeichert. Sie wurden abgemeldet.",
  },
} as const;
