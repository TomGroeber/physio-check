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
    search: "Suchen",
    loading: "Wird geladen …",
    error: "Etwas hat nicht funktioniert. Bitte versuchen Sie es erneut.",
    requiredField: "Bitte füllen Sie dieses Feld aus.",
    saved: "Gespeichert.",
    signOut: "Abmelden",
    avatarAlt: (name: string) =>
      name ? `Profilbild von ${name}` : "Profilbild",
  },

  landing: {
    title: "Ihre Übungen und Termine an einem Ort",
    intro:
      "PhysioCheck verbindet Sie sicher mit Ihrer Physiotherapiepraxis. Haben Sie einen Einladungscode von Ihrer Praxis erhalten? Dann starten Sie am besten direkt damit.",
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
    invitationValidUntil: (date: string) => `Die Einladung ist gültig bis ${date}.`,
    continueHint:
      "Ihr Code ist geprüft. Erstellen Sie jetzt ein eigenes Konto mit Ihrer E-Mail-Adresse und einem selbst gewählten Passwort – oder melden Sie sich mit einem bestehenden Konto an. Die Verbindung zur Praxis wird erst danach endgültig hergestellt; der Code bleibt bis dahin gültig.",
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
      messages: "Nachrichten",
      profile: "Profil",
    },
    today: {
      title: "Heute",
      exercisesHeading: "Ihre Übungen heute",
      greeting: "Guten Tag",
      // Tagesfortschritt: bewusst kurz und wertungsfrei – gezählt werden
      // dokumentierte Durchgänge (auch „zu schwierig“/„teilweise“), deshalb
      // „eingetragen“ statt „geschafft“ (D-041/D-049).
      progressShort: (documented: number, total: number) =>
        `${documented} von ${total} eingetragen`,
      progressBarLabel: (documented: number, total: number) =>
        `Tagesfortschritt: ${documented} von ${total} Durchgängen dokumentiert`,
      progressToday: (documented: number, total: number) =>
        `${documented} von ${total} heute`,
      progressWeek: (documented: number, total: number) =>
        `${documented} von ${total} diese Woche`,
      doneBadge: "Erledigt",
      documentedBadge: "Rückmeldung gespeichert",
      successTitle: "Geschafft!",
      feedbackSavedTitle: "Rückmeldung gespeichert",
      feedbackSavedBody: "Danke. Ihre Praxis kann die Rückmeldung jetzt sehen.",
      allDoneTitle: "Für heute alles geschafft",
      allDoneBody:
        "Alle Durchgänge für heute sind dokumentiert. Gönnen Sie sich eine Pause!",
      allReportedTitle: "Für heute alles eingetragen",
      allReportedBody: "Danke. Ihre Praxis kann alle Rückmeldungen jetzt sehen.",
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
      germanCaptions: "Deutsche Untertitel",
      fallbackImageAlt: (title: string) => `Alternativbild zur Übung ${title}`,
      startingPosition: "Ausgangsposition",
      steps: "So führen Sie die Übung aus",
      commonMistakes: "Darauf sollten Sie achten",
      equipment: "Hilfsmittel",
      prescriptionHeading: "Ihre Vorgaben",
      noVideoBody:
        "Ihre Praxis erklärt Ihnen die Übung gern beim nächsten Termin.",
      scheduleFixed: (days: string, times: number) =>
        `${days} · ${times} ${times === 1 ? "Durchgang" : "Durchgänge"} pro Tag`,
      scheduleFlexible: (times: number) =>
        `${times} ${times === 1 ? "Durchgang" : "Durchgänge"} pro Woche, Tage frei wählbar`,
      preferredTimes: (times: string) => `Empfohlene Uhrzeiten: ${times}`,
      planNote: "Hinweis Ihrer Praxis",
      documentHeading: "Durchführung dokumentieren",
      occurrenceHeading: (current: number, total: number) =>
        `Durchgang ${current} von ${total}`,
      selfReportHint:
        "Ihre Angaben sind eine Selbstauskunft. Sie helfen Ihrer Praxis, den Plan an Sie anzupassen.",
      statusLabel: "Wie ist es gelaufen?",
      status: {
        completed: "Erledigt",
        partial: "Teilweise erledigt",
        too_difficult: "Zu schwierig",
        not_possible: "Nicht möglich",
      },
      optionalToggle: "Weitere Angaben (optional)",
      setsCompletedLabel: "Absolvierte Sätze (optional)",
      painBeforeLabel: "Schmerz vor der Übung (optional)",
      painAfterLabel: "Schmerz nach der Übung (optional)",
      painScaleHint: "0 = kein Schmerz, 10 = stärkster vorstellbarer Schmerz",
      painNone: "Keine Angabe",
      noteLabel: "Notiz an Ihre Praxis (optional)",
      submit: "Dokumentation speichern",
      alreadyLoggedTitle: "Heute dokumentiert",
      alreadyLoggedBody:
        "Sie haben alle für heute geplanten Durchgänge dokumentiert. Vielen Dank!",
      documentedNotCompleted:
        "Mindestens ein Durchgang wurde als teilweise, zu schwierig oder nicht möglich angegeben und zählt deshalb nicht als vollständig erledigt.",
      errorNotFound:
        "Diese Übung gehört nicht (mehr) zu Ihrem aktuellen Übungsplan.",
      errorAlreadyLogged: "Alle aktuell geplanten Durchgänge sind bereits dokumentiert.",
      errorNotDueToday: "Diese Übung ist für heute nicht geplant.",
    },
    session: {
      title: "Heutige Übungen",
      backToToday: "Training beenden und zu Heute zurück",
      start: "Übungen starten",
      resume: "Weitermachen",
      viewSummary: "Zusammenfassung ansehen",
      nextHeading: "Nächster geplanter Durchgang",
      weekdaysShort: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"],
      progress: (documented: number, total: number) =>
        `${documented} von ${total} Durchgängen dokumentiert`,
      completedProgress: (completed: number, total: number) =>
        `${completed} von ${total} Durchgängen als erledigt angegeben`,
      autoContinueHint:
        "Nach dem Speichern wird automatisch der nächste offene Durchgang angezeigt.",
      saveAndContinue: "Speichern und weiter",
      summaryTitle: "Tageszusammenfassung",
      summaryDone: "Für heute sind alle geplanten Durchgänge dokumentiert.",
      summaryOpen: (remaining: number) =>
        `${remaining} ${remaining === 1 ? "Durchgang ist" : "Durchgänge sind"} noch offen.`,
      summaryFeedback: (count: number) =>
        `${count} ${count === 1 ? "Rückmeldung wurde" : "Rückmeldungen wurden"} nicht als vollständig erledigt angegeben.`,
      noSessionToday: "Heute ist kein Durchgang geplant.",
      timer: {
        heading: "Optionaler Timer",
        start: "Starten",
        pause: "Pause",
        reset: "Zurücksetzen",
        finished: "Zeit abgelaufen.",
        hint: "Der Timer ist nur eine Hilfe. Er dokumentiert die Übung nicht automatisch.",
      },
    },
    appointments: {
      title: "Termine",
      upcoming: "Kommende Termine",
      past: "Vergangene Termine",
      pastToggle: (count: number) =>
        count === 1 ? "1 vergangener Termin" : `${count} vergangene Termine`,
      empty: "Es sind keine Termine geplant.",
      cancellationReason: "Grund (optional)",
      cancelToggle: "Termin absagen",
      requestCancellation: "Terminabsage anfragen",
      cancellationRequestedBanner:
        "Ihre Absageanfrage wurde an die Praxis gesendet.",
      status: {
        scheduled: "Geplant",
        cancellation_requested: "Absage angefragt",
        cancelled: "Abgesagt",
        completed: "Abgeschlossen",
      },
      offersHeading: "Terminangebote Ihrer Praxis",
      offersHint:
        "Ihre Praxis hat Ihnen diese Zeitfenster angeboten. Wenn Sie annehmen, ist der Termin verbindlich gebucht.",
      acceptOffer: "Termin annehmen",
      declineOffer: "Ablehnen",
    },
    authorization: {
      title: "Ihre verordneten Sitzungen",
      remaining: (remaining: number, total: number) =>
        `${remaining} von ${total} Sitzungen verbleiben`,
      coverageHintTitle: "Hinweis zur Kostenübernahme",
      coverageHint:
        "Der angezeigte Stand dient Ihrer Übersicht. Ob eine Sitzung von der Krankenkasse übernommen wird, richtet sich nach Ihrer Verordnung und den geltenden Bedingungen.",
      empty: "Ihre Praxis hat noch keine Sitzungsanzahl hinterlegt.",
    },
    profile: {
      title: "Profil",
      personalHeading: "Persönliche Daten",
      appearance: {
        heading: "Darstellung",
        label: "Wie soll die App aussehen?",
        light: "Hell",
        dark: "Dunkel",
        hint: "Die Wahl gilt für dieses Gerät und wirkt sofort.",
      },
      avatar: {
        heading: "Profilbild",
        hint: (maxMb: number) =>
          `Freiwillig. JPEG, PNG oder WebP, maximal ${maxMb} MB. Nur Sie und Ihre aktuell verbundene Praxis sehen das Bild.`,
        choose: "Bild auswählen",
        replace: "Anderes Bild wählen",
        save: "Profilbild speichern",
        cancel: "Auswahl verwerfen",
        remove: "Profilbild entfernen",
        removeConfirm:
          "Möchten Sie Ihr Profilbild wirklich entfernen? Danach zeigt die App wieder Ihre Initialen.",
        previewAlt: "Vorschau des neuen Profilbilds",
        previewHint:
          "Das ist eine Vorschau. Das Bild wird erst nach „Profilbild speichern“ übernommen.",
        progress: (value: number) => `Upload: ${value} %`,
        unsupportedType:
          "Dieser Dateityp wird nicht unterstützt. Bitte wählen Sie ein Bild im Format JPEG, PNG oder WebP.",
        tooLarge: (maxMb: number) =>
          `Die Datei ist zu groß. Erlaubt sind höchstens ${maxMb} MB.`,
        uploadFailed: "Der Upload hat nicht funktioniert. Bitte versuchen Sie es erneut.",
      },
      securityHeading: "Sicherheit",
      remindersHeading: "Erinnerungen",
      practiceHeading: "Ihre Praxis",
      signOutHeading: "Abmelden",
      deleteAccount: {
        heading: "Konto löschen",
        body: "Sie können die Löschung Ihres Kontos beantragen. Ihr Zugang wird sofort gesperrt; Profilbild, Telefonnummer und Erinnerungseinstellungen werden sofort gelöscht. Praxisbezogene Behandlungsdaten (Termine, Übungspläne, Selbstauskünfte, Verordnungen) bleiben gespeichert, bis die gesetzliche Aufbewahrungsfrist rechtlich bestätigt ist – das ist keine technische Lücke, sondern eine noch offene Rechtsfrage.",
        confirmLabel: "Ja, ich möchte mein Konto wirklich löschen",
        submit: "Löschung jetzt beantragen",
        cancel: "Abbrechen",
        success: "Ihr Löschantrag wurde verarbeitet. Sie wurden abgemeldet.",
        error: "Der Löschantrag konnte nicht verarbeitet werden. Bitte versuchen Sie es erneut oder kontaktieren Sie den Support.",
      },
      name: "Name",
      email: "E-Mail-Adresse",
      practice: "Ihre Praxis",
      noPractice: "Noch keine Praxis verbunden.",
      connectCta: "Mit Praxis verbinden",
      changePractice: "Praxis wechseln",
      phone: "Telefonnummer",
      phoneHint: "Optional. Ihre Praxis kann Sie so bei Terminfragen erreichen.",
      phonePlaceholder: "z. B. +352 621 123 456",
      phoneSave: "Telefonnummer speichern",
      phoneEmpty: "Keine Telefonnummer hinterlegt.",
      security: {
        changeEmailTitle: "E-Mail-Adresse ändern",
        currentEmail: "Aktuelle E-Mail-Adresse",
        newEmailLabel: "Neue E-Mail-Adresse",
        changeEmailHint:
          "Zur Sicherheit schicken wir eine Bestätigung an Ihre bisherige und an die neue Adresse. Die Änderung gilt erst, wenn Sie beide E-Mails bestätigt haben. Bis dahin bleibt Ihre bisherige Adresse gültig.",
        changeEmailSubmit: "Änderung anfordern",
        changeEmailRequested:
          "Fast geschafft! Wir haben Ihnen zwei E-Mails geschickt – an Ihre bisherige und an Ihre neue Adresse. Bitte klicken Sie in beiden auf den Bestätigungslink.",
        pendingChange: (email: string) =>
          `Eine Änderung zu ${email} wartet noch auf Bestätigung. Bis dahin gilt Ihre bisherige Adresse.`,
        emailConfirmed: "Danke! Ihre Bestätigung wurde gespeichert.",
        emailSame: "Das ist bereits Ihre aktuelle E-Mail-Adresse.",
        emailUnavailable:
          "Diese E-Mail-Adresse kann nicht verwendet werden. Bitte wählen Sie eine andere.",
        rateLimited:
          "Zu viele Anfragen. Bitte warten Sie einen Moment und versuchen Sie es dann erneut.",
        requestError:
          "Die E-Mail konnte nicht versendet werden. Bitte versuchen Sie es später erneut.",
        changePasswordTitle: "Passwort ändern",
        changePasswordHint:
          "Wir schicken Ihnen eine E-Mail an Ihre hinterlegte Adresse. Über den Link darin legen Sie Ihr neues Passwort fest.",
        changePasswordSubmit: "Passwort ändern",
        passwordMailSent:
          "Wir haben Ihnen eine E-Mail geschickt. Bitte öffnen Sie den Link darin, um Ihr neues Passwort festzulegen.",
      },
    },
    reminders: {
      title: "Erinnerungen",
      intro:
        "Sie entscheiden selbst, welche freiwilligen Hinweise PhysioCheck in der App zeigt.",
      exerciseTitle: "Hinweise zu fälligen Übungen",
      exerciseHint:
        "Zeigt auf „Heute“ einen Hinweis, wenn noch geplante Durchgänge offen sind.",
      planUpdatesTitle: "Hinweise zu Planänderungen",
      planUpdatesHint:
        "Zeigt neue oder archivierte Übungspläne als ungelesenen Hinweis an.",
      quietHours: "Ruhezeit",
      quietHoursHint:
        "Während dieser Zeit werden keine Hinweise zu offenen Übungen eingeblendet. Gleiche Start- und Endzeit schaltet die Ruhezeit aus.",
      quietStart: "Beginn",
      quietEnd: "Ende",
      save: "Erinnerungen speichern",
      saved: "Ihre Erinnerungseinstellungen wurden gespeichert.",
      saveError: "Die Erinnerungseinstellungen konnten nicht gespeichert werden.",
      dueTitle: "Für heute sind noch Übungen offen",
      dueBody: (count: number) =>
        count === 1
          ? "Ein geplanter Durchgang kann noch dokumentiert werden."
          : `${count} geplante Durchgänge können noch dokumentiert werden.`,
      continue: "Übungen fortsetzen",
      planUpdatesHeading: "Neue Hinweise zu Ihrem Übungsplan",
      markRead: "Als gelesen markieren",
      readError: "Der Hinweis konnte nicht als gelesen markiert werden.",
    },
    messages: {
      title: "Nachrichten",
      emptyState:
        "Noch keine Nachrichten. Schreiben Sie Ihrer Praxis, wenn Sie eine Frage haben.",
      noPracticeConnected: "Sie sind aktuell mit keiner Praxis verbunden.",
      placeholder: "Ihre Nachricht …",
      send: "Senden",
      sending: "Wird gesendet …",
      sendError: "Die Nachricht konnte nicht gesendet werden.",
      resend: "Erneut senden",
      sentAt: (time: string) => `Gesendet um ${time}`,
      safetyNotice:
        "Nachrichten werden nicht ständig überwacht. Wenden Sie sich in einem medizinischen Notfall an den zuständigen Notdienst.",
    },
  },

  practice: {
    nav: {
      dashboard: "Übersicht",
      patients: "Patienten",
      exercises: "Übungsbibliothek",
      appointments: "Termine",
      calendar: "Kalender",
      waitlist: "Warteliste",
      messages: "Nachrichten",
      settings: "Einstellungen",
      help: "Hilfe",
    },
    search: {
      triggerLabel: "Schnellsuche",
      shortcutHint: "Strg+K",
      dialogTitle: "Suche",
      dialogDescription: "Schnell zu Patienten, Übungen oder einem Bereich springen.",
      placeholder: "Patienten, Übungen oder Bereiche suchen …",
      sectionQuickLinks: "Bereiche",
      sectionPatients: "Patienten",
      sectionExercises: "Übungen",
      noResults: "Keine Treffer.",
      minChars: "Mindestens 2 Zeichen eingeben.",
    },
    /**
     * Hilfecenter für Praxismitarbeitende (Phase K). Beschreibt bewusst nur
     * tatsächlich vorhandenes Verhalten (z. B. gibt es aktuell KEINE
     * Möglichkeit, eine Patientenverbindung von der Praxis aus zu lösen –
     * das darf hier nicht behauptet werden).
     */
    help: {
      title: "Hilfecenter",
      intro:
        "Antworten zu den häufigsten Fragen der Praxisverwaltung. Nichts hier ersetzt eine medizinische Einschätzung – es geht ausschließlich um die Bedienung der App.",
      searchLabel: "Hilfeartikel durchsuchen",
      searchPlaceholder: "z. B. Termin, Übung, Nachricht …",
      noResults: "Keine Hilfeartikel zu diesem Suchbegriff gefunden.",
      contactHint: "Frage nicht dabei? Schreiben Sie uns – Kontakt steht in den Praxis-Einstellungen.",
      sections: [
        {
          id: "patients",
          title: "Patienten",
          items: [
            {
              q: "Wie verbinde ich eine neue Patientin oder einen neuen Patienten?",
              a: "Legen Sie unter „Patienten“ eine Einladung an. Sie erhalten einen Code bzw. Link, der 7 Tage gültig und nur einmal einlösbar ist – geben Sie ihn direkt weiter, er wird danach nicht erneut angezeigt. Offene Einladungen können Sie jederzeit widerrufen oder erneuern.",
            },
            {
              q: "Kann ich eine Patientenverbindung von der Praxis aus lösen?",
              a: "Nein – die Verbindung wird ausschließlich von der Patientenseite verwaltet: Wechselt jemand zu einer anderen Praxis, endet die bisherige Verbindung automatisch. Die Praxis selbst hat aktuell keine Möglichkeit, eine Verbindung zu entfernen.",
            },
            {
              q: "Was bedeutet „Kalenderfarbe“ bei einem Patienten?",
              a: "Eine rein interne Farbmarkierung (z. B. Petrol, Indigo, Bernstein), damit Sie Termine im Kalender schneller zuordnen können. Der Name steht immer zusätzlich dabei – die Farbe ist nie das einzige Erkennungsmerkmal und für Patienten nicht sichtbar.",
            },
            {
              q: "Wofür ist die „Markierung“ bei einem Patienten?",
              a: "Ein internes Anheften mit optionaler kurzer Notiz (max. 200 Zeichen), z. B. für Patienten, die gerade besondere Aufmerksamkeit brauchen. Nur für die Praxis sichtbar, keine Gesundheitsdaten in der Notiz.",
            },
            {
              q: "Was ist das „Interne Kurzprofil“?",
              a: "Ein freier Text (max. 2000 Zeichen) je Patient, den nur Ihre Praxis sieht – Patienten sehen ihn nicht. Gedacht für organisatorische Notizen, bewusst ohne Diagnosen.",
            },
            {
              q: "Was passiert beim „Archivieren“ bei einem Patienten?",
              a: "„Archivieren“ gibt es bei einer Verordnung (Behandlungskontingent), nicht beim Patienten selbst – eine archivierte Verordnung zählt keine weiteren Sitzungen mehr an, bleibt aber in der Historie sichtbar. Patientendaten werden nie hart gelöscht.",
            },
          ],
        },
        {
          id: "appointments",
          title: "Termine & Kalender",
          items: [
            {
              q: "Was ist der Unterschied zwischen „Termin fest buchen“ und einem Terminangebot?",
              a: "Fest gebucht heißt: der Termin steht sofort und verbindlich, sichtbar für Patient und Praxis. Ein Terminangebot (auf der Warteliste-Seite) ist dagegen ein Vorschlag für einen freigewordenen Slot – die Patientin oder der Patient muss ihn erst aktiv annehmen, bevor daraus ein echter Termin wird.",
            },
            {
              q: "Was ist der Unterschied zwischen „Stornieren“ und „Als abgeschlossen markieren“?",
              a: "Stornieren sagt einen Termin ab (mit Grund, informiert die Patientenseite) – die verordnete Sitzung wird NICHT angerechnet. Abschließen markiert einen wahrgenommenen Termin und rechnet dabei genau eine Sitzung der aktiven Verordnung an, falls eine vorhanden ist. Ein Abschluss lässt sich bei Bedarf wieder rückgängig machen.",
            },
            {
              q: "Kann ein Termin in der Vergangenheit angelegt werden?",
              a: "Nein, ein fest gebuchter Termin muss in der Zukunft liegen – das wird beim Speichern geprüft.",
            },
          ],
        },
        {
          id: "waitlist",
          title: "Warteliste & Terminangebote",
          items: [
            {
              q: "Wofür ist die Warteliste?",
              a: "Eine interne Liste von Patientinnen und Patienten, die gerne früher einen Termin hätten – mit Wunschzeiten, Priorität und einer optionalen Notiz. Pro Patient ist immer nur ein offener Eintrag möglich.",
            },
            {
              q: "Wie wird ein freigewordener Termin an die Warteliste vergeben?",
              a: "Wird ein Termin storniert, erscheint der freie Slot auf der Warteliste-Seite. Von dort aus können Sie ihn gezielt als Terminangebot an eine gewartelistete Person schicken – das geschieht nicht automatisch, sondern ist immer ein bewusster Schritt.",
            },
          ],
        },
        {
          id: "exercises",
          title: "Übungsbibliothek & Pläne",
          items: [
            {
              q: "Wie füge ich einer neuen Übung ein Video hinzu?",
              a: "Nach dem Anlegen landen Sie direkt auf der Bearbeitungsseite der Übung – dort steht sofort die Medienverwaltung für Video, Vorschaubild, Alternativbild und Untertitel bereit, im selben Arbeitsschritt wie das Anlegen.",
            },
            {
              q: "Was ist der Unterschied zwischen „Deaktivieren“ und „Archivieren“ bei einer Übung?",
              a: "Deaktiviert erscheint eine Übung nicht mehr in NEUEN Plänen, bestehende Pläne bleiben unverändert. Archiviert ist eine Übung komplett aus der Bibliothek ausgeblendet. In beiden Fällen bleiben alte Pläne und Dokumentationen vollständig lesbar – Übungen werden nie endgültig gelöscht.",
            },
            {
              q: "Was passiert, wenn ich einen veröffentlichten Übungsplan bearbeite?",
              a: "Jede Veröffentlichung legt eine neue, unveränderliche Planversion an. Bereits dokumentierte Durchführungen bleiben dabei an ihre damalige Version gebunden (per „Verordnungs-Schnappschuss“) – eine spätere Planänderung kann frühere Dokumentationen also nie nachträglich verfälschen.",
            },
          ],
        },
        {
          id: "messages",
          title: "Nachrichten",
          items: [
            {
              q: "Wie viele Unterhaltungen gibt es pro Patient?",
              a: "Genau eine gemeinsame Unterhaltung je Patient und Praxis – alle Nachrichten landen an einem Ort.",
            },
            {
              q: "Was passiert mit Nachrichten, wenn ein Patient die Praxis wechselt?",
              a: "Die bisherige Unterhaltung bleibt erhalten, aber Ihre Praxis verliert ab dem Wechsel sowohl Lese- als auch Antwortrecht – ein Antwortversuch wird dann abgelehnt.",
            },
            {
              q: "Gibt es ein Limit für Nachrichten?",
              a: "Ja, aus Missbrauchsschutz maximal 20 Nachrichten pro Minute je Unterhaltung und Absender.",
            },
          ],
        },
        {
          id: "documents",
          title: "Dokumente & Patientenakte",
          items: [
            {
              q: "Welche Dokumentkategorien gibt es?",
              a: "Verordnung, Befund, Patientenakte, Therapiebericht und Sonstiges.",
            },
            {
              q: "Werden hochgeladene Dateien auf Schadsoftware geprüft?",
              a: "Dateityp, Größe und der tatsächliche Dateiinhalt (nicht nur die Endung) werden immer serverseitig geprüft; ein zusätzlicher Virenscan läuft dort, wo er in der Betriebsumgebung aktiviert ist. Erlaubt sind PDF, JPEG und PNG bis 20 MB.",
            },
            {
              q: "Wie lösche ich ein Dokument endgültig?",
              a: "Zweistufig mit Absicht: erst archivieren, danach kann ein bereits archiviertes Dokument endgültig gelöscht werden. Ein direktes Löschen ohne vorheriges Archivieren ist nicht möglich.",
            },
          ],
        },
        {
          id: "settings",
          title: "Einstellungen & Team",
          items: [
            {
              q: "Was dürfen Admins, was Therapeutinnen und Therapeuten?",
              a: "Im laufenden Praxisalltag (Patienten, Termine, Übungen, Dokumente, Nachrichten, Warteliste) haben beide Rollen dieselben Rechte. Nur die Praxis-Einstellungen und die Teamverwaltung (neue Mitarbeitende einladen, Rollen ändern) sind Admins vorbehalten – Therapeutinnen und Therapeuten sehen diese Seite nur lesend.",
            },
            {
              q: "Wie lade ich eine neue Kollegin oder einen neuen Kollegen ein?",
              a: "Nur als Admin: in den Einstellungen eine Team-Einladung mit E-Mail-Adresse und Rolle (Admin oder Therapeut:in) anlegen. Der Einladungslink ist 7 Tage gültig; die Anmeldung funktioniert nur mit genau der eingeladenen E-Mail-Adresse.",
            },
          ],
        },
        {
          id: "search",
          title: "Schnellsuche",
          items: [
            {
              q: "Wie öffne ich die Schnellsuche?",
              a: "Mit Strg+K (Windows/Linux) bzw. Cmd+K (Mac) von jeder Praxisseite aus, oder über den Suchen-Knopf oberhalb der Navigation.",
            },
            {
              q: "Was findet die Schnellsuche?",
              a: "Patienten (nach Name) und Übungen (nach Titel) Ihrer Praxis, dazu alle Hauptbereiche als schnelle Sprungziele. Termine, Dokumente, Nachrichten und Warteliste werden aktuell nicht durchsucht.",
            },
          ],
        },
      ],
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
      painIncrease: (before: number, after: number) =>
        `Schmerzangabe gestiegen: ${before} auf ${after} von 10`,
      authorizationWarnings: "Verordnungswarnungen",
      emptyAuthorizationWarnings:
        "Keine Warnungen – Einheiten und Gültigkeit sind überall ausreichend.",
      logStatus: {
        completed: "Erledigt",
        partial: "Teilweise erledigt",
        too_difficult: "Zu schwierig",
        not_possible: "Nicht möglich",
      },
    },
    analytics: {
      heading: "Übungsfortschritt",
      dashboardHeading: (days: number) => `Übungsfortschritt der letzten ${days} Tage`,
      currentPlanHint:
        "Die Soll-Werte werden aus der aktuellen Planversion für den gewählten Zeitraum berechnet. Alle Rückmeldungen sind Selbstauskünfte.",
      planned: "Geplante Durchgänge",
      documented: "Dokumentierte Durchgänge",
      completed: "Als erledigt angegeben",
      feedback: "Andere Rückmeldungen",
      difficult: "Zu schwierig",
      notPossible: "Nicht möglich",
      partial: "Teilweise",
      painFlags: "Markierte Schmerzveränderungen",
      unread: "Ungelesene Rückmeldungen",
      newBadge: "Neu",
      inactiveBadge: "Keine Dokumentation im Zeitraum",
      lastActivity: "Letzte Dokumentation",
      noActivity: "Noch keine Dokumentation im aktuellen Plan.",
      noPlan: "Kein aktiver Übungsplan für die Auswertung.",
      noPatients: "Keine aktiven Patienten für die Auswertung.",
      exerciseBreakdown: "Aufschlüsselung nach Übung",
      openExercise: "Übung öffnen",
      openPlan: "Zum aktuellen Plan",
      rangeLabel: (days: number) => `Auswertung für die letzten ${days} Tage`,
      ratio: (documented: number, planned: number) =>
        `${documented} von ${planned} dokumentiert`,
      completedRatio: (completed: number, planned: number) =>
        `${completed} von ${planned} als erledigt angegeben`,
      issueCount: (count: number) =>
        `${count} ${count === 1 ? "auffällige Rückmeldung" : "auffällige Rückmeldungen"}`,
      markReviewed: "Als gelesen markieren",
      reviewed: "Die Rückmeldung wurde als gelesen markiert.",
      reviewError: "Die Rückmeldung konnte nicht als gelesen markiert werden.",
      loadError: "Die Fortschrittsauswertung konnte nicht geladen werden.",
      unknownPatient: "Unbekannter Patient",
    },
    patients: {
      title: "Patienten",
      searchLabel: "Nach Name suchen",
      searchPlaceholder: "Nach Name suchen …",
      searchButton: "Suchen",
      warningFilterLabel: "Nur Patienten mit Verordnungswarnung",
      warningBadge: "Verordnungswarnung",
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
      qrAlt: "QR-Code mit dem Einladungslink",
      qrHint:
        "Der Patient kann diesen QR-Code mit der Handykamera scannen und landet direkt bei der Code-Eingabe – praktisch für Patienten, die keine Links tippen möchten.",
    },
    patientDetail: {
      backToList: "Zurück zur Patientenliste",
      connectedSince: (date: string) => `Verbunden seit ${date}`,
      calendarColor: {
        heading: "Kalenderfarbe",
        hint:
          "Termine dieses Patienten erscheinen im Kalender in dieser Farbe. Der Name steht immer zusätzlich dabei. Die Farbe ist nur für die Praxis sichtbar.",
        none: "Keine Farbe",
        save: "Farbe speichern",
        saved: "Kalenderfarbe gespeichert.",
      },
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
      occurrence: (index: number) => `Durchgang ${index}`,
      contactHeading: "Kontakt",
      phoneLabel: "Telefonnummer",
      phoneEmpty: "Keine Telefonnummer hinterlegt.",
      phoneEditHint:
        "Wird auch dem Patienten im Profil angezeigt. Bitte nur Kontaktdaten, keine Gesundheitsinformationen.",
      phoneSave: "Telefonnummer speichern",
    },
    exercises: {
      title: "Übungsbibliothek",
      empty:
        "Noch keine Übungen in der Bibliothek. Legen Sie die erste Übung an.",
      emptyFiltered: "Keine Übungen für die gewählten Filter.",
      addExercise: "Übung anlegen",
      newTitle: "Neue Übung",
      editTitle: "Übung bearbeiten",
      inactive: "Inaktiv",
      archived: "Archiviert",
      hasVideo: "Video",
      searchLabel: "Nach Titel suchen",
      categoryFilter: "Kategorie",
      allCategories: "Alle Kategorien",
      equipmentFilter: "Hilfsmittel",
      showArchived: "Archivierte anzeigen",
      fields: {
        title: "Titel",
        description: "Kurzbeschreibung",
        startingPosition: "Ausgangsposition",
        steps: "Durchführungsschritte (eine Zeile pro Schritt)",
        commonMistakes: "Häufige Fehler",
        equipment: "Benötigte Hilfsmittel",
        category: "Kategorie / Körperregion",
        categoryPlaceholder: "z. B. Rücken, Knie, Schulter",
        dosageType: "Standard-Dosierungsart",
        dosageRepetitions: "Wiederholungen",
        dosageDuration: "Dauer",
        sets: "Standard-Sätze",
        repetitions: "Standard-Wiederholungen",
        holdSeconds: "Standard-Haltezeit (Sek.)",
        totalDurationSeconds: "Standard-Gesamtdauer (Sek.)",
        restSeconds: "Standard-Pause (Sek.)",
      },
      save: "Übung speichern",
      create: "Übung anlegen",
      duplicate: "Duplizieren",
      deactivate: "Deaktivieren",
      activate: "Aktivieren",
      archive: "Archivieren",
      unarchive: "Aus dem Archiv holen",
      inactiveHint:
        "Deaktivierte Übungen erscheinen nicht in neuen Plänen; bestehende Pläne bleiben unverändert.",
      archiveHint:
        "Archivierte Übungen sind aus der Bibliothek ausgeblendet. Alte Pläne und Dokumentationen bleiben vollständig lesbar – Übungen werden nie endgültig gelöscht.",
      saved: "Die Übung wurde gespeichert.",
      media: {
        heading: "Video und weitere Medien",
        securityHint:
          "Alle Dateien bleiben privat. Patienten erhalten nur dann einen kurzlebigen Zugriff, wenn die Übung ihrem aktuellen Plan zugewiesen ist.",
        kind: {
          video: "Übungsvideo",
          thumbnail: "Vorschaubild",
          fallback_image: "Alternativbild",
          captions: "Untertitel",
        },
        hint: {
          video: (limit: string) => `MP4 oder WebM, maximal ${limit}. Kein automatischer Tonstart.`,
          thumbnail: (limit: string) => `JPEG oder PNG, maximal ${limit}. Wird vor dem Video angezeigt.`,
          fallback_image: (limit: string) =>
            `JPEG oder PNG, maximal ${limit}. Wird angezeigt, wenn kein Video vorhanden ist.`,
          captions: (limit: string) => `WebVTT-Datei (.vtt), maximal ${limit}.`,
        },
        none: "Noch keine Datei hinterlegt.",
        chooseFile: "Datei auswählen",
        chooseReplacement: "Neue Datei zum Ersetzen auswählen",
        upload: "Hochladen",
        replace: "Datei ersetzen",
        remove: "Entfernen",
        removeConfirm: (label: string) => `${label} wirklich entfernen?`,
        progress: (value: number) => `Upload: ${value} %`,
        unsupportedType: "Dieser Dateityp wird nicht unterstützt.",
        tooLarge: (limit: string) => `Die Datei ist größer als ${limit}.`,
        uploadFailed: "Der Upload ist fehlgeschlagen.",
        cancelUpload: "Abbrechen",
        uploadCancelled: "Der Upload wurde abgebrochen.",
        openCaptions: "Untertiteldatei öffnen",
      },
      createdBanner: {
        title: "Übung angelegt",
        body: "Fügen Sie jetzt direkt ein Video oder Bild hinzu – die Übung ist bereits gespeichert.",
      },
      preview: {
        heading: "So sehen Patient:innen diese Übung",
        hint: "Vorschau mit den Standardvorgaben. Zeitplan und Hinweise werden erst im Übungsplan des Patienten festgelegt.",
      },
    },
    plans: {
      heading: "Übungsplan erstellen und anpassen",
      intro:
        "Stellen Sie die Übungen für diesen Patienten zusammen. Beim Veröffentlichen entsteht immer eine neue, unveränderliche Version; frühere Dokumentationen bleiben ihrem damaligen Plan zugeordnet.",
      titleLabel: "Name des Plans",
      titlePlaceholder: "z. B. Knie – Aufbauphase",
      libraryLabel: "Übung aus der Bibliothek",
      selectExercise: "Übung auswählen …",
      addExercise: "Übung hinzufügen",
      noExercises:
        "Es ist keine weitere aktive Übung verfügbar. Legen Sie bei Bedarf zuerst eine Übung in der Bibliothek an.",
      emptyPlan: "Fügen Sie mindestens eine Übung hinzu.",
      startDate: "Startdatum",
      endDate: "Enddatum (optional)",
      schedule: "Häufigkeit",
      fixedDays: "An bestimmten Wochentagen",
      flexibleWeek: "An frei gewählten Tagen pro Woche",
      weekdays: ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"],
      timesPerDay: "Durchgänge pro geplantem Tag",
      timesPerWeek: "Durchgänge pro Woche",
      preferredTimes: "Empfohlene Uhrzeiten (optional)",
      preferredTime: (number: number) => `Uhrzeit ${number}`,
      dosage: "Individuelle Vorgaben",
      sets: "Sätze",
      repetitions: "Wiederholungen",
      holdSeconds: "Haltezeit (Sek.)",
      totalDurationSeconds: "Gesamtdauer (Sek.)",
      restSeconds: "Pause (Sek.)",
      note: "Hinweis an den Patienten (optional)",
      moveUp: "Nach oben",
      moveDown: "Nach unten",
      remove: "Aus Plan entfernen",
      changeNote: "Änderungshinweis für die Versionshistorie (optional)",
      changeNotePlaceholder: "z. B. Wiederholungen nach Rücksprache erhöht",
      preview: "Vorschau der Vorgabe",
      publish: "Plan veröffentlichen",
      published: "Der Übungsplan wurde als neue Version veröffentlicht.",
      currentVersion: (version: number) => `Aktuell: Version ${version}`,
      history: "Versionshistorie",
      version: (version: number) => `Version ${version}`,
      initialVersion: "Erste Planversion",
      archive: "Aktiven Plan archivieren",
      archiveConfirm:
        "Aktiven Plan wirklich archivieren? Der Patient sieht danach keinen aktiven Plan mehr. Die Historie bleibt erhalten.",
      archived: "Der Übungsplan wurde archiviert.",
      loadError: "Der Übungsplan konnte nicht geladen werden.",
      publishError: "Der Übungsplan konnte nicht veröffentlicht werden.",
      archiveError: "Der Übungsplan konnte nicht archiviert werden.",
      invalidItems: "Bitte prüfen Sie die Übungen und ihre Vorgaben.",
      unknownExercise: "Unbekannte Übung",
      scheduleSummary: {
        fixed: (days: string, times: number) =>
          `${days} · ${times} ${times === 1 ? "Durchgang" : "Durchgänge"} pro Tag`,
        flexible: (times: number) =>
          `${times} ${times === 1 ? "Durchgang" : "Durchgänge"} pro Woche, Tage frei wählbar`,
      },
    },
    appointments: {
      title: "Termine",
      empty: "Keine Termine im ausgewählten Zeitraum.",
      addAppointment: "Termin anlegen",
    },
    offers: {
      freedSlotsHeading: "Frei gewordene Zeitfenster",
      freedSlotsHint: "Zukünftige Zeitfenster aus stornierten Terminen – Kandidaten für ein Angebot an die Warteliste.",
      freedSlotsEmpty: "Keine frei gewordenen Zeitfenster.",
      offersHeading: "Terminangebote",
      offersEmpty: "Keine Angebote vorhanden.",
      createTitle: "Termin anbieten",
      dateLabel: "Datum",
      startTimeLabel: "Startzeit",
      durationLabel: "Dauer",
      therapistLabel: "Behandelnde Person",
      create: "Angebot senden",
      withdraw: "Angebot zurückziehen",
      status: {
        offered: "Offen",
        accepted: "Angenommen",
        declined: "Abgelehnt",
        withdrawn: "Zurückgezogen",
      },
    },
    waitlist: {
      title: "Warteliste",
      hint: "Interne Liste von Patienten, die auf (weitere) Termine warten. Patienten sehen die Liste nicht. Keine Gesundheitsdaten in Wunschzeiten oder Notiz.",
      addTitle: "Patient auf die Warteliste setzen",
      patientLabel: "Patient",
      patientPlaceholder: "Patient auswählen …",
      preferredTimesLabel: "Wunschzeiten (optional)",
      preferredTimesPlaceholder: "z. B. dienstags oder donnerstags vormittags",
      priorityLabel: "Priorität",
      priorityNormal: "Normal",
      priorityHigh: "Hoch",
      noteLabel: "Interne Notiz (optional)",
      add: "Auf die Warteliste setzen",
      waitingHeading: "Wartend",
      resolvedHeading: "Erledigt",
      emptyWaiting: "Niemand wartet aktuell.",
      resolve: "Als erledigt markieren",
      delete: "Eintrag löschen",
      waitingSince: (date: string) => `wartet seit ${date}`,
      resolvedAt: (date: string) => `erledigt am ${date}`,
    },
    pinned: {
      heading: "Markierung",
      hint: "Nur für die Praxis sichtbar – zum Anheften von Patienten, die gerade besondere Aufmerksamkeit brauchen. Keine Gesundheitsdaten in der Notiz.",
      pinnedState: "Dieser Patient ist markiert.",
      noteLabel: "Kurze Notiz (optional, max. 200 Zeichen)",
      notePlaceholder: "z. B. Rückruf wegen Terminplanung",
      pin: "Patient markieren",
      unpin: "Markierung entfernen",
      badge: "Markiert",
      dashboardTitle: "Markierte Patienten",
      dashboardEmpty: "Keine markierten Patienten.",
      filterLabel: "Nur markierte Patienten",
    },
    documents: {
      filterCategory: "Kategorie filtern",
      filterAllCategories: "Alle Kategorien",
      filterShowArchived: (count: number) =>
        count === 1 ? "1 archiviertes Dokument anzeigen" : `${count} archivierte Dokumente anzeigen`,
      filterEmpty: "Keine Dokumente für die gewählten Filter.",
      deleteButton: "Endgültig löschen",
      deleteConfirm: "Ja, endgültig löschen",
      deleteConfirmHint:
        "Das Dokument und die Datei werden dauerhaft gelöscht. Das kann nicht rückgängig gemacht werden.",
    },
    internalProfile: {
      heading: "Internes Kurzprofil",
      hint: "Nur für die Praxis sichtbar – Patienten sehen diesen Text nicht. Bitte sachlich bleiben; keine Diagnosen nötig.",
      label: "Kurzprofil (max. 2000 Zeichen)",
      save: "Kurzprofil speichern",
      updatedAt: (date: string) => `Zuletzt aktualisiert: ${date}`,
    },
    authorizations: {
      title: "Verordnete Sitzungen",
      coverageHint:
        "Hinterlegen und korrigieren Sie die verordnete Anzahl. Ein abgeschlossener Termin rechnet genau eine Einheit an; jede Änderung bleibt in der Historie erhalten.",
      add: "Neue Verordnung anlegen",
      save: "Verordnung speichern",
      historyTitle: "Historie",
      warning: {
        no_units: "Keine Behandlungseinheit mehr verfügbar.",
        low_units: (remaining: number) =>
          remaining === 1
            ? "Nur noch 1 Behandlungseinheit verfügbar."
            : `Nur noch ${remaining} Behandlungseinheiten verfügbar.`,
        expired: (date: string) => `Die Verordnung ist seit dem ${date} abgelaufen.`,
        expires_soon: (date: string, daysLeft: number) =>
          daysLeft === 0
            ? `Die Verordnung läuft heute (${date}) ab.`
            : `Die Verordnung läuft am ${date} ab (noch ${daysLeft === 1 ? "1 Tag" : `${daysLeft} Tage`}).`,
      },
      ledger: {
        initial_allocation: "Anfangskontingent",
        manual_increase: "Manuelle Erhöhung",
        manual_decrease: "Manuelle Verringerung",
        appointment_completed: "Termin angerechnet",
        appointment_completion_reversed: "Anrechnung zurückgebucht",
      },
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
      completeHint: "Markiert den Termin als tatsächlich durchgeführt und rechnet genau eine Behandlungseinheit an.",
      complete: "Als abgeschlossen markieren",
      zeroUnitsWarning:
        "Hinweis: Für diesen Patienten ist aktuell keine Behandlungseinheit verfügbar. Der Termin kann trotzdem abgeschlossen werden – es wird dann nichts angerechnet, der Stand bleibt bei 0 und wird nicht negativ.",
      reverseTitle: "Abschluss zurücknehmen",
      reverseHint:
        "Setzt den Termin zurück auf „Geplant“. Eine angerechnete Behandlungseinheit wird dabei genau einmal zurückgebucht; die Historie bleibt vollständig erhalten.",
      reverse: "Abschluss zurücknehmen",
      cancelTitle: "Termin stornieren",
      cancelHint: "Der Termin bleibt in der Historie. Der Patient wird benachrichtigt.",
      cancelReason: "Grund (optional, keine Gesundheitsdetails)",
      cancelAppointment: "Termin endgültig stornieren",
      legend: "Farben der Patienten",
    },
    settings: {
      title: "Einstellungen",
      practiceData: "Praxisdaten",
      editProfile: "Praxisdaten bearbeiten",
      membersHeading: "Mitarbeitende Ihrer Praxis",
      onlyAdminsCanManage: "Nur Praxisadmins können Mitarbeitende verwalten und einladen.",
    },
    messages: {
      title: "Nachrichten",
      searchPlaceholder: "Patient:in suchen …",
      filterAll: "Alle",
      filterUnread: "Ungelesen",
      filterOpen: "Offen",
      filterAnswered: "Beantwortet",
      emptyList: "Keine Unterhaltungen gefunden.",
      openPatientDetail: "Zum Patientenprofil",
      backToList: "Zur Liste",
      placeholder: "Antwort schreiben …",
      send: "Senden",
      sending: "Wird gesendet …",
      sendError: "Die Nachricht konnte nicht gesendet werden.",
      resend: "Erneut senden",
      sentAt: (time: string) => `Gesendet um ${time}`,
      openConversation: "Nachrichten anzeigen",
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

  notifications: {
    planPublishedTitle: "Ihr Übungsplan wurde aktualisiert",
    planPublishedBody: "Ihre Praxis hat eine neue Version Ihres Übungsplans veröffentlicht.",
    planArchivedTitle: "Ihr Übungsplan wurde archiviert",
    planArchivedBody: "Ihre Praxis hat den bisherigen Übungsplan beendet.",
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
    notSignedIn: "Bitte melden Sie sich erneut an.",
  },

  profilePhone: {
    saved: "Telefonnummer gespeichert.",
    saveError: "Die Telefonnummer konnte nicht gespeichert werden.",
  },

  /**
   * Entwurf für die öffentliche Datenschutzerklärung (/privacy). Fasst
   * den tatsächlichen technischen Stand ehrlich zusammen (Basis:
   * docs/PRIVACY_SECURITY.md) – ersetzt aber KEINE juristische Prüfung.
   * Rechtsgrundlage, Aufbewahrungsfristen und der Verantwortliche sind
   * bewusst als offen markiert (siehe CLAUDE.md: keine Rechtskonformität
   * behaupten, die nicht bestätigt wurde).
   */
  legal: {
    privacyPolicy: {
      heading: "Datenschutzerklärung",
      draftNotice:
        "Dies ist ein technischer Entwurf, der den tatsächlichen Stand der Datenverarbeitung ehrlich beschreibt. Er wurde noch nicht von einer für Datenschutz zuständigen Person rechtlich geprüft oder freigegeben.",
      lastUpdated: "Stand",
      sections: [
        {
          title: "1. Verantwortlicher",
          body: "Der Name, die Anschrift und die Kontaktdaten des Verantwortlichen im Sinne der DSGVO stehen noch nicht endgültig fest (offene Entscheidung zur App-Identität). Bis zur Klärung erreichen Sie uns unter der unten genannten Support-Adresse.",
        },
        {
          title: "2. Welche Daten wir verarbeiten",
          body: "Kontodaten (Name, E-Mail-Adresse, optional Telefonnummer), die Verbindung zu Ihrer Physiotherapiepraxis, Ihr Übungsplan und die zugehörigen Vorgaben, Ihre Selbstauskünfte zur Übungsdurchführung (einschließlich freiwilliger Schmerzangaben), Termine, ein optionales Profilbild sowie technische Protokolldaten zur Absicherung des Kontos (z. B. wer wann eine Änderung vorgenommen hat – ohne Gesundheitsinhalte). Diagnosen oder automatisierte Therapieentscheidungen gehören nicht dazu: Dokumentierte Übungen sind Ihre eigene Selbstauskunft.",
        },
        {
          title: "3. Wofür wir diese Daten verwenden",
          body: "Ausschließlich, um Ihnen Ihren Übungsplan und Ihre Termine anzuzeigen, Ihre Selbstauskünfte an Ihre Praxis weiterzugeben und Ihr Konto sicher zu betreiben. Es gibt keine Werbung, kein Tracking und keine Weitergabe an Dritte zu anderen Zwecken.",
        },
        {
          title: "4. Rechtsgrundlage",
          body: "Die Verarbeitung von Gesundheitsdaten (Art. 9 DSGVO) benötigt eine ausdrückliche Rechtsgrundlage. Diese ist derzeit noch nicht abschließend juristisch bestätigt – das ist eine offene Rechtsfrage, keine technische Lücke.",
        },
        {
          title: "5. Empfänger und Auftragsverarbeitung",
          body: "Ihre Daten werden bei unserem Datenbank-/Infrastrukturanbieter Supabase gespeichert. Ein Auftragsverarbeitungsvertrag sowie die endgültige Wahl der Serverregion (angestrebt: EU/EWR) stehen noch aus. Ihre Praxis sieht ausschließlich die Daten, die für Ihre Behandlung notwendig sind.",
        },
        {
          title: "6. Speicherdauer und Löschung",
          body: "Sie können die Löschung Ihres Kontos jederzeit beantragen (siehe unsere Seite zur Kontolöschung). Dabei werden Ihr Zugang sofort gesperrt sowie Profilbild, Telefonnummer und Erinnerungseinstellungen sofort gelöscht. Praxisbezogene Behandlungsdaten bleiben gespeichert, bis die gesetzliche Aufbewahrungsfrist rechtlich abschließend geklärt ist – auch das ist eine offene Rechtsfrage, keine erfundene Ausnahme.",
        },
        {
          title: "7. Ihre Rechte",
          body: "Sie haben nach der DSGVO das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch sowie das Recht, sich bei einer Datenschutzaufsichtsbehörde zu beschweren. Kontaktieren Sie uns über die unten genannte Adresse, um diese Rechte auszuüben.",
        },
        {
          title: "8. Keine automatisierten Entscheidungen",
          body: "Wir treffen keine automatisierten Diagnose- oder Therapieentscheidungen und erstellen keine automatisierten Persönlichkeitsprofile. Hohe Schmerzangaben lösen höchstens einen neutralen, informativen Hinweis aus.",
        },
        {
          title: "9. Kontakt",
          body: "Bei Fragen zum Datenschutz oder zur Ausübung Ihrer Rechte schreiben Sie uns an die Support-E-Mail-Adresse dieser App.",
        },
      ],
    },
  },
  admin: {
    nav: {
      dashboard: "Übersicht",
      practices: "Praxen",
      config: "Plattform-Einstellungen",
    },
    dashboard: {
      title: "Betreiber-Übersicht",
      practicesTotal: "Praxen gesamt",
      practicesTrial: "in Testphase",
      practicesActive: "aktiv",
      practicesSuspended: "gesperrt",
      practicesArchived: "archiviert",
      trialsEndingSoonHeading: "Testphasen laufen bald ab",
      trialsEndingSoonEmpty: "Keine Testphase endet in den nächsten 14 Tagen.",
      activeStaffCount: "aktive Mitarbeitende",
      connectedPatientsCount: "verbundene Patient:innen",
      noAdminHeading: "Praxen ohne aktiven Admin",
      noAdminEmpty: "Jede Praxis hat mindestens einen aktiven Admin.",
      recentEventsHeading: "Letzte Betreiberereignisse",
      recentEventsEmpty: "Noch keine Ereignisse.",
      systemStatusHeading: "Systemstatus",
      systemStatusHealthy: "Gesund",
      systemStatusUnreachable: "Nicht erreichbar",
    },
    practices: {
      title: "Praxen",
      searchLabel: "Nach Namen suchen",
      searchPlaceholder: "Praxisname …",
      statusLabel: "Status",
      statusAll: "Alle",
      statusTrial: "Testphase",
      statusActive: "Aktiv",
      statusSuspended: "Gesperrt",
      statusArchived: "Archiviert",
      countryLabel: "Ort",
      newPractice: "Neue Praxis anlegen",
      empty: "Keine Praxen gefunden.",
      columnName: "Name",
      columnStatus: "Status",
      columnStaff: "Mitarbeitende",
      columnPatients: "Patient:innen",
      columnTrialEnd: "Testphase endet",
      columnCreated: "Angelegt",
    },
    onboarding: {
      title: "Neue Praxis anlegen",
      stepPractice: "1. Praxisdaten",
      stepAdmin: "2. Erste:r Praxisadmin",
      stepSummary: "3. Zusammenfassung",
      practiceName: "Praxisname",
      addressStreet: "Straße und Hausnummer",
      addressPostalCode: "Postleitzahl",
      addressCity: "Ort",
      country: "Land",
      timezone: "Zeitzone",
      phone: "Telefon",
      supportEmail: "Kontakt-/Support-E-Mail der Praxis",
      website: "Webseite (optional)",
      status: "Anfangsstatus",
      statusTrial: "Testphase",
      statusActive: "Sofort aktiv",
      trialEndsAt: "Testphase endet am",
      adminName: "Name der ersten Praxisadmin-Person",
      adminEmail: "E-Mail-Adresse",
      adminEmailHint:
        "Die Person erhält einen sicheren Einladungslink und legt ihr eigenes Passwort fest. Es werden keine gemeinsamen Zugangsdaten vergeben.",
      submit: "Praxis anlegen",
      back: "Zurück",
      next: "Weiter",
      successHeading: "Praxis wurde angelegt",
      successBody: "Die Praxis ist eingerichtet. Teilen Sie den folgenden Einladungslink mit der ersten Praxisadmin-Person.",
      inviteLinkLabel: "Einladungslink (einmalig, 7 Tage gültig)",
      copyLink: "Link kopieren",
      copied: "Kopiert",
      noEmailProviderHint:
        "Es ist noch kein E-Mail-Versand eingerichtet. Kopieren Sie den Link und senden Sie ihn selbst, oder öffnen Sie Mailpit für die lokale Entwicklung.",
      goToPractice: "Zur Praxis",
      errorGeneric: "Die Praxis konnte nicht angelegt werden. Bitte versuchen Sie es erneut.",
    },
    detail: {
      backToList: "Zurück zur Praxisliste",
      tabProfile: "Stammdaten",
      tabLifecycle: "Status",
      tabMembers: "Mitarbeitende",
      tabSettings: "Einstellungen",
      saveProfile: "Stammdaten speichern",
      saved: "Gespeichert",
      lifecycleHeading: "Praxisstatus",
      lifecycleHint:
        "Sperren entzieht den Zugriff sofort, löscht aber keine Daten. Archivieren ist kein endgültiges Löschen.",
      internalNote: "Interne Betreiber-Notiz (nicht für die Praxis sichtbar)",
      internalNoteHint: "Nur für den Betreiber, keine medizinischen oder patientenbezogenen Inhalte.",
      confirmStatusChange: "Status wirklich ändern?",
      saveLifecycle: "Status speichern",
      membersHeading: "Mitarbeitende",
      membersEmpty: "Noch keine Mitarbeitenden.",
      roleAdmin: "Admin",
      roleTherapist: "Therapeut:in",
      statusActiveLabel: "Aktiv",
      statusInactiveLabel: "Deaktiviert",
      deactivate: "Deaktivieren",
      reactivate: "Reaktivieren",
      changeRole: "Rolle ändern",
      lastAdminProtected: "Der letzte aktive Admin einer Praxis kann nicht entfernt oder herabgestuft werden.",
      resetAccess: "Zugang zurücksetzen",
      resetAccessDialogHeading: "Zugang zurücksetzen",
      resetAccessDialogHint:
        "Für den Fall, dass diese Person sowohl Passwort als auch Zugriff auf die bisherige E-Mail-Adresse verloren hat. Rolle und sämtliche Praxisdaten bleiben unverändert erhalten.",
      resetAccessNewEmail: "Neue E-Mail-Adresse",
      resetAccessSubmit: "Wiederherstellungslink erzeugen",
      resetAccessLinkCreated: "Wiederherstellungslink erstellt. Teilen Sie diesen Link mit der Person:",
      resetAccessHint:
        "Kein automatischer Versand – Link selbst weitergeben. Beim Einlösen wird ein neues Konto mit dieser E-Mail-Adresse angelegt und mit der bestehenden Mitgliedschaft verknüpft.",
      resetAccessError: "Der Wiederherstellungslink konnte nicht erstellt werden.",
      openInvitesHeading: "Offene Einladungen",
      openInvitesEmpty: "Keine offenen Einladungen.",
      inviteNewAdmin: "Weitere Einladung senden (Ausnahmefall)",
      revoke: "Widerrufen",
      renew: "Erneuern",
      connectedPatients: "Verbundene Patient:innen",
      auditHeading: "Betreiber-Verlauf dieser Praxis",
    },
    settingsForm: {
      heading: "Praxis-Einstellungen",
      hint: "Diese Einstellungen wirken sich direkt auf die Praxis- und Patientenoberfläche aus.",
      defaultAppointmentDuration: "Standard-Termindauer (Minuten)",
      cancellationNoticeHours: "Absagefrist (Stunden)",
      cancellationNoticeText: "Hinweistext zur Absagefrist für Patient:innen",
      lowSessionsThreshold: "Warnschwelle verbleibender Behandlungseinheiten",
      patientSafetyText: "Sicherheitshinweis bei starken Schmerzangaben",
      accentColor: "Akzentfarbe",
      save: "Einstellungen speichern",
    },
    config: {
      title: "Plattform-Einstellungen",
      hint: "Diese Einstellungen gelten für die gesamte Plattform, nicht nur eine Praxis.",
      productName: "Produktname",
      supportEmail: "Support-E-Mail",
      supportUrl: "Support-URL",
      privacyUrl: "Datenschutz-URL",
      imprintUrl: "Impressum-URL",
      maintenanceActive: "Wartungshinweis aktiv",
      maintenanceMessage: "Wartungstext",
      defaultTimezone: "Standard-Zeitzone für neue Praxen",
      maxUploadMb: "Maximale Upload-Größe (MB)",
      maxUploadHint: "Fest begrenzt auf maximal 25 MB, unabhängig von dieser Einstellung.",
      save: "Einstellungen speichern",
      featureFlagsHeading: "Funktions-Flags",
      featureFlagAccentColor: "Praxen dürfen eine eigene Akzentfarbe wählen",
      flagEnabled: "Aktiv",
      flagDisabled: "Inaktiv",
      flagDefaultForNew: "Standard für neue Praxen",
    },
    staffInvite: {
      title: "Einladung zu PhysioCheck",
      practiceLabel: "Praxis",
      roleLabel: "Rolle",
      invalidHeading: "Diese Einladung ist nicht mehr gültig",
      invalidBody: "Der Link ist abgelaufen, wurde bereits verwendet oder widerrufen. Bitten Sie um eine neue Einladung.",
      emailMismatchBody:
        "Diese Einladung wurde an eine andere E-Mail-Adresse gesendet. Bitte melden Sie sich mit dem passenden Konto an oder registrieren Sie sich mit genau dieser E-Mail-Adresse.",
      loginPrompt: "Haben Sie bereits ein Konto?",
      loginCta: "Anmelden",
      registerCta: "Neues Konto mit dieser E-Mail-Adresse erstellen",
      confirmHeading: "Einladung annehmen",
      confirmBody: "Möchten Sie dieser Praxis als {role} beitreten?",
      confirmCta: "Einladung annehmen",
      cancelCta: "Abbrechen",
    },
    staffManagement: {
      heading: "Mitarbeitende",
      inviteHeading: "Mitarbeiter:in einladen",
      inviteName: "Name",
      inviteEmail: "E-Mail-Adresse",
      inviteRole: "Rolle",
      inviteSubmit: "Einladung senden",
      inviteLinkCreated: "Einladung erstellt. Teilen Sie diesen Link mit der Person:",
      inviteHint: "Jede Person erhält ein eigenes Konto und legt ihr eigenes Passwort fest.",
    },
    practiceRecovery: {
      title: "Zugang wiederherstellen",
      practiceLabel: "Praxis",
      roleLabel: "Rolle",
      newEmailLabel: "Neue E-Mail-Adresse",
      passwordLabel: "Neues Passwort",
      passwordHint: "Mindestens 10 Zeichen.",
      submitCta: "Zugang wiederherstellen",
      invalidHeading: "Dieser Link ist nicht mehr gültig",
      invalidBody:
        "Der Link ist abgelaufen, wurde bereits verwendet oder widerrufen. Bitten Sie um einen neuen Wiederherstellungslink.",
      emailInUse:
        "Diese E-Mail-Adresse wird bereits verwendet. Bitte um einen neuen Link mit einer anderen E-Mail-Adresse bitten.",
      error: "Der Zugang konnte nicht wiederhergestellt werden. Bitte versuchen Sie es erneut.",
      successLoginPrompt: "Zugang wiederhergestellt. Bitte melden Sie sich jetzt mit Ihrer neuen E-Mail-Adresse an.",
      loginCta: "Anmelden",
    },
  },
} as const;

export type Messages = typeof de;
