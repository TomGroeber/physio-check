/**
 * ============================================================
 * ALLE DEUTSCHEN OBERFLÄCHENTEXTE
 * ============================================================
 * Texte werden AUSSCHLIESSLICH hier gepflegt, nie direkt im Code.
 * Für weitere Sprachen später: Datei kopieren (z. B. `fr.ts`),
 * Werte übersetzen, Struktur unverändert lassen.
 *
 * Sprachregeln (verbindlich, siehe CLAUDE.md):
 * - Dokumentierte Übungen sind Selbstauskunft: "erledigt",
 *   "dokumentiert" – nie "verifiziert" oder "bewiesen".
 * - Klare, freundliche Sprache ohne Fachjargon und ohne
 *   beschämende Formulierungen.
 * ============================================================
 */
export const de = {
  common: {
    back: "Zurück",
    save: "Speichern",
    cancel: "Abbrechen",
    confirm: "Bestätigen",
    close: "Schließen",
    loading: "Wird geladen …",
    error: "Etwas hat nicht funktioniert. Bitte versuchen Sie es erneut.",
    requiredField: "Bitte füllen Sie dieses Feld aus.",
    saved: "Gespeichert.",
    signOut: "Abmelden",
  },

  landing: {
    title: "Ihre Übungen und Termine an einem Ort",
    intro:
      "PhysioCheck verbindet Sie sicher mit Ihrer Physiotherapiepraxis. Erstellen Sie ein Konto – Ihre Übungen und Termine sehen Sie, sobald Sie Ihr Konto mit dem Code Ihrer Praxis verbunden haben.",
    createAccount: "Neues Konto erstellen",
    haveCode: "Ich habe einen Einladungscode",
    signIn: "Ich habe bereits ein Konto",
    noInvite:
      "Den Verbindungscode erhalten Sie direkt von Ihrer Physiotherapiepraxis.",
  },

  auth: {
    login: {
      title: "Anmelden",
      email: "E-Mail-Adresse",
      password: "Passwort",
      submit: "Anmelden",
      forgotPassword: "Passwort vergessen?",
      noAccount: "Noch kein Konto?",
      registerLink: "Konto erstellen",
      inviteIntro:
        "Melden Sie sich an. Anschließend können Sie die Einladung Ihrer Praxis bestätigen.",
      errorInvalidCredentials:
        "E-Mail-Adresse oder Passwort stimmen nicht. Bitte prüfen Sie Ihre Eingabe.",
      errorEmailNotConfirmed:
        "Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse. Wir haben Ihnen dazu eine E-Mail geschickt.",
    },
    register: {
      title: "Konto erstellen",
      intro:
        "Erstellen Sie Ihr kostenloses Patientenkonto. Den Verbindungscode Ihrer Praxis geben Sie danach ein.",
      introInvited: (practiceName: string) =>
        `Erstellen Sie Ihr Konto, um die Einladung von ${practiceName} anzunehmen.`,
      invitedAs: (name: string) => `Einladung für ${name}`,
      fullName: "Vor- und Nachname",
      email: "E-Mail-Adresse",
      password: "Passwort",
      passwordHint: "Mindestens 10 Zeichen.",
      submit: "Konto erstellen",
      hasAccount: "Sie haben schon ein Konto?",
      loginLink: "Zur Anmeldung",
      errorEmailTaken:
        "Mit dieser E-Mail-Adresse gibt es bereits ein Konto. Sie können sich anmelden oder das Passwort zurücksetzen.",
      errorWeakPassword:
        "Bitte wählen Sie ein längeres Passwort (mindestens 10 Zeichen).",
      success:
        "Fast geschafft! Wir haben Ihnen eine E-Mail geschickt. Bitte öffnen Sie die E-Mail und klicken Sie auf den Bestätigungslink.",
    },
    forgotPassword: {
      title: "Passwort zurücksetzen",
      intro:
        "Geben Sie Ihre E-Mail-Adresse ein. Wir schicken Ihnen einen Link, mit dem Sie ein neues Passwort festlegen können.",
      email: "E-Mail-Adresse",
      submit: "Link anfordern",
      success:
        "Wenn ein Konto mit dieser E-Mail-Adresse besteht, haben wir Ihnen einen Link geschickt. Bitte prüfen Sie Ihr Postfach.",
      backToLogin: "Zurück zur Anmeldung",
    },
    resetPassword: {
      title: "Neues Passwort festlegen",
      password: "Neues Passwort",
      passwordHint: "Mindestens 10 Zeichen.",
      submit: "Passwort speichern",
      success: "Ihr Passwort wurde geändert. Sie können sich jetzt anmelden.",
      errorExpired:
        "Dieser Link ist abgelaufen. Bitte fordern Sie einen neuen Link an.",
    },
    confirm: {
      errorTitle: "Bestätigung nicht möglich",
      errorBody:
        "Dieser Bestätigungslink ist ungültig oder abgelaufen. Bitte melden Sie sich an, um einen neuen Link zu erhalten.",
      toLogin: "Zur Anmeldung",
    },
  },

  connect: {
    title: "Einladung Ihrer Praxis",
    intro:
      "Geben Sie den Code ein, den Sie von Ihrer Physiotherapiepraxis erhalten haben. Erst nach erfolgreicher Prüfung können Sie ein Konto erstellen oder sich anmelden.",
    codeLabel: "Ihr Code von der Praxis",
    codePlaceholder: "z. B. ABCD-EFGH-JK23",
    submit: "Verbinden",
    errorInvalid:
      "Dieser Code ist ungültig oder abgelaufen. Bitte prüfen Sie die Eingabe oder fragen Sie Ihre Praxis nach einem neuen Code.",
    errorTooManyAttempts:
      "Zu viele Versuche. Bitte warten Sie einen Moment und versuchen Sie es dann erneut.",
    success: "Geschafft! Ihr Konto ist jetzt mit Ihrer Praxis verbunden.",
    signOutHint: "Falsches Konto?",
    continueTitle: "Einladung bestätigen",
    invitationFor: (patientName: string) => `Einladung für ${patientName}`,
    fromPractice: (practiceName: string) => `Praxis: ${practiceName}`,
    createAccount: "Neues Konto erstellen",
    useExistingAccount: "Mit bestehendem Konto anmelden",
    accept: "Verbindung zur Praxis bestätigen",
    changeWarning: (practiceName: string) =>
      `Sie sind derzeit mit ${practiceName} verbunden. Wenn Sie fortfahren, wird diese Verbindung beendet und die neue Praxis wird aktiv. Ihre bisherigen Daten bleiben bei der bisherigen Praxis gespeichert.`,
    sessionExpired:
      "Die Sicherheitsprüfung ist abgelaufen. Bitte geben Sie den Einladungscode erneut ein.",
    hubTitle: "Mit Ihrer Praxis verbinden",
    hubIntro:
      "Ihr Konto ist noch mit keiner Praxis verbunden. Geben Sie den Code ein, den Sie von Ihrer Physiotherapiepraxis erhalten haben. Danach sehen Sie hier Ihre Übungen und Termine.",
    hubIntroConnected: (practiceName: string) =>
      `Sie sind derzeit mit ${practiceName} verbunden. Mit einem neuen Code können Sie zu einer anderen Praxis wechseln.`,
    accountHeading: "Ihr Konto",
    enterOtherCode: "Anderen Code eingeben",
    legalHint:
      "Hinweis: PhysioCheck verarbeitet Ihre Daten nur für die Zusammenarbeit mit Ihrer Physiotherapiepraxis. Ohne Praxisverbindung sind keine Übungs- oder Termindaten sichtbar.",
  },

  patient: {
    nav: {
      today: "Heute",
      appointments: "Termine",
      profile: "Profil",
    },
    today: {
      title: "Heute",
      exercisesHeading: "Ihre Übungen heute",
      alreadyLogged: "Heute bereits dokumentiert",
      greeting: "Guten Tag",
      startExercises: "Heutige Übungen starten",
      progress: (done: number, total: number) =>
        `${done} von ${total} Übungen erledigt`,
      noExercisesToday:
        "Für heute sind keine Übungen geplant. Gönnen Sie sich die Pause!",
      noPlanYet:
        "Ihre Praxis hat Ihnen noch keinen Übungsplan zugewiesen. Sobald es so weit ist, sehen Sie Ihre Übungen hier.",
      nextAppointment: "Ihr nächster Termin",
      noAppointment: "Aktuell ist kein Termin geplant.",
      openInMaps: "Adresse in Karten-App öffnen",
      with: "bei",
      loggedSuccess: "Danke! Ihre Dokumentation wurde gespeichert.",
      painHint:
        "Sie haben stärkere Schmerzen angegeben. Wenn die Schmerzen anhalten oder zunehmen, pausieren Sie die Übung und besprechen Sie das weitere Vorgehen mit Ihrer Praxis.",
      openExercise: (title: string) => `Übung „${title}“ öffnen`,
    },
    exercise: {
      backToToday: "Zurück zu Heute",
      videoHeading: "Video",
      noVideo: "Für diese Übung ist noch kein Video hinterlegt.",
      videoUnsupported:
        "Ihr Browser kann dieses Video nicht abspielen. Bitte folgen Sie den Schritten unten.",
      startingPosition: "Ausgangsposition",
      steps: "So führen Sie die Übung aus",
      commonMistakes: "Darauf sollten Sie achten",
      equipment: "Hilfsmittel",
      prescriptionHeading: "Ihre Vorgaben",
      planNote: "Hinweis Ihrer Praxis",
      documentHeading: "Durchführung dokumentieren",
      selfReportHint:
        "Ihre Angaben sind eine Selbstauskunft. Sie helfen Ihrer Praxis, den Plan an Sie anzupassen.",
      statusLabel: "Wie ist es gelaufen?",
      status: {
        completed: "Erledigt",
        partial: "Teilweise erledigt",
        too_difficult: "Zu schwierig",
        not_possible: "Nicht möglich",
      },
      setsCompletedLabel: "Absolvierte Sätze (optional)",
      painBeforeLabel: "Schmerz vor der Übung (optional)",
      painAfterLabel: "Schmerz nach der Übung (optional)",
      painScaleHint: "0 = kein Schmerz, 10 = stärkster vorstellbarer Schmerz",
      painNone: "Keine Angabe",
      noteLabel: "Notiz an Ihre Praxis (optional)",
      submit: "Dokumentation speichern",
      alreadyLoggedTitle: "Heute dokumentiert",
      alreadyLoggedBody:
        "Sie haben diese Übung heute bereits dokumentiert. Vielen Dank!",
      errorNotFound:
        "Diese Übung gehört nicht (mehr) zu Ihrem aktuellen Übungsplan.",
      errorAlreadyLogged: "Sie haben diese Übung heute bereits dokumentiert.",
      errorNotDueToday: "Diese Übung ist für heute nicht geplant.",
    },
    appointments: {
      title: "Termine",
      upcoming: "Kommende Termine",
      past: "Vergangene Termine",
      empty: "Es sind keine Termine geplant.",
      cancellationReason: "Grund (optional)",
      requestCancellation: "Terminabsage anfragen",
      status: {
        scheduled: "Geplant",
        cancellation_requested: "Absage angefragt",
        cancelled: "Abgesagt",
        completed: "Abgeschlossen",
      },
    },
    profile: {
      title: "Profil",
      name: "Name",
      email: "E-Mail-Adresse",
      practice: "Ihre Praxis",
      noPractice: "Noch keine Praxis verbunden.",
      connectCta: "Mit Praxis verbinden",
      changePractice: "Praxis wechseln",
    },
  },

  practice: {
    nav: {
      dashboard: "Übersicht",
      patients: "Patienten",
      exercises: "Übungsbibliothek",
      appointments: "Termine",
      calendar: "Kalender",
      settings: "Einstellungen",
    },
    dashboard: {
      title: "Übersicht",
      todaysAppointments: "Heutige Termine",
      openCancellations: "Offene Absageanfragen",
      recentActivity: "Kürzlich dokumentierte Übungen",
      flaggedFeedback: "Rückmeldungen zum Ansehen",
      emptyAppointments: "Heute stehen keine Termine an.",
      emptyCancellations: "Keine offenen Absageanfragen.",
      emptyActivity: "Noch keine dokumentierten Übungen.",
      emptyFeedback: "Keine neuen Rückmeldungen.",
      selfReportNote:
        "Alle Angaben zu durchgeführten Übungen sind Selbstauskünfte der Patientinnen und Patienten.",
      painAfter: (value: number) => `Schmerz nach der Übung: ${value} von 10`,
      logStatus: {
        completed: "Erledigt",
        partial: "Teilweise erledigt",
        too_difficult: "Zu schwierig",
        not_possible: "Nicht möglich",
      },
    },
    patients: {
      title: "Patienten",
      searchLabel: "Nach Name suchen",
      searchPlaceholder: "Nach Name suchen …",
      searchButton: "Suchen",
      connectedSince: (date: string) => `verbunden seit ${date}`,
      empty: "Noch keine Patienten angelegt.",
      addPatient: "Patient anlegen",
      newTitle: "Patient einladen",
      patientName: "Name des Patienten",
      createInvite: "Einladungscode erzeugen",
      renewInvite: "Neuen Code erzeugen",
      revokeInvite: "Code widerrufen",
      pendingInvites: "Offene Einladungen",
      validUntil: (date: string) => `gültig bis ${date}`,
      inviteCreated: "Der Einladungscode wurde erstellt.",
      inviteOneTime:
        "Kopieren Sie den Code oder den Link jetzt. Der Code wird aus Sicherheitsgründen nicht dauerhaft angezeigt.",
      inviteCode: "Einladungscode",
      inviteLink: "Einladungslink",
      inviteCreateError:
        "Die Einladung konnte nicht erstellt werden. Bitte versuchen Sie es erneut.",
      noPendingInvites: "Keine offenen Einladungen.",
    },
    patientDetail: {
      backToList: "Zurück zur Patientenliste",
      connectedSince: (date: string) => `Verbunden seit ${date}`,
      nextAppointment: "Nächster Termin",
      noAppointment: "Kein Termin geplant.",
      currentPlan: "Aktueller Übungsplan",
      noPlan: "Kein aktiver Übungsplan.",
      planVersion: (version: number) => `Version ${version}`,
      logsHeading: "Dokumentierte Übungen",
      range7: "Letzte 7 Tage",
      range30: "Letzte 30 Tage",
      noLogs: "Im gewählten Zeitraum wurden keine Übungen dokumentiert.",
      setsCompleted: (sets: number) =>
        `${sets} ${sets === 1 ? "Satz" : "Sätze"} absolviert`,
      painBefore: (value: number) => `Schmerz vorher: ${value}/10`,
      painAfter: (value: number) => `Schmerz nachher: ${value}/10`,
      patientNote: "Notiz",
      selfReportNote:
        "Alle Angaben sind Selbstauskünfte der Patientin/des Patienten – kein Nachweis der Ausführung.",
    },
    exercises: {
      title: "Übungsbibliothek",
      empty:
        "Noch keine Übungen in der Bibliothek. Legen Sie die erste Übung an.",
      addExercise: "Übung anlegen",
      inactive: "Inaktiv",
    },
    appointments: {
      title: "Termine",
      empty: "Keine Termine im ausgewählten Zeitraum.",
      addAppointment: "Termin anlegen",
    },
    calendar: {
      title: "Praxiskalender",
      newTitle: "Termin anlegen",
      editTitle: "Termin bearbeiten",
      addAppointment: "Termin anlegen",
      createAppointment: "Termin speichern",
      saveChanges: "Änderungen speichern",
      today: "Heute",
      views: "Kalenderansicht",
      view: { month: "Monat", week: "Woche", day: "Tag", list: "Liste" },
      monthView: "Monatskalender",
      weekdays: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"],
      patient: "Patient",
      therapist: "Behandelnde Person",
      selectPatient: "Patient auswählen",
      selectTherapist: "Behandelnde Person auswählen",
      date: "Datum",
      startTime: "Startzeit",
      duration: "Dauer",
      location: "Standort",
      note: "Interne Notiz",
      allTherapists: "Alle Behandelnden",
      allPatients: "Alle Patienten",
      allStatuses: "Alle Status",
      filter: "Filtern",
      empty: "Keine Termine in diesem Zeitraum.",
      completeTitle: "Termin abschließen",
      completeHint: "Markiert den Termin als tatsächlich durchgeführt.",
      complete: "Als abgeschlossen markieren",
      cancelTitle: "Termin stornieren",
      cancelHint: "Der Termin bleibt in der Historie. Der Patient wird benachrichtigt.",
      cancelReason: "Grund (optional, keine Gesundheitsdetails)",
      cancelAppointment: "Termin endgültig stornieren",
    },
    settings: {
      title: "Einstellungen",
      practiceData: "Praxisdaten",
    },
  },

  units: {
    set: "Satz",
    sets: "Sätze",
    repetitions: "Wiederholungen",
    holdSeconds: (s: number) => `${s} Sek. halten`,
    restSeconds: (s: number) => `${s} Sek. Pause`,
    minutes: (m: number) => `${m} Min.`,
    timeSuffix: "Uhr",
  },

  errors: {
    notFoundTitle: "Seite nicht gefunden",
    notFoundBody: "Diese Seite gibt es nicht oder sie wurde verschoben.",
    toHome: "Zur Startseite",
    unexpectedTitle: "Unerwarteter Fehler",
    unexpectedBody:
      "Etwas hat nicht funktioniert. Bitte laden Sie die Seite neu oder versuchen Sie es später erneut.",
    reload: "Seite neu laden",
    forbiddenTitle: "Kein Zugriff",
    forbiddenBody: "Sie haben keine Berechtigung für diesen Bereich.",
  },
} as const;

export type Messages = typeof de;
