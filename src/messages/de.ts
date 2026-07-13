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
      profile: "Profil",
    },
    today: {
      title: "Heute",
      exercisesHeading: "Ihre Übungen heute",
      alreadyLogged: "Heute vollständig dokumentiert",
      greeting: "Guten Tag",
      startExercises: "Heutige Übungen starten",
      progress: (documented: number, total: number) =>
        `${documented} von ${total} geplanten Durchgängen dokumentiert`,
      completionProgress: (completed: number, total: number) =>
        `${completed} von ${total} Durchgängen als erledigt angegeben`,
      occurrenceProgress: (documented: number, total: number) =>
        `${documented} von ${total} Durchgängen dokumentiert`,
      weeklyProgress: (documented: number, total: number) =>
        `${documented} von ${total} Durchgängen in dieser Woche dokumentiert`,
      continueOccurrences: "Weiteren Durchgang dokumentieren",
      documentedNotCompleted:
        "Alle geplanten Durchgänge haben eine Rückmeldung. Mindestens einer wurde nicht als vollständig erledigt angegeben.",
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
      planNote: "Hinweis Ihrer Praxis",
      documentHeading: "Durchführung dokumentieren",
      occurrenceHeading: (current: number, total: number) =>
        `Durchgang ${current} von ${total}`,
      occurrenceProgress: (documented: number, total: number) =>
        `${documented} von ${total} Durchgängen heute dokumentiert`,
      completedProgress: (completed: number, total: number) =>
        `${completed} von ${total} Durchgängen als erledigt angegeben`,
      weeklyProgress: (documented: number, total: number) =>
        `${documented} von ${total} Durchgängen in dieser Woche dokumentiert`,
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
        "Sie haben alle für heute geplanten Durchgänge dokumentiert. Vielen Dank!",
      documentedNotCompleted:
        "Mindestens ein Durchgang wurde als teilweise, zu schwierig oder nicht möglich angegeben und zählt deshalb nicht als vollständig erledigt.",
      errorNotFound:
        "Diese Übung gehört nicht (mehr) zu Ihrem aktuellen Übungsplan.",
      errorAlreadyLogged: "Alle aktuell geplanten Durchgänge sind bereits dokumentiert.",
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
      coverageHint:
        "Der angezeigte Stand dient Ihrer Übersicht. Ob eine Sitzung von der Krankenkasse übernommen wird, richtet sich nach Ihrer Verordnung und den geltenden Bedingungen.",
      empty: "Ihre Praxis hat noch keine Sitzungsanzahl hinterlegt.",
    },
    profile: {
      title: "Profil",
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
        openCaptions: "Untertiteldatei öffnen",
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
      legend: "Farben der Behandelnden",
    },
    settings: {
      title: "Einstellungen",
      practiceData: "Praxisdaten",
      calendarColorTitle: "Meine Kalenderfarbe",
      calendarColorHint:
        "Diese Farbe kennzeichnet Ihre Termine im Praxiskalender. Der Name der behandelnden Person steht immer zusätzlich dabei.",
      calendarColorSave: "Farbe speichern",
      colorSaved: "Kalenderfarbe gespeichert.",
      colorSaveError: "Die Kalenderfarbe konnte nicht gespeichert werden.",
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
} as const;

export type Messages = typeof de;
