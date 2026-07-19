/**
 * Alle Texte der Patienten-App. Deutsch, einfache Sprache, keine
 * Fachbegriffe ohne Erklärung. Selbstauskunfts-Sprachhygiene wie im
 * Web: „dokumentiert"/„eingetragen", nie „verifiziert".
 * Struktur bewusst getrennt von src/messages/de.ts der Website –
 * mobile Texte sind kürzer und screenbezogen.
 */

export const de = {
  common: {
    appName: "PhysioCheck",
    loading: "Wird geladen …",
    retry: "Erneut versuchen",
    save: "Speichern",
    cancel: "Abbrechen",
    back: "Zurück",
    close: "Schließen",
    error: "Das hat leider nicht geklappt. Bitte versuchen Sie es erneut.",
    offlineTitle: "Keine Verbindung",
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
    newPasswordSaved: "Ihr Passwort wurde geändert. Bitte melden Sie sich an.",
    logout: "Abmelden",
    logoutConfirm: "Möchten Sie sich wirklich abmelden?",
  },
  invite: {
    title: "Einladungscode eingeben",
    hint: "Den Code haben Sie von Ihrer Praxis bekommen – zum Beispiel auf einem Zettel oder per QR-Code.",
    codeLabel: "Ihr Code",
    check: "Code prüfen",
    invalid:
      "Dieser Code ist nicht gültig. Bitte prüfen Sie die Eingabe oder fragen Sie in Ihrer Praxis nach einem neuen Code.",
    expired:
      "Dieser Code ist abgelaufen. Bitte fragen Sie in Ihrer Praxis nach einem neuen Code.",
    confirmTitle: "Praxis gefunden",
    confirmBody: (practice: string) => `Sie verbinden sich mit: ${practice}`,
    validUntil: (date: string) => `Der Code ist gültig bis ${date}.`,
    createAccount: "Neues Konto erstellen",
    useExisting: "Mit bestehendem Konto anmelden",
    connect: "Jetzt verbinden",
    connected: "Sie sind jetzt mit Ihrer Praxis verbunden.",
    switchWarning:
      "Achtung: Sie sind bereits mit einer Praxis verbunden. Wenn Sie fortfahren, wechseln Sie zur neuen Praxis. Ihre bisherige Praxis sieht Ihre neuen Einträge dann nicht mehr.",
    registerTitle: "Konto erstellen",
    registerHint:
      "Mit Ihrem eigenen Konto gehören Ihre Zugangsdaten Ihnen – nicht der Praxis.",
    registerDone:
      "Fast geschafft! Wir haben Ihnen eine E-Mail geschickt. Bitte tippen Sie dort auf den Bestätigungslink und melden Sie sich danach hier an.",
  },
  practiceBlocked: {
    title: "Diese App ist für Patientinnen und Patienten",
    body:
      "Sie sind mit einem Praxis-Zugang angemeldet. Die Praxis-Funktionen finden Sie auf der PhysioCheck-Website am Computer. Sie wurden abgemeldet.",
    ok: "Verstanden",
  },
  connect: {
    title: "Mit Ihrer Praxis verbinden",
    body:
      "Ihr Konto ist noch mit keiner Praxis verbunden. Geben Sie Ihren Einladungscode ein, um zu starten.",
  },
  tabs: {
    today: "Heute",
    appointments: "Termine",
    profile: "Profil",
  },
  today: {
    title: "Ihre Übungen heute",
    empty: "Für heute sind keine Übungen geplant. Gut erholen!",
    noPlan:
      "Sie haben noch keinen Übungsplan. Ihre Praxis erstellt ihn für Sie – schauen Sie später wieder vorbei.",
    progress: (done: number, total: number) => `${done} von ${total} eingetragen`,
    nextUp: "Als Nächstes",
    start: "Übung öffnen",
    documented: "Eingetragen",
    completedToday: "Für heute eingetragen",
    allDone: "Für heute ist alles eingetragen. Danke!",
    celebrate: "Geschafft!",
    weekly: (done: number, target: number) => `Diese Woche: ${done} von ${target} Durchgängen`,
    occurrence: (index: number, total: number) => `Durchgang ${index} von ${total}`,
    nextAppointment: "Ihr nächster Termin",
  },
  exercise: {
    dosageSets: (n: number) => `${n} Sätze`,
    dosageReps: (n: number) => `${n} Wiederholungen`,
    dosageHold: (s: number) => `${s} Sek. halten`,
    dosageDuration: (s: number) => `${Math.round(s / 60) || 1} Min. Dauer`,
    dosageRest: (s: number) => `${s} Sek. Pause`,
    equipment: (name: string) => `Hilfsmittel: ${name}`,
    practiceNote: "Hinweis Ihrer Praxis",
    times: "Empfohlene Uhrzeiten",
    noMedia:
      "Für diese Übung gibt es noch kein Video und kein Bild. Ihre Praxis zeigt Ihnen die Übung beim nächsten Termin.",
    videoError: "Das Video konnte nicht geladen werden.",
    timerStart: "Timer starten",
    timerStop: "Timer anhalten",
    logTitle: "Wie ist es gelaufen?",
    statusCompleted: "Erledigt",
    statusPartial: "Teilweise geschafft",
    statusTooDifficult: "Zu schwierig",
    statusNotPossible: "Heute nicht möglich",
    setsCompleted: "Geschaffte Sätze",
    painBefore: "Schmerz vorher (0–10)",
    painAfter: "Schmerz nachher (0–10)",
    noteLabel: "Notiz (optional)",
    notePlaceholder: "Zum Beispiel: rechtes Knie zwickte beim dritten Satz",
    submit: "Eintragen",
    logged: "Danke, Ihr Eintrag wurde gespeichert.",
    loggedCompleted: "Stark! Ihr Eintrag wurde gespeichert.",
    loggedNeutral:
      "Danke für Ihre ehrliche Rückmeldung. Ihre Praxis sieht den Eintrag.",
    nextExercise: "Nächste Übung",
    backToToday: "Zurück zu Heute",
    alreadyDone: "Diese Übung ist für heute bereits vollständig eingetragen.",
  },
  appointments: {
    title: "Ihre Termine",
    empty: "Es sind keine Termine geplant.",
    upcoming: "Kommende Termine",
    past: "Vergangene Termine",
    showPast: "Vergangene Termine anzeigen",
    hidePast: "Vergangene Termine ausblenden",
    with: (name: string) => `Mit ${name}`,
    status: {
      scheduled: "Geplant",
      cancellation_requested: "Absage angefragt",
      cancelled: "Abgesagt",
      completed: "Abgeschlossen",
    } as Record<string, string>,
    requestCancellation: "Termin absagen anfragen",
    cancellationReason: "Grund (optional, bitte keine Gesundheitsdetails)",
    cancellationSend: "Absage anfragen",
    cancellationRequested:
      "Ihre Absageanfrage wurde an die Praxis gesendet. Die Praxis meldet sich bei Ihnen.",
    offers: "Terminangebote",
    offerBody: (practice: string) => `${practice} bietet Ihnen einen Termin an:`,
    offerAccept: "Termin annehmen",
    offerDecline: "Ablehnen",
    offerAccepted: "Der Termin ist gebucht. Sie finden ihn unter „Kommende Termine“.",
    offerDeclined: "Sie haben das Angebot abgelehnt.",
    offerConflict:
      "Dieser Termin ist leider inzwischen vergeben. Ihre Praxis meldet sich mit einem neuen Vorschlag.",
    units: {
      title: "Behandlungseinheiten",
      remaining: (n: number, total: number) => `${n} von ${total} Einheiten übrig`,
      hint:
        "Hinweis: Ob Kosten übernommen werden, entscheidet Ihre Krankenkasse. Diese Anzeige ist keine Zusage zur Kostenübernahme.",
      low: "Nur noch wenige Einheiten übrig. Sprechen Sie Ihre Praxis auf eine neue Verordnung an.",
      expired: "Ihre Verordnung ist abgelaufen. Sprechen Sie bitte Ihre Praxis an.",
      none: "Zurzeit ist keine Verordnung hinterlegt.",
    },
  },
  profile: {
    title: "Ihr Profil",
    personal: "Persönliche Daten",
    nameLabel: "Name",
    phoneLabel: "Telefonnummer (optional)",
    phoneSaved: "Ihre Telefonnummer wurde gespeichert.",
    practice: "Ihre Praxis",
    noPractice: "Nicht mit einer Praxis verbunden.",
    switchPractice: "Praxis wechseln (neuer Code)",
    avatar: {
      title: "Profilbild",
      choose: "Bild auswählen",
      replace: "Bild ersetzen",
      remove: "Bild entfernen",
      removeConfirm: "Möchten Sie Ihr Profilbild wirklich entfernen?",
      uploading: "Bild wird hochgeladen …",
      saved: "Ihr Profilbild wurde gespeichert.",
      removed: "Ihr Profilbild wurde entfernt.",
      tooLarge: "Das Bild ist zu groß (maximal 5 MB).",
      wrongType: "Bitte wählen Sie ein Bild im Format JPEG, PNG oder WebP.",
    },
    reminders: {
      title: "Erinnerungen",
      exercise: "An Übungen erinnern",
      plan: "Über Planänderungen informieren",
      saved: "Ihre Einstellungen wurden gespeichert.",
    },
    security: "Sicherheit",
    changeEmail: "E-Mail-Adresse ändern",
    newEmailLabel: "Neue E-Mail-Adresse",
    emailChangeRequested:
      "Fast geschafft: Bitte bestätigen Sie die Änderung über die E-Mails, die wir an Ihre alte und neue Adresse geschickt haben.",
    changePassword: "Passwort ändern",
    passwordResetInfo:
      "Wir schicken Ihnen eine E-Mail mit einem Link, über den Sie ein neues Passwort festlegen.",
    deleteAccount: {
      title: "Konto löschen",
      body:
        "Sie können die Löschung Ihres Kontos beantragen. Wichtig: Ihre Praxis muss Behandlungsunterlagen unter Umständen gesetzlich aufbewahren – diese werden dann nicht sofort gelöscht. Ihr Zugang wird deaktiviert und Ihr Antrag dokumentiert.",
      confirmLabel: "Ja, ich möchte mein Konto löschen",
      submit: "Löschung beantragen",
      doubleCheckTitle: "Sind Sie sicher?",
      doubleCheckBody:
        "Ihr Antrag wird an uns übermittelt und Ihr Konto wird abgemeldet. Dieser Schritt kann nicht in der App rückgängig gemacht werden.",
      done:
        "Ihr Löschantrag wurde gespeichert. Sie wurden abgemeldet.",
    },
  },
} as const;
